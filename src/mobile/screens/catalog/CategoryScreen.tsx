import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';

import { type RootStackParamList } from '@/navigation/RootNavigator';
import { getProducts, type Product } from '@/services/api';
import { getCachedProducts, cacheProducts } from '@/services/storage';
import { lightTheme, getCategoryIcon } from '@/constants';
import { LoadingSpinner } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

type CategoryScreenRouteProp = RouteProp<RootStackParamList, 'Category'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CategoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CategoryScreenRouteProp>();
  const { category } = route.params;
  const { addToCart, isInCart, canAddToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);

  const COLORS = lightTheme;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const cachedProducts = await getCachedProducts();

        if (cachedProducts && cachedProducts.length > 0) {
          console.log('[CategoryScreen] Loading from cache');
          setAllProducts(cachedProducts);
          const categoryProducts = cachedProducts.filter(p => p.categoryId === category.id);
          setProducts(categoryProducts);
          setIsLoading(false);
          return;
        }

        console.log('[CategoryScreen] Loading from API');
        const [categoryProducts, allProds] = await Promise.all([
          getProducts({ category: category.id }),
          getProducts({ limit: 100 }),
        ]);
        setProducts(categoryProducts);
        setAllProducts(allProds);

        if (allProds?.length) {
          await cacheProducts(allProds);
        }
      } catch (error) {
        console.error('[CategoryScreen] Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [category.id]);

  const handleProductPress = (product: Product) => {
    const relatedProducts = allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 6);
    navigation.navigate('ProductDetail', { product, relatedProducts });
  };

  const handleAddToCart = useCallback((product: Product) => {
    const alreadyInCart = isInCart(product.id);

    if (!alreadyInCart && !canAddToCart()) {
      setIsLimitModalVisible(true);
      return;
    }

    const added = addToCart(product);
    if (!added) {
      setIsLimitModalVisible(true);
      return;
    }

    setAddedProducts(prev => new Set(prev).add(product.id));

    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 5000);
  }, [addToCart, isInCart, canAddToCart]);

  const handleGoToCart = useCallback(() => {
    navigation.navigate('Cart');
  }, [navigation]);

  const iconCircleBg = '#1A1A1A';
  const iconCircleColor = '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <MotiView
        from={{ translateY: -20 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: COLORS.surface }]}>
            <Ionicons name="chevron-back" size={26} color={COLORS.text} />
          </Pressable>
          <View style={[styles.categoryIconCircle, { backgroundColor: iconCircleBg }]}>
            <Ionicons
              name={getCategoryIcon(category.id)}
              size={20}
              color={iconCircleColor}
            />
          </View>
          <Text style={[styles.categoryTitle, { color: COLORS.text }]}>
            {category.name}
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: COLORS.border }]} />
      </MotiView>

      {isLoading ? (
        <LoadingSpinner size={60} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 16 }}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ translateY: 30 }}
              animate={{ translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: index * 80 }}
            >
              <CategoryProductCard
                product={item}
                onAddToCart={() => handleAddToCart(item)}
                onGoToCart={handleGoToCart}
                onPress={() => handleProductPress(item)}
                isLast={index === products.length - 1}
                isAdded={addedProducts.has(item.id)}
                isWishlisted={isInWishlist(item.id)}
                onToggleWishlist={() => toggleWishlist(item)}
              />
            </MotiView>
          )}
        />
      )}

      <Modal visible={isLimitModalVisible} transparent animationType="fade">
        <View style={styles.limitModalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.limitModalContent}
          >
            <View style={styles.limitModalIconCircle}>
              <Ionicons name="cart" size={40} color="#1A1A1A" />
            </View>
            <Text style={styles.limitModalTitle}>Кошик заповнено</Text>
            <Text style={styles.limitModalMessage}>
              Ви можете додати не більше 5 різних товарів до кошика. Видаліть один з товарів, щоб додати новий.
            </Text>
            <View style={styles.limitModalButtons}>
              <Pressable
                style={styles.limitModalCancelBtn}
                onPress={() => setIsLimitModalVisible(false)}
              >
                <Text style={styles.limitModalCancelText}>Закрити</Text>
              </Pressable>
              <Pressable
                style={styles.limitModalConfirmBtn}
                onPress={() => {
                  setIsLimitModalVisible(false);
                  navigation.navigate('Cart');
                }}
              >
                <Text style={styles.limitModalConfirmText}>До кошика</Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CategoryProductCard({ product, onAddToCart, onGoToCart, onPress, isLast = false, isAdded, isWishlisted, onToggleWishlist }: {
  product: Product;
  onAddToCart: () => void;
  onGoToCart: () => void;
  onPress?: () => void;
  isLast?: boolean;
  isAdded: boolean;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}) {
  const discountedPrice = product.discount ? product.price - (product.price * product.discount) / 100 : product.price;
  const cardHeight = 280;
  const imageHeight = cardHeight * 0.7;

  const cardBg = '#FFFFFF';
  const imageBg = '#FFFFFF';
  const textColor = '#1A1A1A';
  const priceColor = '#1A1A1A';
  const wishlistBtnBg = isWishlisted ? '#1A1A1A' : '#F5F5F5';
  const wishlistIconColor = isWishlisted ? '#FFFFFF' : '#1A1A1A';
  const borderColor = '#D1D5DB';
  const elementBorderColor = 'rgba(0, 0, 0, 0.08)';

  return (
    <Pressable onPress={onPress} style={[styles.categoryProductCard, isLast && styles.categoryProductCardLast, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
      <View style={[styles.categoryProductImageContainer, { height: imageHeight, backgroundColor: imageBg, borderColor: elementBorderColor }]}>
        <View style={styles.categoryProductImageWrapper}>
          <Image
            source={{ uri: product.image || '' }}
            style={styles.categoryProductImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={[styles.categoryProductInfoContainer, { backgroundColor: cardBg, borderColor: elementBorderColor }]}>
        <View style={styles.categoryProductInfoRow}>
          <View style={styles.categoryProductTextContainer}>
            <Text style={[styles.categoryProductName, { color: textColor }]} numberOfLines={2}>{product.name || ''}</Text>
            <Text style={[styles.categoryProductPrice, { color: priceColor }]}>{`${discountedPrice.toFixed(0)} ₴`}</Text>
          </View>
          <View style={styles.categoryProductButtonsContainer}>
            <Pressable
              onPress={(e) => { e.stopPropagation(); onToggleWishlist(); }}
              style={[styles.categoryProductWishlistBtn, { backgroundColor: wishlistBtnBg, borderColor: elementBorderColor }]}
            >
              <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={20} color={wishlistIconColor} />
            </Pressable>
<Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (isAdded) {
                  onGoToCart();
                } else {
                  onAddToCart();
                }
              }}
              style={styles.categoryProductCartBtn}
            >
              <Ionicons
                name={isAdded ? "checkmark" : "cart-outline"}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 20, fontWeight: '700' },
  separator: { height: 1, marginHorizontal: 16, marginBottom: 16 },
  categoryProductCard: {
    width: '100%',
    gap: 8,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
  },
  categoryProductCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  categoryProductImageContainer: {
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
  categoryProductImageWrapper: {
    flex: 1,
    padding: '4%',
  },
  categoryProductImage: {
    width: '100%',
    height: '100%',
  },
  categoryProductInfoContainer: {
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
  categoryProductInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryProductTextContainer: {
    flex: 1,
  },
  categoryProductName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  categoryProductPrice: {
    fontSize: 17,
    fontWeight: '700',
  },
  categoryProductButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryProductWishlistBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryProductCartBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  limitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  limitModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  limitModalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  limitModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  limitModalMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  limitModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  limitModalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  limitModalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
