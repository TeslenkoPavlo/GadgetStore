import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import {
  getHomeData,
  getProducts,
  type Category,
  type Product,
  type Banner as BannerType
} from '@/services/api';
import { lightTheme, getCategoryIcon } from '@/constants';
import { LoadingSpinner } from '@/components/ui';

import { CatalogScreen } from './catalog/CatalogScreen';
import { HomeContent } from './home/HomeContent';
import { ProfileScreen } from './profile/ProfileScreen';
import { ProductDetailScreen } from './product/ProductDetailScreen';
import PromoCodesScreen from './home/promo-codes/PromoCodesScreen';
import PrivacyPolicyScreen from './home/privacy-policy/PrivacyPolicyScreen';
import DeliveryMethodsScreen from './home/delivery-methods/DeliveryMethodsScreen';
import OurStoresScreen from './home/our-stores/OurStoresScreen';
import SupportScreen from './home/support/SupportScreen';
import WarrantyScreen from './home/warranty/WarrantyScreen';

const { width } = Dimensions.get('window');


type Screen = 'home' | 'catalog' | 'profile' | 'category' | 'productDetail' | 'promoCodes' | 'privacyPolicy' | 'deliveryMethods' | 'ourStores' | 'support' | 'warranty';

export function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productHistory, setProductHistory] = useState<Product[]>([]); // Stack for product navigation
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const categoryProductsCacheRef = useRef<Record<string, Product[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [shouldAnimateCatalog, setShouldAnimateCatalog] = useState(true);
  const [shouldAnimateHome, setShouldAnimateHome] = useState(true);
  const [homeAnimationKey, setHomeAnimationKey] = useState(0);
  const [catalogAnimationKey, setCatalogAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const COLORS = lightTheme;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [homeData, products] = await Promise.all([
          getHomeData(),
          getProducts({ limit: 100 }),
        ]);

        if (homeData.categories?.length) setCategories(homeData.categories);
        if (homeData.featuredProducts?.length) setFeaturedProducts(homeData.featuredProducts);
        if (homeData.banners?.length) setBanners(homeData.banners);
        if (products?.length) setAllProducts(products);
      } catch (error) {
        console.error('[HomeScreen] Error loading data:', error);
      } finally {
        setIsLoading(false);
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

  useEffect(() => {
    if (selectedCategory && currentScreen === 'category') {
      const categoryId = selectedCategory.id;
      const cache = categoryProductsCacheRef.current;

      if (cache[categoryId] && cache[categoryId].length > 0) {
        return;
      }

      getProducts({ category: categoryId })
        .then((products) => {
          console.log('[HomeScreen] Loaded products for', categoryId);
          setCategoryProducts(products);
          categoryProductsCacheRef.current[categoryId] = products;
        })
        .catch((error) => {
          console.error('[HomeScreen] Category products error:', error);
          setCategoryProducts([]);
        })
        .finally(() => {
          setIsCategoryLoading(false);
        });
    }
  }, [selectedCategory, currentScreen]);


  const handleCategoryPress = (category: Category) => {
    setShouldAnimateCatalog(false);
    setShouldAnimateHome(false);
    setSelectedCategory(category);

    const cache = categoryProductsCacheRef.current;
    if (cache[category.id] && cache[category.id].length > 0) {
      setCategoryProducts(cache[category.id]);
      setIsCategoryLoading(false);
    } else {
      setCategoryProducts([]);
      setIsCategoryLoading(true);
    }

    setCurrentScreen('category');
  };

  const handleBack = () => {
    if (currentScreen === 'productDetail') {
      if (productHistory.length > 0) {
        const newHistory = [...productHistory];
        const previousProduct = newHistory.pop();
        setProductHistory(newHistory);
        setSelectedProduct(previousProduct || null);
      } else {
        setSelectedProduct(null);
        setShouldAnimateCatalog(false);
        setCurrentScreen(previousScreen);
      }
    } else if (currentScreen === 'category') {
      setSelectedCategory(null);
      setCategoryProducts([]);
      setShouldAnimateCatalog(false);
      setCurrentScreen('catalog');
    } else {
      setShouldAnimateCatalog(false);
      setCurrentScreen('catalog');
      setSearchQuery('');
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleProductPress = (product: Product) => {
    if (currentScreen === 'productDetail' && selectedProduct) {
      setProductHistory(prev => [...prev, selectedProduct]);
    } else {
      setProductHistory([]);
      setPreviousScreen(currentScreen);
    }
    setSelectedProduct(product);
    setCurrentScreen('productDetail');
  };

  const handleAddToWishlist = () => {};

  const getRelatedProducts = (product: Product): Product[] => {
    return allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 6);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleAddToCart = (product: Product) => setCartCount(prev => prev + 1);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        <StatusBar style="dark" />
        <LoadingSpinner size={70} />
      </View>
    );
  }


  const renderCategoryProducts = () => {
    const iconCircleBg = '#1A1A1A';
    const iconCircleColor = '#FFFFFF';

    return (
      <View style={[styles.categoryContainer, { backgroundColor: COLORS.background }]}>
        <View style={styles.categoryHeader}>
          <Pressable onPress={handleBack} style={[styles.backBtn, { backgroundColor: COLORS.surface }]}>
            <Ionicons name="chevron-back" size={26} color={COLORS.text} />
          </Pressable>
          <View style={[styles.categoryIconCircle, { backgroundColor: iconCircleBg }]}>
            <Ionicons
              name={getCategoryIcon(selectedCategory?.id || '')}
              size={20}
              color={iconCircleColor}
            />
          </View>
          <Text style={[styles.categoryTitle, { color: COLORS.text }]}>
            {selectedCategory?.name || ''}
          </Text>
        </View>
        <View style={[styles.categorySeparator, { backgroundColor: COLORS.border }]} />

        {isCategoryLoading ? (
          <LoadingSpinner size={60} />
        ) : (
          <FlatList
            data={categoryProducts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 16 }}
            renderItem={({ item, index }) => (
              <CategoryProductCard
                product={item}
                onAddToCart={handleAddToCart}
                onPress={() => handleProductPress(item)}
                isLast={index === categoryProducts.length - 1}
                colors={COLORS}
              />
            )}
          />
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (currentScreen) {
      case 'productDetail':
        return null;
      case 'catalog':
        return (
          <CatalogScreen
            key={`catalog-${catalogAnimationKey}`}
            categories={categories}
            searchQuery={searchQuery}
            isSearching={isSearching}
            searchResults={searchResults}
            colors={COLORS}
            cartCount={cartCount}
            shouldAnimate={shouldAnimateCatalog}
            searchAnimated={true}
            onSearch={handleSearch}
            onCategoryPress={handleCategoryPress}
            onAddToCart={handleAddToCart}
            onCartPress={() => {}}
            ProductCardComponent={(props) => <ProductCard {...props} onPress={() => handleProductPress(props.product)} onAddToCart={() => handleAddToCart(props.product)} />}
          />
        );
      case 'category':
        return renderCategoryProducts();
      case 'profile':
        return (
          <ProfileScreen
            cartCount={cartCount}
            colors={COLORS}
          />
        );
      case 'promoCodes':
        return (
          <PromoCodesScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'privacyPolicy':
        return (
          <PrivacyPolicyScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'deliveryMethods':
        return (
          <DeliveryMethodsScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'ourStores':
        return (
          <OurStoresScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'support':
        return (
          <SupportScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'warranty':
        return (
          <WarrantyScreen
            onBack={() => setCurrentScreen('home')}
          />
        );
      default:
        return (
          <HomeContent
            key={`home-${homeAnimationKey}`}
            categories={categories}
            featuredProducts={featuredProducts}
            banners={banners}
            activeBannerIndex={activeBannerIndex}
            shouldAnimate={shouldAnimateHome}
            colors={COLORS}
            onCategoryPress={handleCategoryPress}
            onAddToCart={handleAddToCart}
            onProductPress={handleProductPress}
            onNavigateToCatalog={() => { setShouldAnimateCatalog(true); setCurrentScreen('catalog'); }}
            onNavigateToWishlist={() => {}}
            onNavigateToSupport={() => { setPreviousScreen('home'); setCurrentScreen('support'); }}
            onNavigateToOrders={() => {}}
            onNavigateToAddresses={() => {}}
            onNavigateToSettings={() => { setShouldAnimateCatalog(true); setCurrentScreen('profile'); }}
            onNavigateToPromoCodes={() => { setPreviousScreen('home'); setCurrentScreen('promoCodes'); }}
            onNavigateToPrivacyPolicy={() => { setPreviousScreen('home'); setCurrentScreen('privacyPolicy'); }}
            onNavigateToDeliveryMethods={() => { setPreviousScreen('home'); setCurrentScreen('deliveryMethods'); }}
            onNavigateToOurStores={() => { setPreviousScreen('home'); setCurrentScreen('ourStores'); }}
            onNavigateToWarranty={() => { setPreviousScreen('home'); setCurrentScreen('warranty'); }}
            ProductCardComponent={(props) => <ProductCard {...props} onPress={() => handleProductPress(props.product)} onAddToCart={() => handleAddToCart(props.product)} />}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {currentScreen === 'home' && (
          <View style={[styles.header, { backgroundColor: COLORS.card, borderBottomColor: COLORS.border }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.logo, { color: COLORS.text }]}>GadgetStore</Text>
              <Pressable style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
              </Pressable>
            </View>
          </View>
        )}

        {renderContent()}

        {currentScreen !== 'productDetail' && (
          <View style={[styles.bottomNav, { backgroundColor: COLORS.card, borderTopColor: COLORS.border }]}>
            <NavItem
              iconName="home"
              label="Головна"
              active={currentScreen === 'home'}
              onPress={() => {
                if (currentScreen !== 'home') {
                  setShouldAnimateHome(true);
                  setHomeAnimationKey(prev => prev + 1);
                } else {
                  setShouldAnimateHome(false);
                }
                setCurrentScreen('home');
                setSearchQuery('');
                setIsSearching(false);
              }}
              colors={COLORS}
            />
            <NavItem
              iconName="grid"
              label="Каталог"
              active={currentScreen === 'catalog' || currentScreen === 'category'}
              onPress={() => {
                if (currentScreen !== 'catalog' && currentScreen !== 'category') {
                  setShouldAnimateCatalog(true);
                  setCatalogAnimationKey(prev => prev + 1);
                }
                setCurrentScreen('catalog');
                setSearchQuery('');
                setIsSearching(false);
              }}
              colors={COLORS}
            />
            <NavItem
              iconName="person"
              label="Профіль"
              active={currentScreen === 'profile'}
              onPress={() => { setShouldAnimateCatalog(true); setCurrentScreen('profile'); }}
              colors={COLORS}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function ProductCard({ product, colors, onAddToCart, onPress }: { product: Product; colors: typeof lightTheme; onAddToCart: () => void; onPress?: () => void }) {
  const discountedPrice = product.discount ? product.price - (product.price * product.discount) / 100 : product.price;

  const cartBtnBg = '#1A1A1A';
  const cartIconColor = '#FFFFFF';

  return (
    <Pressable onPress={onPress} style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.productImage, { backgroundColor: colors.surface }]}>
        <Image source={{ uri: product.image || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {(product.discount || 0) > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{`-${product.discount}%`}</Text>
          </View>
        )}
        <Pressable onPress={(e) => { e.stopPropagation(); onAddToCart(); }} style={[styles.cartBtn, { backgroundColor: cartBtnBg }]}>
          <Ionicons name="cart-outline" size={16} color={cartIconColor} />
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

function CategoryProductCard({ product, onAddToCart, onPress, isLast = false, colors }: { product: Product; onAddToCart: (product: Product) => void; onPress?: () => void; isLast?: boolean; colors: typeof lightTheme }) {
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
              onPress={(e) => { e.stopPropagation(); }}
              style={[styles.categoryProductWishlistBtn, { backgroundColor: wishlistBtnBg, borderColor: elementBorderColor }]}
            >
              <Ionicons name="heart-outline" size={20} color={wishlistIconColor} />
            </Pressable>
            <Pressable
              onPress={(e) => { e.stopPropagation(); onAddToCart(product); }}
              style={[styles.categoryProductCartBtn, { backgroundColor: cartBtnBg }]}
            >
              <Ionicons name="cart-outline" size={20} color={cartIconColor} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NavItem({ iconName, label, active, onPress, colors }: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  colors: typeof lightTheme;
}) {
  const activeColor = '#1A1A1A';

  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Ionicons
        name={iconName}
        size={24}
        color={active ? activeColor : colors.textSecondary}
      />
      <Text style={[styles.navLabel, { color: active ? activeColor : colors.textSecondary }]}>{label || ''}</Text>
    </Pressable>
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
  notificationButton: {
    padding: 4,
  },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },

  categoryContainer: { flex: 1, paddingTop: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 20, fontWeight: '700' },
  categorySeparator: { height: 1, marginHorizontal: 16, marginBottom: 16 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 16 },

  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  productWrapper: { width: (width - 34) / 2 },
  productCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  productImage: { height: 130, position: 'relative' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cartBtn: { position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', marginBottom: 6, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 15, fontWeight: '700' },
  oldPrice: { fontSize: 11, textDecorationLine: 'line-through' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: 28, borderTopWidth: 1 },
  navItem: { alignItems: 'center', minWidth: 70, gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '500' },

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
  },
});

