import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { type Product } from '@/services/api';
import { saveCart, getCart, clearUserCart, CartItem } from '@/services/storage';
import { AuthContext } from './AuthContext';

export type { CartItem };

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
  getUniqueItemsCount: () => number;
  isInCart: (productId: string) => boolean;
  canAddToCart: () => boolean;
  isLoading: boolean;
}

const MAX_UNIQUE_ITEMS = 5;
const CartContext = createContext<CartContextType | undefined>(undefined);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadCart = async () => {
      if (user?.uid) {
        setIsLoading(true);
        try {
          const savedItems = await getCart(user.uid);
          setItems(savedItems);
        } catch (error) {
          console.error('[CartContext] Error loading cart:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setItems([]);
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user?.uid]);

  useEffect(() => {
    const persistCart = async () => {
      if (user?.uid && !isLoading) {
        await saveCart(user.uid, items);
      }
    };

    persistCart();
  }, [items, user?.uid, isLoading]);

  const addToCart = useCallback((product: Product): boolean => {
    let added = false;
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= 10) {
          return currentItems;
        }
        added = true;
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
            : item
        );
      }
      if (currentItems.length >= MAX_UNIQUE_ITEMS) {
        added = false;
        return currentItems;
      }
      added = true;
      return [...currentItems, { product, quantity: 1 }];
    });
    return added;
  }, []);
  const removeFromCart = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  }, []);
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const validQuantity = Math.max(1, Math.min(10, quantity));
    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: validQuantity }
          : item
      )
    );
  }, []);
  const clearCart = useCallback(async () => {
    setItems([]);
    if (user?.uid) {
      await clearUserCart(user.uid);
    }
  }, [user?.uid]);
  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const price = item.product.discount
        ? item.product.price - (item.product.price * item.product.discount) / 100
        : item.product.price;
      return total + price * item.quantity;
    }, 0);
  }, [items]);
  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);
  const getUniqueItemsCount = useCallback(() => {
    return items.length;
  }, [items]);
  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId);
  }, [items]);
  const canAddToCart = useCallback(() => {
    return items.length < MAX_UNIQUE_ITEMS;
  }, [items]);
  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getUniqueItemsCount,
        isInCart,
        canAddToCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
