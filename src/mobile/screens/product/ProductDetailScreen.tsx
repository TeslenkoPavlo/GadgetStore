import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  FlatList,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import { type Product, getProducts } from '@/services/api';
import { getCachedProducts, cacheProducts } from '@/services/storage';
import { lightTheme } from '@/constants';
import { type RootStackParamList } from '@/navigation/RootNavigator';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const { width } = Dimensions.get('window');

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.imageModalImageWrapper, animatedStyle]}>
        <Image
          source={{ uri: uri || '' }}
          style={styles.imageModalImage}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}


export function ProductDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProductDetailRouteProp>();
  const { product, relatedProducts } = route.params;
  const { addToCart, isInCart, canAddToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const imageListRef = useRef<FlatList>(null);
  const colors = lightTheme;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const cachedProducts = await getCachedProducts();

        if (cachedProducts && cachedProducts.length > 0) {
          console.log('[ProductDetail] Loading from cache');
          setAllProducts(cachedProducts);
          return;
        }

        console.log('[ProductDetail] Loading from API');
        const products = await getProducts({ limit: 100 });
        if (products?.length) {
          setAllProducts(products);
          await cacheProducts(products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    setActiveImageIndex(0);
    setModalImageIndex(0);
    setIsAddedToCart(false);
    if (imageListRef.current) {
      imageListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [product.id]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddToCart = useCallback(() => {
    if (isAddedToCart) {
      navigation.navigate('Cart');
    } else {
      const alreadyInCart = isInCart(product.id);

      if (!alreadyInCart && !canAddToCart()) {
        setIsLimitModalVisible(true);
        return;
      }

      const added = addToCart(product);
      if (added) {
        setIsAddedToCart(true);
        setTimeout(() => {
          setIsAddedToCart(false);
        }, 5000);
      } else {
        setIsLimitModalVisible(true);
      }
    }
  }, [isAddedToCart, addToCart, product, navigation, isInCart, canAddToCart]);

  const handleWishlist = () => {
    toggleWishlist(product);
  };

  const handleProductPress = (newProduct: Product) => {
    const newRelatedProducts = allProducts
      .filter(p => p.categoryId === newProduct.categoryId && p.id !== newProduct.id)
      .slice(0, 6);
    navigation.push('ProductDetail', { product: newProduct, relatedProducts: newRelatedProducts });
  };

  const blockBg = '#FFFFFF';
  const elementBorderColor = 'rgba(0, 0, 0, 0.08)';
  const tabTextColor = '#1A1A1A';
  const tabInactiveColor = '#9CA3AF';
  const tabBorderColor = '#1A1A1A';
  const indicatorActiveColor = '#1A1A1A';
  const indicatorInactiveColor = 'rgba(0, 0, 0, 0.2)';
  const relatedImageBg = '#FFFFFF';
  const bottomBarBg = '#FFFFFF';
  const cartBtnBg = '#1A1A1A';
  const cartBtnText = '#FFFFFF';

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const specs = product.specs || {};
  const description = product.description || '';
  const rating = product.rating || 0;
  const reviews = product.reviews || 0;

  const productImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images.filter((img) => img && img.trim() !== '' && !img.includes('undefined'));
    }
    return product.image ? [product.image] : [];
  }, [product.images, product.image]);

  const handleImageScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(index);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={16}
        color="#F59E0B"
      />
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <MotiView
        from={{ translateY: -20 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {product.name || ''}
          </Text>
          <View style={styles.headerBtnPlaceholder} />
        </View>
      </MotiView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <MotiView
          from={{ translateY: 30, scale: 0.98 }}
          animate={{ translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 50 }}
          style={styles.imageBlockWrapper}
        >
          <View style={[styles.imageContainer, { backgroundColor: blockBg, borderColor: elementBorderColor }]}>
            <FlatList
              ref={imageListRef}
              data={productImages}
              horizontal
              pagingEnabled
              scrollEnabled={productImages.length > 1}
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `${product.id}-image-${index}`}
              renderItem={({ item }) => (
                <Pressable onPress={() => { setModalImageIndex(activeImageIndex); setIsImageModalVisible(true); }} style={styles.productImageWrapper}>
                  <Image
                    source={{ uri: item || '' }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            />
          </View>
          {productImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageIndicator,
                    { backgroundColor: index === activeImageIndex ? indicatorActiveColor : indicatorInactiveColor },
                  ]}
                />
              ))}
            </View>
          )}
        </MotiView>


        <MotiView
          from={{ translateY: 30 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.infoBlockWrapper}
        >
          <View style={[styles.infoContainer, { backgroundColor: blockBg, borderColor: elementBorderColor }]}>
            <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>


            <View style={styles.priceRow}>
              <Text style={[styles.currentPrice, { color: colors.text }]}>{`${discountedPrice.toFixed(0)} ₴`}</Text>
              {(product.discount || 0) > 0 && (
                <Text style={[styles.oldPrice, { color: colors.textSecondary }]}>{`${product.price} ₴`}</Text>
              )}
            </View>

            <View style={styles.stockContainer}>
              <View style={[styles.stockBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#1A1A1A" />
                <Text style={[styles.stockText, { color: '#1A1A1A' }]}>В наявності</Text>
              </View>
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ translateY: 30 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
          style={styles.tabsBlockWrapper}
        >
          <View style={[styles.tabsBlock, { backgroundColor: blockBg, borderColor: elementBorderColor }]}>
            <View style={[styles.tabsContainer, { borderBottomColor: elementBorderColor }]}>
              {(['description', 'specs', 'reviews'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.tabActive,
                    activeTab === tab && { borderBottomColor: tabBorderColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === tab ? tabTextColor : tabInactiveColor },
                    ]}
                  >
                    {tab === 'description' ? 'Опис' : tab === 'specs' ? 'Характеристики' : 'Відгуки'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.tabContent}>
              {activeTab === 'description' && (
                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                  {description || 'Опис товару відсутній'}
                </Text>
              )}
              {activeTab === 'specs' && (
                <View style={styles.specsContainer}>
                  {Object.entries(specs).length > 0 ? (
                    Object.entries(specs).map(([key, value], index, arr) => (
                      <View
                        key={key}
                        style={[
                          styles.specRow,
                          { borderBottomColor: elementBorderColor },
                          index === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{key}</Text>
                        <Text style={[styles.specValue, { color: colors.text }]}>{String(value)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                      Характеристики відсутні
                    </Text>
                  )}
                </View>
              )}
              {activeTab === 'reviews' && (
                <View style={styles.reviewsContainer}>
                  <View style={styles.reviewsLeft}>
                    <Text style={[styles.reviewsBigRating, { color: colors.text }]}>{rating.toFixed(1)}</Text>
                    <View style={styles.starsContainer}>{renderStars(rating)}</View>
                    <Text style={[styles.reviewsTotalCount, { color: colors.textSecondary }]}>
                      {reviews} оцінок
                    </Text>
                  </View>
                  <View style={styles.reviewsRight}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const getPercentage = (starLevel: number) => {
                        if (reviews === 0) return 0;
                        const diff = Math.abs(starLevel - rating);
                        if (diff < 0.5) return 60;
                        if (diff < 1) return 25;
                        if (diff < 1.5) return 10;
                        if (diff < 2) return 4;
                        return 1;
                      };
                      const percentage = getPercentage(star);
                      return (
                        <View key={star} style={styles.ratingBarRow}>
                          <Text style={[styles.ratingBarLabel, { color: colors.textSecondary }]}>{star}</Text>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <View style={[styles.ratingBarBg, { backgroundColor: '#E5E7EB' }]}>
                            <View
                              style={[
                                styles.ratingBarFill,
                                {
                                  width: `${percentage}%`,
                                  backgroundColor: '#F59E0B'
                                }
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        </MotiView>

        {relatedProducts.length > 0 && (
          <MotiView
            from={{ translateY: 30 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={styles.relatedSection}
          >
            <Text style={[styles.relatedTitle, { color: colors.text }]}>Схожі товари</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
              {relatedProducts.map((item) => {
                const itemPrice = item.discount
                  ? item.price - (item.price * item.discount) / 100
                  : item.price;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleProductPress(item)}
                    style={[styles.relatedCard, { backgroundColor: blockBg, borderColor: elementBorderColor }]}
                  >
                    <View style={[styles.relatedImageContainer, { backgroundColor: relatedImageBg }]}>
                      <Image source={{ uri: item.image || '' }} style={styles.relatedImage} resizeMode="contain" />
                    </View>
                    <Text style={[styles.relatedName, { color: colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={[styles.relatedPrice, { color: colors.text }]}>{`${itemPrice.toFixed(0)} ₴`}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </MotiView>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <MotiView
        from={{ translateY: 50 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 250 }}
        style={[styles.bottomBar, { backgroundColor: bottomBarBg, borderTopColor: elementBorderColor }]}
      >
        <Pressable
          onPress={handleWishlist}
          style={[styles.wishlistBtn, {
            backgroundColor: isWishlisted ? '#1A1A1A' : blockBg,
            borderColor: elementBorderColor
          }]}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={isWishlisted ? '#FFFFFF' : colors.text}
          />
        </Pressable>
        <Pressable onPress={handleAddToCart} style={[styles.addToCartBtn, { backgroundColor: cartBtnBg }]}>
          <Ionicons name={isAddedToCart ? "checkmark" : "cart-outline"} size={22} color={cartBtnText} />
          {!isAddedToCart && <Text style={[styles.addToCartText, { color: cartBtnText }]}>Додати в кошик</Text>}
        </Pressable>
      </MotiView>

      <Modal visible={isImageModalVisible} transparent animationType="fade" statusBarTranslucent>
        <StatusBar hidden translucent backgroundColor="transparent" />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.imageModalContainer}>
            <Pressable onPress={() => setIsImageModalVisible(false)} style={styles.imageModalCloseBtn}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
            <FlatList
              data={productImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={modalImageIndex}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              keyExtractor={(item, index) => `modal-${index}`}
              onScroll={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setModalImageIndex(index);
              }}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <View style={styles.imageModalSlide}>
                  <ZoomableImage uri={item} />
                </View>
              )}
            />
          </View>
        </GestureHandlerRootView>
      </Modal>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: { width: 44, height: 44 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  scrollContent: { paddingBottom: 20 },
  imageBlockWrapper: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  imageContainer: {
    width: '100%',
    height: width * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  productImageWrapper: { width: width - 32, height: width * 0.85, padding: '4%' },
  productImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  imageIndicator: { width: 8, height: 8, borderRadius: 4 },
  infoBlockWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  infoContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  productName: { fontSize: 24, fontWeight: '700', marginBottom: 12, lineHeight: 30 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  starsContainer: { flexDirection: 'row', gap: 2 },
  reviewsText: { fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  currentPrice: { fontSize: 28, fontWeight: '800' },
  oldPrice: { fontSize: 18, textDecorationLine: 'line-through' },
  stockContainer: { flexDirection: 'row', alignItems: 'center' },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stockText: { fontSize: 14, fontWeight: '600' },
  tabsBlockWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  tabsBlock: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabContent: { padding: 16 },
  descriptionText: { fontSize: 15, lineHeight: 24 },
  specsContainer: { gap: 0 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  specLabel: { fontSize: 14, flex: 1 },
  specValue: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  reviewsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  reviewsLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.08)',
    minWidth: 80,
  },
  reviewsBigRating: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  reviewsTotalCount: {
    fontSize: 12,
    marginTop: 4,
  },
  reviewsRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 12,
    textAlign: 'center',
  },
  ratingBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  relatedSection: { paddingTop: 20 },
  relatedTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  relatedScroll: { paddingHorizontal: 20, gap: 12 },
  relatedCard: { width: 150, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  relatedImageContainer: { height: 120, padding: 8 },
  relatedImage: { width: '100%', height: '100%' },
  relatedName: { fontSize: 13, fontWeight: '600', padding: 10, paddingBottom: 4 },
  relatedPrice: { fontSize: 15, fontWeight: '700', paddingHorizontal: 10, paddingBottom: 10 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  wishlistBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addToCartText: { fontSize: 16, fontWeight: '700' },
  imageModalContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  imageModalSlide: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  imageModalImageWrapper: {
    width: width - 40,
    height: width - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageModalImage: { width: '100%', height: '100%' },
  imageModalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

