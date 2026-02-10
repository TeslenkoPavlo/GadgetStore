import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { type Category, type Product, type Banner as BannerType } from '@/services/api';

const { width } = Dimensions.get('window');

interface FaqItem {
  id: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: string;
  label: string;
  question: string;
}

const faqItems: FaqItem[] = [
  { id: '1', image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/FAQ%2Fiphone-15-vs-15-pro%2F0.jpg?alt=media', label: 'Смартфони', question: 'Яка різниця між iPhone 15 та iPhone 15 Pro?' },
  { id: '2', image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/FAQ%2Fdelivery-images%2F0.jpg?alt=media', label: 'Доставка', question: 'Скільки коштує доставка у Львів?' },
  { id: '3', image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/FAQ%2Fmacbook-credit-banner%2F0.jpg?alt=media', label: 'Оплата частинами', question: 'Як оформити розстрочку на MacBook?' },
  { id: '4', image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/FAQ%2Fphone-exchange-banner%2F0.jpg?alt=media', label: 'Обмін', question: 'Чи можна обміняти старий телефон на новий?' },
  { id: '5', image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/FAQ%2Fbroken-samsung-s24-ultra%2F0.jpg?alt=media', label: 'Ремонт', question: 'Де відремонтувати розбитий екран Samsung?' },
];

interface HomeContentProps {
  categories: Category[];
  featuredProducts: Product[];
  banners: BannerType[];
  activeBannerIndex: number;
  shouldAnimate?: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    card: string;
  };
  onCategoryPress: (category: Category) => void;
  onAddToCart: (product: Product) => void;
  onProductPress?: (product: Product) => void;
  onNavigateToCatalog?: () => void;
  onNavigateToWishlist?: () => void;
  onNavigateToSupport?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToAddresses?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPromoCodes?: () => void;
  onNavigateToPrivacyPolicy?: () => void;
  onNavigateToDeliveryMethods?: () => void;
  onNavigateToOurStores?: () => void;
  onNavigateToWarranty?: () => void;
  onNavigateToAboutUs?: () => void;
  onNavigateToFaqIphone?: () => void;
  onNavigateToFaqDelivery?: () => void;
  onNavigateToFaqMacbook?: () => void;
  onNavigateToFaqExchange?: () => void;
  onNavigateToFaqRepair?: () => void;
  ProductCardComponent: React.ComponentType<{ product: Product; colors: any; onAddToCart: (product: Product) => void }>;
}

export function HomeContent({
  categories,
  featuredProducts: _featuredProducts,
  shouldAnimate = true,
  colors,
  onAddToCart: _onAddToCart,
  onProductPress: _onProductPress,
  onCategoryPress,
  onNavigateToCatalog,
  onNavigateToWishlist: _onNavigateToWishlist,
  onNavigateToSupport,
  onNavigateToOrders: _onNavigateToOrders,
  onNavigateToAddresses: _onNavigateToAddresses,
  onNavigateToSettings: _onNavigateToSettings,
  onNavigateToPromoCodes,
  onNavigateToPrivacyPolicy,
  onNavigateToDeliveryMethods,
  onNavigateToOurStores,
  onNavigateToWarranty,
  onNavigateToAboutUs,
  onNavigateToFaqIphone,
  onNavigateToFaqDelivery,
  onNavigateToFaqMacbook,
  onNavigateToFaqExchange,
  onNavigateToFaqRepair,
}: HomeContentProps) {

  const [activeFaqIndex, setActiveFaqIndex] = useState(0);

  const handleFaqPress = (faqId: string) => {
    switch (faqId) {
      case '1':
        onNavigateToFaqIphone?.();
        break;
      case '2':
        onNavigateToFaqDelivery?.();
        break;
      case '3':
        onNavigateToFaqMacbook?.();
        break;
      case '4':
        onNavigateToFaqExchange?.();
        break;
      case '5':
        onNavigateToFaqRepair?.();
        break;
    }
  };

  const serviceSquares = [
    { id: 'delivery', icon: 'car-outline' as keyof typeof Ionicons.glyphMap, label: 'Способи доставки' },
    { id: 'stores', icon: 'location-outline' as keyof typeof Ionicons.glyphMap, label: 'Наші\nмагазини' },
    { id: 'support', icon: 'headset-outline' as keyof typeof Ionicons.glyphMap, label: 'Підтримка' },
  ];

  const popularCategories = [
    { id: 'smartphones', name: 'Смартфони', icon: 'phone-portrait-outline' },
    { id: 'tablets', name: 'Планшети', icon: 'tablet-portrait-outline' },
    { id: 'accessories', name: 'Аксесуари', icon: 'headset-outline' },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 0 }}
        style={styles.heroSection}
      >
        <MotiPressable
          style={styles.promoTile}
          onPress={onNavigateToPromoCodes}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.98 : 1,
            };
          }}
          transition={{ type: 'timing', duration: 100 }}
        >
          <LinearGradient
            colors={['#4A4A4A', '#2A2A2A', '#1A1A1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoTileGradient}
          >
            <View style={styles.promoTileMainContent}>
              <View style={styles.promoTileTop}>
                <View style={[styles.promoTileIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="pricetag-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.promoTileTextContainer}>
                  <Text style={styles.promoTileTitle}>
                    Ваші промокоди
                  </Text>
                  <Text style={styles.promoTileSubtitle}>
                    Промокоди доступні для використання
                  </Text>
                </View>
              </View>
              <View style={styles.promoTileLinkContainer}>
                <View style={styles.promoTileLinkWrapper}>
                  <Text style={styles.promoTileLinkText}>Переглянути</Text>
                  <View style={styles.promoTileArrowCircle}>
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </MotiPressable>
      </MotiView>

      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: shouldAnimate ? 50 : 0 }}
        style={styles.privacySection}
      >
        <MotiPressable
          style={[styles.privacyTile, { backgroundColor: '#F5F7F8' }]}
          onPress={onNavigateToPrivacyPolicy}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.98 : 1,
            };
          }}
          transition={{ type: 'timing', duration: 100 }}
        >
            <View style={styles.privacyContent}>
              <Text style={[styles.privacyTitle, { color: '#1A1A1A' }]}>
                Політика конфіденційності
              </Text>
              <Text style={[styles.privacySubtitle, { color: '#6B7280' }]}>
                Дізнайтеся як ми захищаємо ваші персональні дані
              </Text>
            </View>
            <View style={styles.privacyBottomRow}>
              <View style={styles.privacyIconsContainer}>
                <View style={[styles.privacyIconCircle, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#1A1A1A" />
                </View>
                <View style={[styles.privacyIconCircle, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                  <Ionicons name="lock-closed-outline" size={12} color="#1A1A1A" />
                </View>
                <View style={[styles.privacyIconCircle, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                  <Ionicons name="document-text-outline" size={12} color="#1A1A1A" />
                </View>
              </View>
              <View style={[styles.privacyArrowCircle, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                <Ionicons name="chevron-forward" size={16} color="#1A1A1A" />
              </View>
            </View>
          </MotiPressable>
      </MotiView>

      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: shouldAnimate ? 100 : 0 }}
        style={styles.serviceSquaresSection}
      >
        <View style={styles.serviceSquaresRow}>
          {serviceSquares.map((item) => (
            <MotiPressable
              key={item.id}
              style={styles.serviceSquareWrapper}
              onPress={item.id === 'delivery' ? onNavigateToDeliveryMethods : item.id === 'stores' ? onNavigateToOurStores : item.id === 'support' ? onNavigateToSupport : undefined}
              animate={({ pressed }) => {
                'worklet';
                return {
                  scale: pressed ? 0.95 : 1,
                };
              }}
              transition={{ type: 'timing', duration: 100 }}
            >
                <View style={[styles.serviceSquare, { backgroundColor: '#1A1A1A' }]}>
                  <Ionicons name={item.icon} size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.serviceSquareLabel, { color: colors.text }]}>{item.label}</Text>
              </MotiPressable>
          ))}
        </View>
      </MotiView>

      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: shouldAnimate ? 150 : 0 }}
        style={styles.warrantySection}
      >
        <MotiPressable
          style={styles.warrantyTile}
          onPress={onNavigateToWarranty}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.98 : 1,
            };
          }}
          transition={{ type: 'timing', duration: 100 }}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8', '#F0F0F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.warrantyTileGradient}
          >
            <View style={styles.warrantyTileMainContent}>
              <View style={styles.warrantyTileTop}>
                <View style={[styles.warrantyTileIconCircle, { backgroundColor: '#1A1A1A' }]}>
                  <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.warrantyTileTextContainer}>
                  <Text style={[styles.warrantyTileTitle, { color: '#1A1A1A' }]}>
                    Гарантія та повернення
                  </Text>
                  <Text style={[styles.warrantyTileSubtitle, { color: '#6B7280' }]}>
                    14 днів на повернення товару
                  </Text>
                </View>
              </View>
              <View style={[styles.warrantyTileLinkWrapper, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.warrantyTileLinkText, { color: '#1A1A1A' }]}>Детальніше</Text>
                <View style={[styles.warrantyTileArrowCircle, { backgroundColor: '#1A1A1A' }]}>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </MotiPressable>
      </MotiView>

      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: shouldAnimate ? 200 : 0 }}
        style={styles.paymentSection}
      >
        <MotiPressable
          style={styles.paymentTile}
          onPress={onNavigateToAboutUs}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.98 : 1,
            };
          }}
          transition={{ type: 'timing', duration: 100 }}
        >
          <LinearGradient
            colors={['#2A2A2A', '#1F1F1F', '#141414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.paymentTileGradient}
          >
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>
                Про нас
              </Text>
              <Text style={styles.paymentSubtitle}>
                Дізнайтесь більше про GadgetStore
              </Text>
            </View>
            <View style={styles.paymentBottomRow}>
              <View style={styles.paymentIconsContainer}>
                <View style={[styles.paymentIconCircle, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <Ionicons name="storefront-outline" size={12} color="#FFFFFF" />
                </View>
                <View style={[styles.paymentIconCircle, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <Ionicons name="people-outline" size={12} color="#FFFFFF" />
                </View>
                <View style={[styles.paymentIconCircle, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <Ionicons name="heart-outline" size={12} color="#FFFFFF" />
                </View>
              </View>
              <View style={[styles.paymentArrowCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </MotiPressable>
      </MotiView>

      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: shouldAnimate ? 250 : 0 }}
        style={styles.faqSection}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Часті питання</Text>
        </View>
        <FlatList
          data={faqItems}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.faqList}
          snapToInterval={width}
          snapToAlignment="center"
          decelerationRate={0.9}
          onScroll={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / width);
            if (index !== activeFaqIndex && index >= 0 && index < faqItems.length) {
              setActiveFaqIndex(index);
            }
          }}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Pressable style={styles.faqCard} onPress={() => handleFaqPress(item.id)}>
              <View style={[styles.faqCardInner, { borderColor: colors.border }]}>
                <View style={[styles.faqCardTop, { backgroundColor: '#F0F0F0' }]}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.faqCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.faqIconContainer, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                      <Ionicons name={item.icon} size={32} color="#1A1A1A" />
                    </View>
                  )}
                </View>
                <View style={[styles.faqCardBottom, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={[styles.faqCardLabel, { color: '#6B7280' }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.faqCardTitle, { color: '#1A1A1A' }]} numberOfLines={2}>
                    {item.question}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
        <View style={styles.faqPagination}>
          {faqItems.map((_, index) => (
            <View
              key={index}
              style={[
                styles.faqPaginationDot,
                {
                  backgroundColor: activeFaqIndex === index
                    ? '#1A1A1A'
                    : 'rgba(0,0,0,0.2)',
                  width: activeFaqIndex === index ? 20 : 8,
                }
              ]}
            />
          ))}
        </View>
      </MotiView>

      <MotiView
        from={shouldAnimate ? { translateY: 30 } : undefined}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: shouldAnimate ? 300 : 0 }}
        style={styles.popularCategoriesSection}
      >
        <Text style={[styles.popularCategoriesTitle, { color: colors.text }]}>Популярні категорії</Text>
        <View style={[styles.popularCategoriesCard, { backgroundColor: '#FFFFFF' }]}>
          {popularCategories.map((category, index, array) => {
            const backendCategory = categories.find(c => c.id === category.id);

            return (
              <MotiPressable
                key={category.id}
                style={[
                  styles.popularCategoryItem,
                  index !== array.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0,0,0,0.06)',
                  },
                ]}
                onPress={() => {
                  if (backendCategory) {
                    onCategoryPress(backendCategory);
                  }
                }}
                animate={({ pressed }) => {
                  'worklet';
                  return {
                    scale: pressed ? 0.98 : 1,
                  };
                }}
                transition={{ type: 'timing', duration: 100 }}
              >
                <Text style={[styles.popularCategoryName, { color: '#1A1A1A' }]}>
                  {category.name}
                </Text>
                <View style={[styles.popularCategoryArrow, { backgroundColor: '#1A1A1A' }]}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </MotiPressable>
            );
          })}
        </View>
      </MotiView>


      <View style={{ height: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
  },
  heroSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  promoTile: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  promoTileGradient: {
    minHeight: 190,
  },
  promoTileMainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  promoTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    flex: 1,
    paddingVertical: 20,
  },
  promoTileIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTileTextContainer: {
    flex: 1,
  },
  promoTileTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  promoTileSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  promoTileLinkContainer: {
  },
  promoTileLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  promoTileLinkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  promoTileArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  privacyTile: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 95,
    justifyContent: 'space-between',
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  privacyBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  privacyIconsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  privacyIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceSquaresSection: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  serviceSquaresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  serviceSquareWrapper: {
    alignItems: 'center',
    width: 80,
  },
  serviceSquare: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceSquareLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  warrantySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  warrantyTile: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  warrantyTileGradient: {
    minHeight: 160,
  },
  warrantyTileMainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  warrantyTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    flex: 1,
    paddingVertical: 18,
  },
  warrantyTileIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warrantyTileTextContainer: {
    flex: 1,
  },
  warrantyTileTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  warrantyTileSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  warrantyTileLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  warrantyTileLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  warrantyTileArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentSection: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  paymentTile: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  paymentTileGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 95,
    justifyContent: 'space-between',
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  paymentSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  paymentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  paymentIconsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqSection: {
    marginBottom: 28,
  },
  faqList: {
    paddingBottom: 8,
  },
  faqCard: {
    width: width,
    height: 240,
    paddingHorizontal: 16,
  },
  faqCardInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  faqCardTop: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faqCardImage: {
    width: '100%',
    height: '100%',
  },
  faqIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqCardBottom: {
    height: 100,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  faqCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    height: 18,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  faqPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  faqPaginationDot: {
    height: 8,
    borderRadius: 4,
  },
  popularCategoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  popularCategoriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  popularCategoriesCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  popularCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  popularCategoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  popularCategoryArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  categoriesSection: {
    marginBottom: 28,
  },
  categoriesScrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  categoryCard: {
    width: 95,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  recommendedSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  recommendedCard: {
    width: 160,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  recommendedImageContainer: {
    height: 120,
    padding: 12,
    position: 'relative',
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
  },
  recommendedDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedDiscountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  recommendedInfo: {
    padding: 12,
    paddingTop: 8,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 36,
  },
  recommendedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendedPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  recommendedOldPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  recommendedCartBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
