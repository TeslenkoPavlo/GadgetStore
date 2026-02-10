import { API_BASE_URL } from '@env';

export const getApiBaseUrl = (): string => API_BASE_URL;

export interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number;
  image: string;
  images?: string[];
  categoryId: string;
  description?: string;
  specs?: { [key: string]: string };
  rating?: number;
  reviews?: number;
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  backgroundColor: string;
  image?: string;
  link?: string;
  isActive: boolean;
}

export interface HomeData {
  categories: Category[];
  featuredProducts: Product[];
  banners: Banner[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, timeout = 10000): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`[API] Fetching: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[API] HTTP Error: ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Success:`, endpoint, `- ${Array.isArray(data.data) ? data.data.length + ' items' : 'data received'}`);
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[API] Error:`, endpoint, error.message);
    throw error;
  }
}

export async function getProducts(options?: {
  category?: string;
  limit?: number;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.limit) params.append('limit', String(options.limit));

  const queryString = params.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  const response = await fetchApi<Product[]>(endpoint);
  return response.data || [];
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetchApi<Product>(`/products/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetchApi<Category[]>('/categories');
  return response.data || [];
}

export async function getBanners(): Promise<Banner[]> {
  const response = await fetchApi<Banner[]>('/banners');
  return response.data || [];
}

export async function getHomeData(): Promise<HomeData> {
  const response = await fetchApi<HomeData>('/home');
  return response.data || { categories: [], featuredProducts: [], banners: [] };
}


export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  token?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthUser;
  error?: string;
  code?: string;
  message?: string;
}

export async function registerUser(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  try {
    console.log(`[API] Registering user: ${email}`);
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, displayName }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[API] Register error: Server returned non-JSON response (${contentType})`);
      return { success: false, error: 'Сервер тимчасово недоступний. Спробуйте пізніше' };
    }

    if (!response.ok) {
      console.error(`[API] Register HTTP error: ${response.status}`);
      return { success: false, error: `Помилка сервера: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[API] Register response:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API] Register error:`, error.message);
    return { success: false, error: 'Помилка мережі. Перевірте підключення' };
  }
}

export async function loginUser(email: string): Promise<AuthResponse> {
  try {
    console.log(`[API] Logging in user: ${email}`);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[API] Login error: Server returned non-JSON response (${contentType})`);
      return { success: false, error: 'Сервер тимчасово недоступний. Спробуйте пізніше' };
    }

    if (!response.ok) {
      console.error(`[API] Login HTTP error: ${response.status}`);
      return { success: false, error: `Помилка сервера: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[API] Login response:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API] Login error:`, error.message);
    return { success: false, error: 'Помилка мережі. Перевірте підключення' };
  }
}

export async function getUser(uid: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${uid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`[API] Get user error:`, error.message);
    return { success: false, error: 'Помилка отримання даних користувача' };
  }
}

export async function updateUser(uid: string, updates: { displayName?: string; photoURL?: string }): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${uid}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`[API] Update user error:`, error.message);
    return { success: false, error: 'Помилка оновлення профілю' };
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: any;
  updatedAt: any;
}

export interface ChatResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${userId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error(`[API] Get conversations error:`, error.message);
    return [];
  }
}

export async function getConversation(userId: string, conversationId: string): Promise<Conversation | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${userId}/${conversationId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.data || null;
  } catch (error: any) {
    console.error(`[API] Get conversation error:`, error.message);
    return null;
  }
}

export async function createConversation(userId: string): Promise<Conversation | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    return data.data || null;
  } catch (error: any) {
    console.error(`[API] Create conversation error:`, error.message);
    return null;
  }
}

export async function sendChatMessage(
  userId: string,
  conversationId: string,
  message: string
): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage; title?: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, conversationId, message }),
    });
    const data = await response.json();
    return data.data || null;
  } catch (error: any) {
    console.error(`[API] Send chat message error:`, error.message);
    return null;
  }
}

export async function deleteConversation(userId: string, conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${userId}/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.success || false;
  } catch (error: any) {
    console.error(`[API] Delete conversation error:`, error.message);
    return false;
  }
}

