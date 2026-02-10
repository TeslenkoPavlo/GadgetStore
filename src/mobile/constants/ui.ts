import { type Ionicons } from '@expo/vector-icons';

export const CATEGORY_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  smartphones: 'phone-portrait',
  tablets: 'tablet-portrait',
  laptops: 'laptop',
  smartwatches: 'watch',
  headphones: 'headset',
  consoles: 'game-controller',
  cameras: 'camera',
  accessories: 'extension-puzzle',
  audio: 'volume-high',
  tv: 'tv',
};

export function getCategoryIcon(categoryId: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[categoryId] || 'grid';
}

export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceLight: '#EEEEEE',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  border: '#E5E7EB',
  card: '#FFFFFF',
  searchBg: '#F0F0F0',
};


