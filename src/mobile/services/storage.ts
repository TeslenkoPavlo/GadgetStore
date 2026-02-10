import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Product, type Category, type Banner } from './api';

const STORAGE_KEYS = {
  PRODUCTS: '@gadgetstore_products',
  CATEGORIES: '@gadgetstore_categories',
  BANNERS: '@gadgetstore_banners',
  LAST_UPDATED: '@gadgetstore_last_updated',
  USER: '@gadgetstore_user',
};

const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

export const cacheProducts = async (products: Product[]): Promise<void> => {
  try {
    const cachedData: CachedData<Product[]> = {
      data: products,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cachedData));
    console.log('[Cache] Products saved:', products.length);
  } catch (error) {
    console.error('[Cache] Error saving products:', error);
  }
};

export const getCachedProducts = async (): Promise<Product[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!cached) return null;

    const cachedData: CachedData<Product[]> = JSON.parse(cached);

    if (!isCacheValid(cachedData.timestamp)) {
      console.log('[Cache] Products cache expired');
      return null;
    }

    console.log('[Cache] Products loaded from cache:', cachedData.data.length);
    return cachedData.data;
  } catch (error) {
    console.error('[Cache] Error loading products:', error);
    return null;
  }
};

export const cacheCategories = async (categories: Category[]): Promise<void> => {
  try {
    const cachedData: CachedData<Category[]> = {
      data: categories,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cachedData));
    console.log('[Cache] Categories saved:', categories.length);
  } catch (error) {
    console.error('[Cache] Error saving categories:', error);
  }
};

export const getCachedCategories = async (): Promise<Category[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!cached) return null;

    const cachedData: CachedData<Category[]> = JSON.parse(cached);

    if (!isCacheValid(cachedData.timestamp)) {
      console.log('[Cache] Categories cache expired');
      return null;
    }

    console.log('[Cache] Categories loaded from cache:', cachedData.data.length);
    return cachedData.data;
  } catch (error) {
    console.error('[Cache] Error loading categories:', error);
    return null;
  }
};

export const cacheBanners = async (banners: Banner[]): Promise<void> => {
  try {
    const cachedData: CachedData<Banner[]> = {
      data: banners,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(cachedData));
    console.log('[Cache] Banners saved:', banners.length);
  } catch (error) {
    console.error('[Cache] Error saving banners:', error);
  }
};

export const getCachedBanners = async (): Promise<Banner[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.BANNERS);
    if (!cached) return null;

    const cachedData: CachedData<Banner[]> = JSON.parse(cached);

    if (!isCacheValid(cachedData.timestamp)) {
      console.log('[Cache] Banners cache expired');
      return null;
    }

    console.log('[Cache] Banners loaded from cache:', cachedData.data.length);
    return cachedData.data;
  } catch (error) {
    console.error('[Cache] Error loading banners:', error);
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PRODUCTS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.BANNERS,
      STORAGE_KEYS.LAST_UPDATED,
    ]);
    console.log('[Cache] Cache cleared');
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
};

export const hasCachedData = async (): Promise<boolean> => {
  try {
    const products = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return products !== null;
  } catch (error) {
    return false;
  }
};


export interface StoredUser {
  uid: string;
  email: string;
  displayName?: string;
  token?: string;
}

export const saveUser = async (user: StoredUser): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    console.log('[Storage] User saved:', user.email);
  } catch (error) {
    console.error('[Storage] Error saving user:', error);
  }
};

export const getUser = async (): Promise<StoredUser | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!userData) return null;

    const user: StoredUser = JSON.parse(userData);
    console.log('[Storage] User loaded:', user.email);
    return user;
  } catch (error) {
    console.error('[Storage] Error loading user:', error);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    console.log('[Storage] User removed');
  } catch (error) {
    console.error('[Storage] Error removing user:', error);
  }
};

export const isUserLoggedIn = async (): Promise<boolean> => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user !== null;
  } catch (error) {
    return false;
  }
};

export interface CartItem {
  product: Product;
  quantity: number;
}

const getCartKey = (userId: string): string => `@gadgetstore_cart_${userId}`;

export const saveCart = async (userId: string, items: CartItem[]): Promise<void> => {
  try {
    const key = getCartKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(items));
    console.log('[Cart] Cart saved for user:', userId, 'items:', items.length);
  } catch (error) {
    console.error('[Cart] Error saving cart:', error);
  }
};

export const getCart = async (userId: string): Promise<CartItem[]> => {
  try {
    const key = getCartKey(userId);
    const cartData = await AsyncStorage.getItem(key);
    if (!cartData) return [];

    const items: CartItem[] = JSON.parse(cartData);
    console.log('[Cart] Cart loaded for user:', userId, 'items:', items.length);
    return items;
  } catch (error) {
    console.error('[Cart] Error loading cart:', error);
    return [];
  }
};

export const clearUserCart = async (userId: string): Promise<void> => {
  try {
    const key = getCartKey(userId);
    await AsyncStorage.removeItem(key);
    console.log('[Cart] Cart cleared for user:', userId);
  } catch (error) {
    console.error('[Cart] Error clearing cart:', error);
  }
};

