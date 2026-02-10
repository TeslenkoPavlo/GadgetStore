import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import { AuthContext } from '@/context/AuthContext';

import { HomeContent } from '@/screens/home/HomeContent';
import { CatalogScreen } from '@/screens/catalog/CatalogScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { type RootStackParamList } from './RootNavigator';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  getHomeData,
  getProducts,
  type Category,
  type Product,
  type Banner as BannerType
} from '@/services/api';
import {
  getCachedProducts,
  getCachedCategories,
  getCachedBanners,
  cacheProducts,
  cacheCategories,
  cacheBanners,
} from '@/services/storage';
import { lightTheme } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator();

const COLORS = lightTheme;

function HomeScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);
  const { addToCart, isInCart, canAddToCart, getCartCount } = useCart();


  useEffect(() => {
    const loadData = async () => {
      try {
        const [cachedProducts, cachedCategories, cachedBanners] = await Promise.all([
          getCachedProducts(),
          getCachedCategories(),
          getCachedBanners(),
        ]);

        if (cachedProducts && cachedCategories) {
          console.log('[HomeScreen] Loading from cache');
          setAllProducts(cachedProducts);
          setCategories(cachedCategories);
          if (cachedBanners) setBanners(cachedBanners);

          const featured = cachedProducts.filter(p => p.discount && p.discount > 0).slice(0, 10);
          if (featured.length > 0) setFeaturedProducts(featured);

          return;
        }

        console.log('[HomeScreen] Loading from API');
        const [homeData, products] = await Promise.all([
          getHomeData(),
          getProducts({ limit: 100 }),
        ]);

        if (homeData.categories?.length) {
          setCategories(homeData.categories);
          await cacheCategories(homeData.categories);
        }
        if (homeData.featuredProducts?.length) setFeaturedProducts(homeData.featuredProducts);
        if (homeData.banners?.length) {
          setBanners(homeData.banners);
          await cacheBanners(homeData.banners);
        }
        if (products?.length) {
          setAllProducts(products);
          await cacheProducts(products);
        }
      } catch (error) {
        console.error('[HomeScreen] Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setActiveBannerIndex((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);


  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Category', { category });
  };

  const handleProductPress = (product: Product) => {
    const relatedProducts = allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 6);
    navigation.navigate('ProductDetail', { product, relatedProducts });
  };

  const handleAddToCart = (product: Product) => {
    const alreadyInCart = isInCart(product.id);

    if (!alreadyInCart && !canAddToCart()) {
      setIsLimitModalVisible(true);
      return;
    }

    const added = addToCart(product);
    if (!added) {
      setIsLimitModalVisible(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.header, { backgroundColor: COLORS.card, borderBottomColor: COLORS.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.logo, { color: COLORS.text }]}>GadgetStore</Text>
            <View style={styles.headerIcons}>
              <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="bag-outline" size={26} color={COLORS.text} />
                {getCartCount() > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{getCartCount() > 99 ? '99+' : getCartCount()}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate('News')}>
                <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
              </Pressable>
            </View>
          </View>
        </View>

        <HomeContent
          categories={categories}
          featuredProducts={featuredProducts}
          banners={banners}
          activeBannerIndex={activeBannerIndex}
          shouldAnimate={true}
          colors={COLORS}
          onCategoryPress={handleCategoryPress}
          onAddToCart={handleAddToCart}
          onProductPress={handleProductPress}
          onNavigateToCatalog={() => {}}
          onNavigateToWishlist={() => {}}
          onNavigateToSupport={() => navigation.navigate('Support')}
          onNavigateToOrders={() => {}}
          onNavigateToAddresses={() => {}}
          onNavigateToSettings={() => {}}
          onNavigateToPromoCodes={() => navigation.navigate('PromoCodes')}
          onNavigateToPrivacyPolicy={() => navigation.navigate('PrivacyPolicy')}
          onNavigateToDeliveryMethods={() => navigation.navigate('DeliveryMethods')}
          onNavigateToOurStores={() => navigation.navigate('OurStores')}
          onNavigateToWarranty={() => navigation.navigate('Warranty')}
          onNavigateToAboutUs={() => navigation.navigate('AboutUs')}
          onNavigateToFaqIphone={() => navigation.navigate('FaqIphoneComparison')}
          onNavigateToFaqDelivery={() => navigation.navigate('FaqDelivery')}
          onNavigateToFaqMacbook={() => navigation.navigate('FaqMacbookCredit')}
          onNavigateToFaqExchange={() => navigation.navigate('FaqPhoneExchange')}
          onNavigateToFaqRepair={() => navigation.navigate('FaqSamsungRepair')}
          ProductCardComponent={(props) => (
            <ProductCard
              {...props}
              onPress={() => handleProductPress(props.product)}
              onAddToCart={() => handleAddToCart(props.product)}
            />
          )}
        />
      </SafeAreaView>

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

      {/* Floating Chat Widget */}
      <Pressable
        style={styles.floatingChatWidget}
        onPress={() => navigation.navigate('AiAssistant')}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function CatalogScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchAnimated, setSearchAnimated] = useState(false);
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);
  const { addToCart, getCartCount, isInCart, canAddToCart } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cachedProducts, cachedCategories] = await Promise.all([
          getCachedProducts(),
          getCachedCategories(),
        ]);

        if (cachedProducts && cachedCategories) {
          console.log('[CatalogScreen] Loading from cache');
          setAllProducts(cachedProducts);
          setCategories(cachedCategories);
          return;
        }

        console.log('[CatalogScreen] Loading from API');
        const [homeData, products] = await Promise.all([
          getHomeData(),
          getProducts({ limit: 100 }),
        ]);

        if (homeData.categories?.length) {
          setCategories(homeData.categories);
          await cacheCategories(homeData.categories);
        }
        if (products?.length) {
          setAllProducts(products);
          await cacheProducts(products);
        }
      } catch (error) {
        console.error('[CatalogScreen] Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Category', { category });
  };

  const handleProductPress = (product: Product) => {
    const relatedProducts = allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 6);
    navigation.navigate('ProductDetail', { product, relatedProducts });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(true);
      setSearchAnimated(false);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setSearchAnimated(false);
    }
  };

  const handleSearchAnimationComplete = useCallback(() => {
    setSearchAnimated(true);
  }, []);

  const handleAddToCart = (product: Product) => {
    const alreadyInCart = isInCart(product.id);

    if (!alreadyInCart && !canAddToCart()) {
      setIsLimitModalVisible(true);
      return;
    }

    const added = addToCart(product);
    if (!added) {
      setIsLimitModalVisible(true);
    }
  };

  return (
    <>
    <CatalogScreen
      categories={categories}
      searchQuery={searchQuery}
      isSearching={isSearching}
      searchResults={searchResults}
      colors={COLORS}
      cartCount={getCartCount()}
      shouldAnimate={true}
      searchAnimated={searchAnimated}
      onSearch={handleSearch}
      onCategoryPress={handleCategoryPress}
      onAddToCart={handleAddToCart}
      onCartPress={() => navigation.navigate('Cart')}
      onProductPress={handleProductPress}
      onSearchAnimationComplete={handleSearchAnimationComplete}
      ProductCardComponent={(props) => (
        <ProductCard
          {...props}
          onPress={() => handleProductPress(props.product)}
          onAddToCart={() => handleAddToCart(props.product)}
        />
      )}
    />

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
    </>
  );
}

function ProfileScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const [ordersCount, setOrdersCount] = useState(0);

  return (
    <ProfileScreen
      cartCount={getCartCount()}
      wishlistCount={getWishlistCount()}
      ordersCount={ordersCount}
      setOrdersCount={setOrdersCount}
      colors={COLORS}
      onCartPress={() => navigation.navigate('Cart')}
    />
  );
}

function ProductCard({ product, colors, onAddToCart, onPress }: {
  product: Product;
  colors: typeof lightTheme;
  onAddToCart: () => void;
  onPress?: () => void;
}) {
  const [isAdded, setIsAdded] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const discountedPrice = product.discount ? product.price - (product.price * product.discount) / 100 : product.price;

  const handleCartPress = () => {
    if (isAdded) {
      navigation.navigate('Cart');
    } else {
      onAddToCart();
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 5000);
    }
  };

  return (
    <Pressable onPress={onPress} style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.productImage, { backgroundColor: colors.surface }]}>
        {product.image && (
          <View style={{ width: '100%', height: '100%', backgroundColor: colors.surface }} />
        )}
        {(product.discount || 0) > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{`-${product.discount}%`}</Text>
          </View>
        )}
        <Pressable onPress={(e) => { e.stopPropagation(); handleCartPress(); }} style={styles.cartBtn}>
          <Ionicons name={isAdded ? "checkmark" : "cart-outline"} size={16} color="#FFFFFF" />
        </Pressable>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{product.name || ''}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>{`${discountedPrice.toFixed(0)} ₴`}</Text>
          {(product.discount || 0) > 0 && (
            <Text style={[styles.oldPrice, { color: colors.textSecondary }]}>{`${product.price} ₴`}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 28,
          paddingTop: 10,
          height: 80,
        },
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarHideOnKeyboard: true,
        animation: 'fade',
        tabBarIcon: ({ color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Catalog') {
            iconName = 'grid';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenWrapper}
        options={{ tabBarLabel: 'Головна' }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreenWrapper}
        options={{ tabBarLabel: 'Каталог' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreenWrapper}
        options={{ tabBarLabel: 'Профіль' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    padding: 4,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  productCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  productImage: { height: 130, position: 'relative' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cartBtn: { position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', marginBottom: 6, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 15, fontWeight: '700' },
  oldPrice: { fontSize: 11, textDecorationLine: 'line-through' },
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
  floatingChatWidget: {
    position: 'absolute',
    left: 16,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
});
