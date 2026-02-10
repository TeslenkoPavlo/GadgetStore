import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { type Product } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

const WISHLIST_STORAGE_KEY = 'wishlist_';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  getWishlistCount: () => number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadWishlist = async () => {
      if (user?.uid) {
        setIsLoading(true);
        try {
          const key = `${WISHLIST_STORAGE_KEY}${user.uid}`;
          const savedItems = await AsyncStorage.getItem(key);
          if (savedItems) {
            setItems(JSON.parse(savedItems));
          } else {
            setItems([]);
          }
        } catch (error) {
          console.error('[WishlistContext] Error loading wishlist:', error);
          setItems([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setItems([]);
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [user?.uid]);

  useEffect(() => {
    const saveWishlist = async () => {
      if (user?.uid && !isLoading) {
        try {
          const key = `${WISHLIST_STORAGE_KEY}${user.uid}`;
          await AsyncStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
          console.error('[WishlistContext] Error saving wishlist:', error);
        }
      }
    };

    saveWishlist();
  }, [items, user?.uid, isLoading]);

  const addToWishlist = useCallback((product: Product) => {
    setItems(currentItems => {
      const exists = currentItems.some(item => item.id === product.id);
      if (exists) {
        return currentItems;
      }
      return [...currentItems, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setItems(currentItems => {
      const exists = currentItems.some(item => item.id === product.id);
      if (exists) {
        return currentItems.filter(item => item.id !== product.id);
      }
      return [...currentItems, product];
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const clearWishlist = useCallback(async () => {
    setItems([]);
    if (user?.uid) {
      try {
        const key = `${WISHLIST_STORAGE_KEY}${user.uid}`;
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('[WishlistContext] Error clearing wishlist:', error);
      }
    }
  }, [user?.uid]);

  const getWishlistCount = useCallback(() => {
    return items.length;
  }, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistCount,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
