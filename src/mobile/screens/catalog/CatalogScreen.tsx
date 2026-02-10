import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { Ionicons } from '@expo/vector-icons';

import { type Category, type Product } from '@/services/api';
import { getCategoryIcon } from '@/constants';

const { width } = Dimensions.get('window');


interface CatalogScreenProps {
  categories: Category[];
  searchQuery: string;
  isSearching: boolean;
  searchResults: Product[];
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    card: string;
  };
  cartCount: number;
  shouldAnimate: boolean;
  searchAnimated: boolean;
  onSearch: (query: string) => void;
  onCategoryPress: (category: Category) => void;
  onAddToCart: (product: Product) => void;
  onCartPress: () => void;
  onProductPress?: (product: Product) => void;
  onSearchAnimationComplete?: () => void;
  ProductCardComponent: React.ComponentType<{ product: Product; colors: any; onAddToCart: (product: Product) => void }>;
}

export function CatalogScreen({
  categories,
  searchQuery,
  isSearching,
  searchResults,
  colors,
  cartCount,
  shouldAnimate,
  searchAnimated,
  onSearch,
  onCategoryPress,
  onAddToCart,
  onCartPress,
  onProductPress,
  onSearchAnimationComplete,
}: CatalogScreenProps) {
  const insets = useSafeAreaInsets();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (isSearching && searchResults.length > 0 && !searchAnimated && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const timer = setTimeout(() => {
        onSearchAnimationComplete?.();
      }, 300 + searchResults.length * 50);
      return () => clearTimeout(timer);
    }
  }, [isSearching, searchResults.length, searchAnimated, onSearchAnimationComplete]);

  useEffect(() => {
    if (!isSearching) {
      hasAnimatedRef.current = false;
    }
  }, [isSearching]);

  const bgColor = '#FFFFFF';
  const titleColor = '#1A1A1A';
  const searchBgColor = '#F3F4F6';
  const searchTextColor = '#1A1A1A';
  const placeholderColor = '#9CA3AF';
  const tileBgColor = '#F5F7F8';
  const iconCircleBg = '#1A1A1A';
  const iconColor = '#FFFFFF';
  const categoryNameColor = '#1A1A1A';


  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: titleColor }]}>Каталог</Text>
        <Pressable onPress={onCartPress} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={26} color={titleColor} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: searchBgColor }]}>
          <Ionicons name="search" size={20} color={placeholderColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: searchTextColor }]}
            placeholder="Пошук"
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={onSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearch('')}>
              <Ionicons name="close" size={20} color={placeholderColor} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isSearching ? (
          searchResults.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {searchResults.map((product, index) => {
                const shouldAnimateItem = !searchAnimated;
                return (
                  <MotiView
                    key={product.id}
                    from={shouldAnimateItem ? { translateY: 20 } : { translateY: 0 }}
                    animate={{ translateY: 0 }}
                    transition={{
                      type: 'timing',
                      duration: shouldAnimateItem ? 300 : 0,
                      delay: shouldAnimateItem ? index * 50 : 0
                    }}
                  >
                    <SearchProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      onPress={() => onProductPress?.(product)}
                      isLast={index === searchResults.length - 1}
                      colors={colors}
                    />
                  </MotiView>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptySearch}>
              <Text style={[styles.emptyText, { color: placeholderColor }]}>Нічого не знайдено</Text>
            </View>
          )
        ) : (
          <View style={styles.catalogGrid}>
            {categories.map((cat, index) => (
              <MotiView
                key={cat.id}
                from={shouldAnimate ? { opacity: 0, translateY: 20 } : { opacity: 1, translateY: 0 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: shouldAnimate ? 300 : 0,
                  delay: shouldAnimate ? index * 50 : 0,
                }}
              >
                <MotiPressable
                  onPress={() => onCategoryPress(cat)}
                  animate={({ pressed }) => {
                    'worklet';
                    return {
                      scale: pressed ? 0.97 : 1,
                      opacity: pressed ? 0.9 : 1,
                    };
                  }}
                  transition={{
                    type: 'timing',
                    duration: 100,
                  }}
                  style={[styles.categoryTile, { backgroundColor: tileBgColor }]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
                    <Ionicons
                      name={getCategoryIcon(cat.id)}
                      size={24}
                      color={iconColor}
                    />
                  </View>
                  <Text style={[styles.categoryName, { color: categoryNameColor }]}>{cat.name || ''}</Text>
                </MotiPressable>
              </MotiView>
            ))}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const SearchProductCard = React.memo(function SearchProductCard({ product, onAddToCart, onPress, isLast = false, colors }: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onPress?: () => void;
  isLast?: boolean;
  colors: CatalogScreenProps['colors'];
}) {
  const discountedPrice = product.discount ? product.price - (product.price * product.discount) / 100 : product.price;
  const cardHeight = 280;
  const imageHeight = cardHeight * 0.7;

  const cardBg = '#FFFFFF';
  const imageBg = '#FFFFFF';
  const textColor = '#1A1A1A';
  const priceColor = '#1A1A1A';
  const wishlistBtnBg = '#F5F5F5';
  const wishlistIconColor = '#1A1A1A';
  const cartBtnBg = '#1A1A1A';
  const cartIconColor = '#FFFFFF';
  const borderColor = '#D1D5DB';
  const elementBorderColor = 'rgba(0, 0, 0, 0.08)';

  return (
    <Pressable onPress={onPress} style={[styles.searchProductCard, isLast && styles.searchProductCardLast, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
      <View style={[styles.searchProductImageContainer, { height: imageHeight, backgroundColor: imageBg, borderColor: elementBorderColor }]}>
        <View style={styles.searchProductImageWrapper}>
          <Image
            source={{ uri: product.image || '' }}
            style={styles.searchProductImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={[styles.searchProductInfoContainer, { backgroundColor: cardBg, borderColor: elementBorderColor }]}>
        <View style={styles.searchProductInfoRow}>
          <View style={styles.searchProductTextContainer}>
            <Text style={[styles.searchProductName, { color: textColor }]} numberOfLines={2}>{product.name || ''}</Text>
            <Text style={[styles.searchProductPrice, { color: priceColor }]}>{`${discountedPrice.toFixed(0)} ₴`}</Text>
          </View>
          <View style={styles.searchProductButtonsContainer}>
            <Pressable
              onPress={(e) => { e.stopPropagation(); }}
              style={[styles.searchProductWishlistBtn, { backgroundColor: wishlistBtnBg, borderColor: elementBorderColor }]}
            >
              <Ionicons name="heart-outline" size={20} color={wishlistIconColor} />
            </Pressable>
            <Pressable
              onPress={(e) => { e.stopPropagation(); onAddToCart(product); }}
              style={[styles.searchProductCartBtn, { backgroundColor: cartBtnBg }]}
            >
              <Ionicons name="cart-outline" size={20} color={cartIconColor} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cartButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  searchResultsContainer: {
    gap: 16,
  },
  emptySearch: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryTile: {
    width: (width - 52) / 2,
    minHeight: 120,
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left',
  },
  searchProductCard: {
    width: '100%',
    gap: 8,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
  },
  searchProductCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  searchProductImageContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchProductImageWrapper: {
    flex: 1,
    padding: '4%',
  },
  searchProductImage: {
    width: '100%',
    height: '100%',
  },
  searchProductInfoContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchProductInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  searchProductTextContainer: {
    flex: 1,
  },
  searchProductName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  searchProductPrice: {
    fontSize: 17,
    fontWeight: '700',
  },
  searchProductButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchProductWishlistBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchProductCartBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
