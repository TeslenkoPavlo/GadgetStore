import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { CartProvider, useCart } from '@/context/CartContext';
import { AuthContext } from '@/context/AuthContext';
import * as storage from '@/services/storage';
import { type Product } from '@/services/api';

// Mock storage to prevent actual I/O during tests
jest.mock('@/services/storage', () => ({
    getCart: jest.fn(() => Promise.resolve([])),
    saveCart: jest.fn(() => Promise.resolve()),
    clearUserCart: jest.fn(() => Promise.resolve()),
}));

// Mock AuthProvider to wrap our CartProvider
const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    // @ts-ignore - only mocking needed properties for the test
    <AuthContext.Provider value={{ user: { uid: 'test-user' } }}>
        <CartProvider>{children}</CartProvider>
    </AuthContext.Provider>
);

// Helper to safely mount hook and wait for initial async effects to settle
const renderCartHook = async () => {
    const utils = renderHook(() => useCart(), { wrapper: createWrapper() });
    await waitFor(() => {
        expect(utils.result.current.isLoading).toBe(false);
    });
    return utils;
};

// Helper to create mock products based on server structure
const createProduct = (id: string, price: number, discount: number = 0): Product => ({
    id,
    name: `Acer Predator Helios Neo 16 AI ${id}`,
    description: 'Acer Predator Helios Neo 16 AI — це потужний ігровий ноутбук 2025 року з інтегрованим штучним інтелектом.',
    categoryId: 'laptops',
    price,
    discount,
    image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/laptops%2Facer-predator-helios%2F0.jpg?alt=media',
    images: [
        'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/laptops%2Facer-predator-helios%2F0.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/laptops%2Facer-predator-helios%2F1.jpg?alt=media'
    ],
    rating: 4.2,
    reviews: 15,
    inStock: true,
    specs: {
        'Процесор': 'Core Ultra 7, 255HX, 1.8 ГГц',
        'ОЗП': '16 ГБ',
        'Накопичувач': 'SSD M.2 NVMe, 1 ТБ'
    }
});

describe('CartContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addToCart', () => {
        it('increases getUniqueItemsCount by 1 when adding a new product', async () => {
            const { result } = await renderCartHook();

            act(() => {
                result.current.addToCart(createProduct('1', 100));
            });

            expect(result.current.getUniqueItemsCount()).toBe(1);
        });

        it('returns false when trying to add a 6th unique product (MAX_UNIQUE_ITEMS = 5 limit)', async () => {
            const { result } = await renderCartHook();

            act(() => {
                result.current.addToCart(createProduct('1', 10));
                result.current.addToCart(createProduct('2', 20));
                result.current.addToCart(createProduct('3', 30));
                result.current.addToCart(createProduct('4', 40));
                result.current.addToCart(createProduct('5', 50));
            });

            expect(result.current.getUniqueItemsCount()).toBe(5);

            let success;
            act(() => {
                success = result.current.addToCart(createProduct('6', 60));
            });

            expect(success).toBe(false);
            expect(result.current.getUniqueItemsCount()).toBe(5); // Should remain 5
        });

        it('limits the quantity of a single product to 10', async () => {
            const { result } = await renderCartHook();
            const product = createProduct('1', 100);

            act(() => {
                // Add 11 times
                for (let i = 0; i < 11; i++) {
                    result.current.addToCart(product);
                }
            });

            const itemInCart = result.current.items.find(item => item.product.id === '1');
            expect(itemInCart?.quantity).toBe(10);
        });
    });

    describe('getCartTotal', () => {
        it('calculates the correct total for items without a discount', async () => {
            const { result } = await renderCartHook();

            act(() => {
                result.current.addToCart(createProduct('1', 100));
                result.current.addToCart(createProduct('1', 100)); // Quantity 2 = 200
                result.current.addToCart(createProduct('2', 50)); // Quantity 1 = 50
            });

            expect(result.current.getCartTotal()).toBe(250);
        });

        it('calculates the correct total for items with a discount', async () => {
            const { result } = await renderCartHook();

            act(() => {
                // Price 200, but 10% discount -> costs 180. Quantity 2 = 360
                result.current.addToCart(createProduct('1', 200, 10));
                result.current.addToCart(createProduct('1', 200, 10));
            });

            expect(result.current.getCartTotal()).toBe(360);
        });
    });

    describe('updateQuantity', () => {
        it('enforces boundaries: sets to 1 if < 1 and 10 if > 10', async () => {
            const { result } = await renderCartHook();
            const product = createProduct('1', 100);

            act(() => {
                result.current.addToCart(product);
            });

            // Try setting below 1
            act(() => {
                result.current.updateQuantity('1', 0);
            });
            expect(result.current.items.find(i => i.product.id === '1')?.quantity).toBe(1);

            act(() => {
                result.current.updateQuantity('1', -5);
            });
            expect(result.current.items.find(i => i.product.id === '1')?.quantity).toBe(1);

            // Try setting above 10
            act(() => {
                result.current.updateQuantity('1', 15);
            });
            expect(result.current.items.find(i => i.product.id === '1')?.quantity).toBe(10);
        });
    });
});
