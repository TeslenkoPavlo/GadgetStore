import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LIQPAY_PUBLIC_KEY, LIQPAY_PRIVATE_KEY } from '@env';
import { AuthContext } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Buffer } from 'buffer';
import * as ExpoCrypto from 'expo-crypto';
import { LoadingSpinner } from '@/components/ui';
import { getApiBaseUrl } from '@/services/api';

type CartItem = {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
};

type LiqpayParams = {
  amount: number;
  orderId: string;
  description: string;
  deliveryMethod: string;
  deliveryAddress: string;
  deliveryCostIncluded: string | null;
  customerEmail: string;
  promoCode: string | null;
  promoDiscount: number;
  cartItems: CartItem[];
};

type LiqpayStackParamList = {
  Liqpay: LiqpayParams;
  MainTabs: undefined;
  Cart: undefined;
  Checkout: undefined;
};

type LiqpayScreenRouteProp = RouteProp<LiqpayStackParamList, 'Liqpay'>;
type NavigationProp = NativeStackNavigationProp<LiqpayStackParamList>;

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

function CustomModal({ visible, title, message, confirmText, onConfirm, icon, iconColor = '#1A1A1A' }: CustomModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.modalContent}
        >
          {icon && (
            <View style={[styles.modalIconCircle, iconColor === '#22C55E' && { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name={icon} size={48} color={iconColor} />
            </View>
          )}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <Pressable style={styles.modalConfirmBtn} onPress={onConfirm}>
            <Text style={styles.modalConfirmText}>{confirmText}</Text>
          </Pressable>
        </MotiView>
      </View>
    </Modal>
  );
}

async function createSignature(data: string, privateKey: string): Promise<string> {
  const stringToSign = privateKey + data + privateKey;
  const hash = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA1,
    stringToSign,
    { encoding: ExpoCrypto.CryptoEncoding.BASE64 }
  );
  return hash;
}

export function LiqpayScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LiqpayScreenRouteProp>();
  const { user } = useContext(AuthContext);
  const { clearCart } = useCart();

  const { amount, orderId, description, deliveryMethod, deliveryAddress, deliveryCostIncluded, customerEmail, promoCode, promoDiscount, cartItems } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasNavigated, setHasNavigated] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isNavigatingToCart, setIsNavigatingToCart] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setPaymentHtml(null);
    setHasNavigated(false);
    setPaymentCompleted(false);
    setIsNavigatingToCart(false);
    generatePaymentForm();
  }, [orderId]);

  useEffect(() => {
    if (paymentCompleted && !isNavigatingToCart) {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (isNavigatingToCart) return;

        e.preventDefault();
        navigateToEmptyCart();
      });

      return unsubscribe;
    }
  }, [paymentCompleted, navigation, isNavigatingToCart]);

  const navigateToEmptyCart = async () => {
    if (hasNavigated) return;
    setHasNavigated(true);
    setIsNavigatingToCart(true);

    try {
      await clearCart();
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainTabs', params: { screen: 'Home' } },
        ],
      });
    } catch (error) {
      setErrorMessage('Помилка очищення кошика.');
      setShowErrorModal(true);
      setIsNavigatingToCart(false);
    }
  };

  const generatePaymentForm = async () => {
    try {
      const customInfo = JSON.stringify({
        userId: user?.uid || 'guest',
        customerEmail: customerEmail || user?.email || '',
        deliveryMethod: deliveryMethod,
        deliveryAddress: deliveryAddress,
        deliveryCostIncluded: deliveryCostIncluded,
        promoCode: promoCode,
        promoDiscount: promoDiscount,
        cartItems: JSON.stringify(cartItems),
      });

      const paymentData = {
        public_key: LIQPAY_PUBLIC_KEY,
        version: '3',
        action: 'pay',
        amount: amount,
        currency: 'UAH',
        description: description,
        order_id: orderId,
        sandbox: '1',
        result_url: 'https://gadgetstore-app.com/payment/result',
        server_url: `${getApiBaseUrl()}/liqpay/callback`,
        language: 'uk',
        paytypes: 'card',
        info: customInfo,
      };

      const dataBase64 = Buffer.from(JSON.stringify(paymentData)).toString('base64');
      const signature = await createSignature(dataBase64, LIQPAY_PRIVATE_KEY);

      const html = `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 40px 20px;
              background-color: #F5F7F8;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            .spinner-container {
              position: relative;
              width: 50px;
              height: 50px;
            }
            .outer-ring {
              position: absolute;
              width: 50px;
              height: 50px;
              border: 3px solid #1A1A1A;
              border-top-color: transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            .inner-ring {
              position: absolute;
              top: 10px;
              left: 10px;
              width: 30px;
              height: 30px;
              border: 3px solid #1A1A1A;
              border-bottom-color: transparent;
              border-radius: 50%;
              animation: spin-reverse 0.8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes spin-reverse {
              to { transform: rotate(-360deg); }
            }
            .text {
              margin-top: 20px;
              font-size: 16px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="spinner-container">
            <div class="outer-ring"></div>
            <div class="inner-ring"></div>
          </div>
          <form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8" id="paymentForm">
            <input type="hidden" name="data" value="${dataBase64}" />
            <input type="hidden" name="signature" value="${signature}" />
          </form>
          <script>
            document.getElementById('paymentForm').submit();
          </script>
        </body>
        </html>
      `;

      setPaymentHtml(html);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage('Не вдалося створити платіжну форму');
      setShowErrorModal(true);
      setIsLoading(false);
    }
  };

  const goBackToCheckout = () => {
    navigation.goBack();
  };

  const handlePaymentSuccess = async () => {
    await navigateToEmptyCart();
  };

  const handleShouldStartLoad = (request: any) => {
    const { url } = request;
    const urlLower = url.toLowerCase();

    if (url.includes('.pdf') || url.includes('/receipt') || url.includes('/download')) {
      Linking.openURL(url);
      return false;
    }

    if (url.includes('liqpay.ua') &&
        (urlLower.includes('success') || urlLower.includes('sandbox'))) {
      console.log('[LiqPay] Detected success page on LiqPay');
      setPaymentCompleted(true);
    }

    if (url.includes('gadgetstore-app.com')) {
      if (paymentCompleted ||
          urlLower.includes('status=success') ||
          urlLower.includes('status=sandbox') ||
          urlLower.includes('status=subscribed')) {
        console.log('[LiqPay] Payment SUCCESS - returning to site');
        handlePaymentSuccess();
        return false;
      }
      else {
        console.log('[LiqPay] Payment CANCELLED - going back to checkout');
        if (!hasNavigated) {
          setHasNavigated(true);
          goBackToCheckout();
        }
        return false;
      }
    }

    return true;
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    if (hasNavigated) return;

    if (url.includes('liqpay.ua') &&
        (url.includes('/checkout/success') ||
         url.includes('/checkout/sandbox') ||
         url.includes('status=success') ||
         url.includes('status=sandbox'))) {
      console.log('[LiqPay] Payment completed - user on success page');
      setPaymentCompleted(true);
      return;
    }

    if (url.includes('status=success') ||
        url.includes('status=sandbox') ||
        url.includes('status=3ds_verify')) {
      setPaymentCompleted(true);
      handlePaymentSuccess();
      return;
    }

    if (url.includes('status=error') ||
        url.includes('status=failure') ||
        url.includes('status=cancel')) {
      setHasNavigated(true);
      goBackToCheckout();
    }
  };

  const handleWebViewError = () => {
    if (hasNavigated) return;
    setHasNavigated(true);
    goBackToCheckout();
  };

  const handleHttpError = () => {
    if (hasNavigated) return;
    setHasNavigated(true);
    goBackToCheckout();
  };

  const hideReceiptButtonScript = `
    (function() {
      function hideReceiptButton() {
        var selectors = [
          '[data-btn="receipt"]',
          '.receipt-btn',
          '.download-receipt',
          'a[href*="receipt"]',
          'button[class*="receipt"]',
          '.lp-button-receipt',
          '[class*="download"]',
          '[class*="Receipt"]'
        ];
        selectors.forEach(function(selector) {
          var elements = document.querySelectorAll(selector);
          elements.forEach(function(el) {
            el.style.display = 'none';
          });
        });
        var allButtons = document.querySelectorAll('button, a');
        allButtons.forEach(function(btn) {
          var text = btn.textContent || btn.innerText || '';
          if (text.toLowerCase().includes('квитанц') || 
              text.toLowerCase().includes('receipt') ||
              text.toLowerCase().includes('завантажити')) {
            btn.style.display = 'none';
          }
        });
      }
      hideReceiptButton();
      setInterval(hideReceiptButton, 500);
    })();
    true;
  `;

  const handleErrorConfirm = () => {
    setShowErrorModal(false);
    goBackToCheckout();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.header}
      >
        <Pressable onPress={goBackToCheckout} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Оплата LiqPay</Text>
      </MotiView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#1A1A1A" />
          <Text style={styles.loadingText}>Завантаження платіжної форми...</Text>
        </View>
      ) : paymentHtml ? (
        <WebView
          source={{ html: paymentHtml }}
          style={styles.webview}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleWebViewError}
          onHttpError={handleHttpError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          injectedJavaScript={hideReceiptButtonScript}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <LoadingSpinner size={50} color="#1A1A1A" />
            </View>
          )}
        />
      ) : null}

      <CustomModal
        visible={showErrorModal}
        title="Помилка оплати"
        message={errorMessage}
        confirmText="Закрити"
        onConfirm={handleErrorConfirm}
        icon="close-circle"
        iconColor="#EF4444"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F5F7F8',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7F8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalConfirmBtn: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LiqpayScreen;
