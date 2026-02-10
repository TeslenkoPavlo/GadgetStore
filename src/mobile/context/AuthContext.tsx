import { createContext } from 'react';
import { StoredUser } from '@/services/storage';

export interface AuthContextType {
  user: StoredUser | null;
  logout: () => Promise<void>;
  updateUser: (user: StoredUser) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
  updateUser: () => {},
});
