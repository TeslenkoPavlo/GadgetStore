import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { type Product, type Category, AuthUser } from '@/services/api';
import { getUser, removeUser, StoredUser } from '@/services/storage';
import { View, StyleSheet } from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LoadingSpinner } from '@/components/ui';

import LoginScreen from '@/screens/auth/LoginScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';
import { CategoryScreen } from '@/screens/catalog/CategoryScreen';
import PromoCodesScreen from '@/screens/home/promo-codes/PromoCodesScreen';
import PrivacyPolicyScreen from '@/screens/home/privacy-policy/PrivacyPolicyScreen';
import DeliveryMethodsScreen from '@/screens/home/delivery-methods/DeliveryMethodsScreen';
import OurStoresScreen from '@/screens/home/our-stores/OurStoresScreen';
import SupportScreen from '@/screens/home/support/SupportScreen';
import WarrantyScreen from '@/screens/home/warranty/WarrantyScreen';
import AboutUsScreen from '@/screens/home/about-us/AboutUsScreen';
import IphoneComparisonScreen from '@/screens/home/faq/iphone-comparison/IphoneComparisonScreen';
import DeliveryFaqScreen from '@/screens/home/faq/delivery/DeliveryFaqScreen';
import MacbookCreditScreen from '@/screens/home/faq/macbook-credit/MacbookCreditScreen';
import PhoneExchangeScreen from '@/screens/home/faq/phone-exchange/PhoneExchangeScreen';
import SamsungRepairScreen from '@/screens/home/faq/samsung-repair/SamsungRepairScreen';
import NewsScreen from '@/screens/home/news/NewsScreen';
import { EditProfileScreen } from '@/screens/profile/menu-options/edit-profile/EditProfileScreen';
import { CartScreen } from '@/screens/profile/menu-options/cart/CartScreen';
import { CheckoutScreen } from '@/screens/profile/menu-options/cart/checkout/CheckoutScreen';
import { OrderSuccessScreen } from '@/screens/profile/menu-options/cart/checkout/OrderSuccessScreen';
import { LiqpayScreen } from '@/screens/profile/menu-options/cart/payment/LiqpayScreen';
import { WishlistScreen } from '@/screens/profile/menu-options/wishlist/WishlistScreen';
import { MyOrdersScreen } from '@/screens/profile/menu-options/my-orders/MyOrdersScreen';
import { OrderDetailScreen, Order } from '@/screens/profile/menu-options/my-orders/OrderDetailScreen';
import { AiAssistantScreen } from '@/screens/profile/menu-options/ai-assistant/AiAssistantScreen';
import { AboutAppScreen } from '@/screens/profile/menu-options/about-app/AboutAppScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: { screen?: string } | undefined;
  ProductDetail: { product: Product; relatedProducts: Product[] };
  Category: { category: Category };
  PromoCodes: undefined;
  PrivacyPolicy: undefined;
  DeliveryMethods: undefined;
  OurStores: undefined;
  Support: undefined;
  Warranty: undefined;
  AboutUs: undefined;
  EditProfile: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderSuccess: undefined;
  Wishlist: undefined;
  MyOrders: undefined;
  OrderDetail: { order: Order };
  AiAssistant: undefined;
  AboutApp: undefined;
  Liqpay: {
    amount: number;
    orderId: string;
    description: string;
    deliveryMethod: string;
    deliveryAddress: string;
    deliveryCostIncluded: string | null;
    customerEmail: string;
    promoCode: string | null;
    promoDiscount: number;
    cartItems: {
      productId: string;
      productName: string;
      productImage: string;
      price: number;
      quantity: number;
    }[];
  };
  FaqIphoneComparison: undefined;
  FaqDelivery: undefined;
  FaqMacbookCredit: undefined;
  FaqPhoneExchange: undefined;
  FaqSamsungRepair: undefined;
  News: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();


export function RootNavigator() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const savedUser = await getUser();
      setUser(savedUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await removeUser();
    setUser(null);
  };

  const handleUpdateUser = (updatedUser: StoredUser) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={60} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout, updateUser: handleUpdateUser }}>
      <CartProvider>
        <WishlistProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            >
            {user ? (
              <>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="Category" component={CategoryScreen} />
                <Stack.Screen name="PromoCodes" component={PromoCodesScreen} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                <Stack.Screen name="DeliveryMethods" component={DeliveryMethodsScreen} />
                <Stack.Screen name="OurStores" component={OurStoresScreen} />
                <Stack.Screen name="Support" component={SupportScreen} />
                <Stack.Screen name="Warranty" component={WarrantyScreen} />
                <Stack.Screen name="AboutUs" component={AboutUsScreen} />
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                  options={{
                    animation: 'slide_from_right',
                    animationDuration: 300,
                  }}
                />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
                <Stack.Screen name="Wishlist" component={WishlistScreen} />
                <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
                <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
                <Stack.Screen name="AboutApp" component={AboutAppScreen} />
                <Stack.Screen name="Liqpay" component={LiqpayScreen} />
                <Stack.Screen name="FaqIphoneComparison" component={IphoneComparisonScreen} />
                <Stack.Screen name="FaqDelivery" component={DeliveryFaqScreen} />
                <Stack.Screen name="FaqMacbookCredit" component={MacbookCreditScreen} />
                <Stack.Screen name="FaqPhoneExchange" component={PhoneExchangeScreen} />
                <Stack.Screen name="FaqSamsungRepair" component={SamsungRepairScreen} />
                <Stack.Screen name="News" component={NewsScreen} />
              </>
            ) : (
              <Stack.Screen name="Login">
                {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        </WishlistProvider>
      </CartProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

