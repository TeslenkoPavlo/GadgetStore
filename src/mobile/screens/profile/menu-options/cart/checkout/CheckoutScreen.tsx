import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { type RootStackParamList } from '@/navigation/RootNavigator';
import { LoadingSpinner } from '@/components/ui';
import { promoCodes, type PromoCode } from '@/screens/home/promo-codes/PromoCodesScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CHECKOUT_STORAGE_KEYS = {
  DELIVERY_METHOD: '@gadgetstore_checkout_delivery',
  PAYMENT_METHOD: '@gadgetstore_checkout_payment',
  SELECTED_STORE: '@gadgetstore_checkout_store',
  NOVA_POSHTA_CITY: '@gadgetstore_checkout_nova_poshta_city',
  NOVA_POSHTA_BRANCH: '@gadgetstore_checkout_nova_poshta_branch',
  UKRPOSHTA_CITY: '@gadgetstore_checkout_ukrposhta_city',
  UKRPOSHTA_BRANCH: '@gadgetstore_checkout_ukrposhta_branch',
};

interface City {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
}

const NOVA_POSHTA_CITIES: City[] = [
  { id: 'vinnytsia', name: 'Вінниця' },
  { id: 'lviv', name: 'Львів' },
  { id: 'chernihiv', name: 'Чернігів' },
  { id: 'rivne', name: 'Рівне' },
  { id: 'ivano_frankivsk', name: 'Івано-Франківськ' },
];

const NOVA_POSHTA_BRANCHES: Record<string, Branch[]> = {
  vinnytsia: [
    { id: 'np_vinnytsia_1', name: 'Нова Пошта №1', address: 'вул. Якова Шепеля, 1' },
    { id: 'np_vinnytsia_7', name: 'Нова Пошта №7', address: 'вул. Келецька, 51а, прим. 144' },
    { id: 'np_vinnytsia_16', name: 'Нова Пошта №16', address: 'просп. Коцюбинського, 70 (ТЦ "ПетроЦентр")' },
  ],
  lviv: [
    { id: 'np_lviv_1', name: 'Нова Пошта №1', address: 'вулиця Городоцька, 359' },
    { id: 'np_lviv_3', name: 'Нова Пошта №3', address: 'вулиця Угорська, 22' },
    { id: 'np_lviv_21', name: 'Нова Пошта №21', address: 'вулиця Пасічна, 93Б' },
  ],
  chernihiv: [
    { id: 'np_chernihiv_1', name: 'Нова Пошта №1', address: 'вулиця Старобілоуська, 77' },
    { id: 'np_chernihiv_7', name: 'Нова Пошта №7', address: 'проспект Миру, 50' },
    { id: 'np_chernihiv_13', name: 'Нова Пошта №13', address: 'проспект Миру, 49' },
  ],
  rivne: [
    { id: 'np_rivne_2', name: 'Нова Пошта №2', address: 'вулиця Вячеслава Чорновола, 14/16' },
    { id: 'np_rivne_5', name: 'Нова Пошта №5', address: 'проспект Миру, 12' },
    { id: 'np_rivne_34', name: 'Нова Пошта №34', address: 'вулиця Міцкевича, 2' },
  ],
  ivano_frankivsk: [
    { id: 'np_if_1', name: 'Нова Пошта №1', address: 'вулиця Максимовича, 8' },
    { id: 'np_if_2', name: 'Нова Пошта №2', address: 'вулиця Вовчинецька, 26' },
    { id: 'np_if_29', name: 'Нова Пошта №29', address: 'вулиця Гетьмана Мазепи, 42' },
  ],
};

const UKRPOSHTA_CITIES: City[] = [
  { id: 'vinnytsia', name: 'Вінниця' },
  { id: 'lviv', name: 'Львів' },
  { id: 'chernihiv', name: 'Чернігів' },
  { id: 'rivne', name: 'Рівне' },
  { id: 'ivano_frankivsk', name: 'Івано-Франківськ' },
];

const UKRPOSHTA_BRANCHES: Record<string, Branch[]> = {
  vinnytsia: [
    { id: 'up_vinnytsia_1', name: 'Укрпошта 21001', address: 'проспект Коцюбинського, 30' },
    { id: 'up_vinnytsia_2', name: 'Укрпошта 21021', address: 'проспект Космонавтів, 24' },
    { id: 'up_vinnytsia_3', name: 'Укрпошта 29', address: 'вулиця Василя Порика, 44' },
  ],
  lviv: [
    { id: 'up_lviv_1', name: 'Укрпошта 79008', address: 'вулиця Валова, 14' },
    { id: 'up_lviv_2', name: 'Укрпошта 79052', address: 'вулиця Низинна, 5' },
    { id: 'up_lviv_3', name: 'Укрпошта 36039', address: 'вулиця Симона Петлюри, 45' },
  ],
  chernihiv: [
    { id: 'up_chernihiv_1', name: 'Укрпошта 14003', address: 'вулиця Незалежності, 25' },
    { id: 'up_chernihiv_2', name: 'Укрпошта 14005', address: 'проспект Миру, 89' },
    { id: 'up_chernihiv_3', name: 'Укрпошта 14033', address: 'вул. Мстиславська, 173' },
  ],
  rivne: [
    { id: 'up_rivne_1', name: 'Укрпошта 33001', address: 'вулиця Соборна, 326' },
    { id: 'up_rivne_2', name: 'Укрпошта 33013', address: 'проспект Миру, 6' },
    { id: 'up_rivne_3', name: 'Укрпошта 33023', address: 'вулиця Київська, 8' },
  ],
  ivano_frankivsk: [
    { id: 'up_if_1', name: 'Укрпошта 76006', address: 'вулиця Василя Симоненка, 1' },
    { id: 'up_if_2', name: 'Укрпошта 76018', address: 'вулиця Січових стрільців, 13А' },
    { id: 'up_if_3', name: 'Укрпошта 76020', address: 'вул. Володимира Івасюка, 21В' },
  ],
};

const STORES = [
  {
    id: 'store_1',
    name: 'GadgetStore №1',
    address: 'вул. Соборності, 33, Полтава',
    phone: '+380969032235',
    hours: 'Пн-Пт: 9:00 - 17:00',
  },
  {
    id: 'store_2',
    name: 'GadgetStore №2',
    address: 'вул. Соборності, 46, Полтава',
    phone: '+380954100830',
    hours: 'Пн-Пт: 9:00 - 17:00',
  },
];

const DELIVERY_COST_INCLUDED_MESSAGE = 'Доставка включена у вартість';
const DELIVERY_FREE_MESSAGE = 'Безкоштовно';


const DELIVERY_METHODS = [
  {
    id: 'nova_poshta',
    title: 'Нова Пошта',
    icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Доставка до відділення або поштомату. 1-3 робочих дні.',
  },
  {
    id: 'ukrposhta',
    title: 'Укрпошта',
    icon: 'mail-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Економна доставка. 3-7 робочих днів.',
  },
  {
    id: 'self_pickup',
    title: 'Самовивіз',
    icon: 'storefront-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Безкоштовно з магазину в Полтаві.',
  },
];

const PAYMENT_METHODS = [
  {
    id: 'cash_on_delivery',
    title: 'Накладний платіж',
    icon: 'cash-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Оплата при отриманні',
  },
  {
    id: 'liqpay',
    title: 'LiqPay',
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Онлайн оплата картою',
  },
];

function generateOrderId(paymentMethod: string): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const prefix = paymentMethod === 'liqpay' ? 'ORDER-LIQPAY' : 'ORDER-COD';
  return `${prefix}-${dateStr}-${randomCode}`;
}


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

interface SelectorProps {
  title: string;
  options: { id: string; title: string; icon: keyof typeof Ionicons.glyphMap; description: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function Selector({ title, options, selectedId, onSelect }: SelectorProps) {
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      {options.map((option) => (
        <Pressable
          key={option.id}
          style={[
            styles.selectorOption,
            selectedId === option.id && styles.selectorOptionSelected,
          ]}
          onPress={() => onSelect(option.id)}
        >
          <View style={[
            styles.selectorIconCircle,
            selectedId === option.id && styles.selectorIconCircleSelected,
          ]}>
            <Ionicons
              name={option.icon}
              size={20}
              color={selectedId === option.id ? '#FFFFFF' : '#1A1A1A'}
            />
          </View>
          <View style={styles.selectorTextContainer}>
            <Text style={[
              styles.selectorOptionTitle,
              selectedId === option.id && styles.selectorOptionTitleSelected,
            ]}>
              {option.title}
            </Text>
            <Text style={styles.selectorOptionDescription}>{option.description}</Text>
          </View>
          <View style={[
            styles.radioOuter,
            selectedId === option.id && styles.radioOuterSelected,
          ]}>
            {selectedId === option.id && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  const { items, getCartTotal, clearCart } = useCart();

  const [selectedDelivery, setSelectedDelivery] = useState(DELIVERY_METHODS[0].id);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);

  const [selectedStore, setSelectedStore] = useState(STORES[0].id);

  const [novaPoshtaCity, setNovaPoshtaCity] = useState(NOVA_POSHTA_CITIES[0].id);
  const [novaPoshtaBranch, setNovaPoshtaBranch] = useState(NOVA_POSHTA_BRANCHES[NOVA_POSHTA_CITIES[0].id][0].id);
  const [ukrposhtaCity, setUkrposhtaCity] = useState(UKRPOSHTA_CITIES[0].id);
  const [ukrposhtaBranch, setUkrposhtaBranch] = useState(UKRPOSHTA_BRANCHES[UKRPOSHTA_CITIES[0].id][0].id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cachedDelivery, cachedPayment, cachedStore, cachedNpCity, cachedNpBranch, cachedUpCity, cachedUpBranch] = await Promise.all([
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.DELIVERY_METHOD),
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.PAYMENT_METHOD),
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.SELECTED_STORE),
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.NOVA_POSHTA_CITY),
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.NOVA_POSHTA_BRANCH),
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.UKRPOSHTA_CITY),
          AsyncStorage.getItem(CHECKOUT_STORAGE_KEYS.UKRPOSHTA_BRANCH),
        ]);

        if (cachedDelivery) {
          setSelectedDelivery(cachedDelivery);
        }
        if (cachedPayment) {
          setSelectedPayment(cachedPayment);
        }
        if (cachedStore) {
          setSelectedStore(cachedStore);
        }
        if (cachedNpCity && NOVA_POSHTA_CITIES.find(c => c.id === cachedNpCity)) {
          setNovaPoshtaCity(cachedNpCity);
          if (cachedNpBranch && NOVA_POSHTA_BRANCHES[cachedNpCity]?.find(b => b.id === cachedNpBranch)) {
            setNovaPoshtaBranch(cachedNpBranch);
          } else {
            setNovaPoshtaBranch(NOVA_POSHTA_BRANCHES[cachedNpCity][0].id);
          }
        }
        if (cachedUpCity && UKRPOSHTA_CITIES.find(c => c.id === cachedUpCity)) {
          setUkrposhtaCity(cachedUpCity);
          if (cachedUpBranch && UKRPOSHTA_BRANCHES[cachedUpCity]?.find(b => b.id === cachedUpBranch)) {
            setUkrposhtaBranch(cachedUpBranch);
          } else {
            setUkrposhtaBranch(UKRPOSHTA_BRANCHES[cachedUpCity][0].id);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDeliverySelect = useCallback(async (deliveryId: string) => {
    setSelectedDelivery(deliveryId);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.DELIVERY_METHOD, deliveryId);
    } catch (error) {
    }
  }, []);

  const handlePaymentSelect = useCallback(async (paymentId: string) => {
    setSelectedPayment(paymentId);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.PAYMENT_METHOD, paymentId);
    } catch (error) {

    }
  }, []);

  const handleStoreSelect = useCallback(async (storeId: string) => {
    setSelectedStore(storeId);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.SELECTED_STORE, storeId);
    } catch (error) {
    }
  }, []);

  const handleNovaPoshtaCityChange = useCallback(async (cityId: string) => {
    setNovaPoshtaCity(cityId);
    const firstBranch = NOVA_POSHTA_BRANCHES[cityId]?.[0]?.id || '';
    setNovaPoshtaBranch(firstBranch);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.NOVA_POSHTA_CITY, cityId);
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.NOVA_POSHTA_BRANCH, firstBranch);
    } catch (error) {
    }
  }, []);

  const handleNovaPoshtaBranchChange = useCallback(async (branchId: string) => {
    setNovaPoshtaBranch(branchId);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.NOVA_POSHTA_BRANCH, branchId);
    } catch (error) {
    }
  }, []);

  const handleUkrposhtaCityChange = useCallback(async (cityId: string) => {
    setUkrposhtaCity(cityId);
    const firstBranch = UKRPOSHTA_BRANCHES[cityId]?.[0]?.id || '';
    setUkrposhtaBranch(firstBranch);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.UKRPOSHTA_CITY, cityId);
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.UKRPOSHTA_BRANCH, firstBranch);
    } catch (error) {
    }
  }, []);

  const handleUkrposhtaBranchChange = useCallback(async (branchId: string) => {
    setUkrposhtaBranch(branchId);
    try {
      await AsyncStorage.setItem(CHECKOUT_STORAGE_KEYS.UKRPOSHTA_BRANCH, branchId);
    } catch (error) {

    }
  }, []);

  const handleApplyPromoCode = useCallback(() => {
    setPromoError('');
    const code = promoCodeInput.trim().toUpperCase();

    if (!code) {
      setPromoError('Введіть промокод');
      return;
    }

    const foundPromo = promoCodes.find(p => p.code === code);

    if (!foundPromo) {
      setPromoError('Промокод не знайдено');
      return;
    }

    const cartTotal = getCartTotal();
    if (cartTotal < foundPromo.minOrderAmount) {
      setPromoError(`Мінімальна сума замовлення — ${foundPromo.minOrderAmount} грн`);
      return;
    }

    setAppliedPromoCode(foundPromo);
    setPromoError('');
  }, [promoCodeInput, getCartTotal]);

  const handleRemovePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    setPromoCodeInput('');
    setPromoError('');
  }, []);

  const getFinalTotal = useCallback(() => {
    const cartTotal = getCartTotal();
    if (appliedPromoCode) {
      const discount = (cartTotal * appliedPromoCode.discountPercent) / 100;
      return cartTotal - discount;
    }
    return cartTotal;
  }, [getCartTotal, appliedPromoCode]);

  const getDeliveryAddress = () => {
    switch (selectedDelivery) {
      case 'self_pickup':
        const store = STORES.find(s => s.id === selectedStore);
        return store ? `${store.name}, ${store.address}` : '';
      case 'nova_poshta':
        const npCity = NOVA_POSHTA_CITIES.find(c => c.id === novaPoshtaCity);
        const npBranch = NOVA_POSHTA_BRANCHES[novaPoshtaCity]?.find(b => b.id === novaPoshtaBranch);
        return npCity && npBranch ? `${npCity.name}, ${npBranch.name}: ${npBranch.address}` : '';
      case 'ukrposhta':
        const upCity = UKRPOSHTA_CITIES.find(c => c.id === ukrposhtaCity);
        const upBranch = UKRPOSHTA_BRANCHES[ukrposhtaCity]?.find(b => b.id === ukrposhtaBranch);
        return upCity && upBranch ? `${upCity.name}, ${upBranch.name}: ${upBranch.address}` : '';
      default:
        return '';
    }
  };

  const getDeliveryCity = () => {
    switch (selectedDelivery) {
      case 'self_pickup':
        return 'Полтава';
      case 'nova_poshta':
        return NOVA_POSHTA_CITIES.find(c => c.id === novaPoshtaCity)?.name || '';
      case 'ukrposhta':
        return UKRPOSHTA_CITIES.find(c => c.id === ukrposhtaCity)?.name || '';
      default:
        return '';
    }
  };

  const getDeliveryBranch = () => {
    switch (selectedDelivery) {
      case 'self_pickup':
        const store = STORES.find(s => s.id === selectedStore);
        return store ? `${store.name}, ${store.address}` : '';
      case 'nova_poshta':
        const npBranch = NOVA_POSHTA_BRANCHES[novaPoshtaCity]?.find(b => b.id === novaPoshtaBranch);
        return npBranch ? `${npBranch.name}: ${npBranch.address}` : '';
      case 'ukrposhta':
        const upBranch = UKRPOSHTA_BRANCHES[ukrposhtaCity]?.find(b => b.id === ukrposhtaBranch);
        return upBranch ? `${upBranch.name}: ${upBranch.address}` : '';
      default:
        return '';
    }
  };

  const validateDeliveryAddress = () => {
    // All delivery options now have selectors with default values, so always valid
    return true;
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setErrorMessage('Кошик порожній');
      setShowErrorModal(true);
      return;
    }

    if (!validateDeliveryAddress()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = generateOrderId(selectedPayment);
      const totalAmount = getFinalTotal();
      const deliveryAddress = getDeliveryAddress();
      const promoDiscount = appliedPromoCode ? appliedPromoCode.discountPercent : 0;
      const promoCodeUsed = appliedPromoCode ? appliedPromoCode.code : null;

      if (selectedPayment === 'liqpay') {
        navigation.navigate('Liqpay', {
          amount: Math.round(totalAmount),
          orderId,
          description: `Замовлення ${orderId}`,
          deliveryMethod: selectedDelivery,
          deliveryAddress: deliveryAddress,
          deliveryCostIncluded: selectedDelivery === 'self_pickup' ? DELIVERY_FREE_MESSAGE : DELIVERY_COST_INCLUDED_MESSAGE,
          customerEmail: user?.email || '',
          promoCode: promoCodeUsed,
          promoDiscount: promoDiscount,
          cartItems: items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.image,
            price: Math.round(item.product.discount
              ? item.product.price - (item.product.price * item.product.discount) / 100
              : item.product.price),
            quantity: item.quantity,
          })),
        });
      } else {
        const nameParts = (user?.displayName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const orderData = {
          orderId: orderId,
          userId: user?.uid || 'guest',
          customerEmail: user?.email || '',
          customerFirstName: firstName,
          customerLastName: lastName,
          items: items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.image,
            price: Math.round(item.product.discount
              ? item.product.price - (item.product.price * item.product.discount) / 100
              : item.product.price),
            quantity: item.quantity,
          })),
          totalAmount: Math.round(totalAmount),
          promoCode: promoCodeUsed,
          promoDiscount: promoDiscount,
          deliveryMethod: selectedDelivery,
          deliveryAddress: deliveryAddress,
          deliveryCostIncluded: selectedDelivery === 'self_pickup' ? DELIVERY_FREE_MESSAGE : DELIVERY_COST_INCLUDED_MESSAGE,
          paymentMethod: selectedPayment,
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'orders'), orderData);

        await clearCart();
        navigation.navigate('OrderSuccess');
      }
    } catch (error) {
      setErrorMessage('Не вдалося створити замовлення. Спробуйте ще раз.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={50} color="#1A1A1A" />
          <Text style={styles.loadingText}>Завантаження даних...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.header}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Оформлення замовлення</Text>
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={styles.card}
        >
          <Selector
            title="Спосіб доставки"
            options={DELIVERY_METHODS}
            selectedId={selectedDelivery}
            onSelect={handleDeliverySelect}
          />

          {selectedDelivery === 'self_pickup' && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.subSelectorContainer}
            >
              <Text style={styles.subSelectorTitle}>Оберіть магазин</Text>
              {STORES.map((store) => (
                <Pressable
                  key={store.id}
                  style={[
                    styles.storeOption,
                    selectedStore === store.id && styles.storeOptionSelected,
                  ]}
                  onPress={() => handleStoreSelect(store.id)}
                >
                  <View style={styles.storeInfo}>
                    <Text style={[
                      styles.storeName,
                      selectedStore === store.id && styles.storeNameSelected,
                    ]}>
                      {store.name}
                    </Text>
                    <Text style={styles.storeAddress}>{store.address}</Text>
                    <Text style={styles.storeHours}>{store.hours}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    selectedStore === store.id && styles.radioOuterSelected,
                  ]}>
                    {selectedStore === store.id && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              ))}
            </MotiView>
          )}

          {selectedDelivery === 'nova_poshta' && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.subSelectorContainer}
            >
              <Text style={styles.subSelectorTitle}>Місто</Text>
              <View style={styles.selectorsRow}>
                {NOVA_POSHTA_CITIES.map((city) => (
                  <Pressable
                    key={city.id}
                    style={[
                      styles.cityOption,
                      novaPoshtaCity === city.id && styles.cityOptionSelected,
                    ]}
                    onPress={() => handleNovaPoshtaCityChange(city.id)}
                  >
                    <Text style={[
                      styles.cityOptionText,
                      novaPoshtaCity === city.id && styles.cityOptionTextSelected,
                    ]}>
                      {city.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.subSelectorTitle, { marginTop: 16 }]}>Відділення</Text>
              {NOVA_POSHTA_BRANCHES[novaPoshtaCity]?.map((branch) => (
                <Pressable
                  key={branch.id}
                  style={[
                    styles.branchOption,
                    novaPoshtaBranch === branch.id && styles.branchOptionSelected,
                  ]}
                  onPress={() => handleNovaPoshtaBranchChange(branch.id)}
                >
                  <View style={styles.branchInfo}>
                    <Text style={[
                      styles.branchName,
                      novaPoshtaBranch === branch.id && styles.branchNameSelected,
                    ]}>
                      {branch.name}
                    </Text>
                    <Text style={styles.branchAddress}>{branch.address}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    novaPoshtaBranch === branch.id && styles.radioOuterSelected,
                  ]}>
                    {novaPoshtaBranch === branch.id && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              ))}

              <Text style={[styles.subSelectorTitle, { marginTop: 16 }]}>Вартість доставки</Text>
              <TextInput
                style={styles.addressInput}
                value={DELIVERY_COST_INCLUDED_MESSAGE}
                editable={false}
              />
            </MotiView>
          )}

          {selectedDelivery === 'ukrposhta' && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.subSelectorContainer}
            >
              <Text style={styles.subSelectorTitle}>Місто</Text>
              <View style={styles.selectorsRow}>
                {UKRPOSHTA_CITIES.map((city) => (
                  <Pressable
                    key={city.id}
                    style={[
                      styles.cityOption,
                      ukrposhtaCity === city.id && styles.cityOptionSelected,
                    ]}
                    onPress={() => handleUkrposhtaCityChange(city.id)}
                  >
                    <Text style={[
                      styles.cityOptionText,
                      ukrposhtaCity === city.id && styles.cityOptionTextSelected,
                    ]}>
                      {city.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.subSelectorTitle, { marginTop: 16 }]}>Відділення</Text>
              {UKRPOSHTA_BRANCHES[ukrposhtaCity]?.map((branch) => (
                <Pressable
                  key={branch.id}
                  style={[
                    styles.branchOption,
                    ukrposhtaBranch === branch.id && styles.branchOptionSelected,
                  ]}
                  onPress={() => handleUkrposhtaBranchChange(branch.id)}
                >
                  <View style={styles.branchInfo}>
                    <Text style={[
                      styles.branchName,
                      ukrposhtaBranch === branch.id && styles.branchNameSelected,
                    ]}>
                      {branch.name}
                    </Text>
                    <Text style={styles.branchAddress}>{branch.address}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    ukrposhtaBranch === branch.id && styles.radioOuterSelected,
                  ]}>
                    {ukrposhtaBranch === branch.id && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              ))}

              <Text style={[styles.subSelectorTitle, { marginTop: 16 }]}>Вартість доставки</Text>
              <TextInput
                style={styles.addressInput}
                value={DELIVERY_COST_INCLUDED_MESSAGE}
                editable={false}
              />
            </MotiView>
          )}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 250 }}
          style={styles.card}
        >
          <Selector
            title="Спосіб оплати"
            options={PAYMENT_METHODS}
            selectedId={selectedPayment}
            onSelect={handlePaymentSelect}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Промокод</Text>

          {appliedPromoCode ? (
            <View style={styles.appliedPromoContainer}>
              <View style={styles.appliedPromoInfo}>
                <View style={styles.appliedPromoBadge}>
                  <Ionicons name="pricetag" size={16} color="#FFFFFF" />
                  <Text style={styles.appliedPromoCode}>{appliedPromoCode.code}</Text>
                </View>
                <Text style={styles.appliedPromoDiscount}>
                  Знижка {appliedPromoCode.discountPercent}%
                </Text>
              </View>
              <Pressable onPress={handleRemovePromoCode} style={styles.removePromoBtn}>
                <View style={styles.removePromoBtnCircle}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Введіть промокод"
                placeholderTextColor="#9CA3AF"
                value={promoCodeInput}
                onChangeText={(text) => {
                  setPromoCodeInput(text);
                  setPromoError('');
                }}
                autoCapitalize="characters"
              />
              <Pressable
                style={styles.applyPromoBtn}
                onPress={handleApplyPromoCode}
              >
                <Text style={styles.applyPromoBtnText}>Застосувати</Text>
              </Pressable>
            </View>
          )}

          {promoError ? (
            <Text style={styles.promoErrorText}>{promoError}</Text>
          ) : null}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 350 }}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Підсумок замовлення</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Товарів:</Text>
            <Text style={styles.summaryValue}>{items.reduce((sum, item) => sum + item.quantity, 0)} шт.</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Сума товарів:</Text>
            <Text style={styles.summaryValue}>{getCartTotal().toFixed(0)} ₴</Text>
          </View>
          {appliedPromoCode && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelDiscount}>Знижка:</Text>
              <Text style={styles.summaryValueDiscount}>
                -{((getCartTotal() * appliedPromoCode.discountPercent) / 100).toFixed(0)} ₴
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>До сплати:</Text>
            <Text style={styles.summaryValueTotal}>{getFinalTotal().toFixed(0)} ₴</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 450 }}
        >
          <Pressable
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {selectedPayment === 'liqpay' ? 'Перейти до оплати' : 'Підтвердити замовлення'}
              </Text>
            )}
          </Pressable>
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomModal
        visible={showErrorModal}
        title="Помилка"
        message={errorMessage}
        confirmText="Закрити"
        onConfirm={() => setShowErrorModal(false)}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  selectorContainer: {
    marginBottom: 8,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  selectorOptionSelected: {
    borderColor: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  selectorIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectorIconCircleSelected: {
    backgroundColor: '#1A1A1A',
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  selectorOptionTitleSelected: {
    color: '#1A1A1A',
  },
  selectorOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#1A1A1A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
  },
  subSelectorContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subSelectorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  storeOptionSelected: {
    borderColor: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  storeNameSelected: {
    color: '#1A1A1A',
  },
  storeAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  storeHours: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  selectorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cityOptionSelected: {
    borderColor: '#1A1A1A',
    backgroundColor: '#1A1A1A',
  },
  cityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cityOptionTextSelected: {
    color: '#FFFFFF',
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  branchOptionSelected: {
    borderColor: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  branchNameSelected: {
    color: '#1A1A1A',
  },
  branchAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
  addressInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  addressHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryLabelDiscount: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValueDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  promoInputError: {
    borderColor: '#E5E7EB',
  },
  applyPromoBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyPromoBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  promoErrorText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
  },
  promoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    padding: 14,
  },
  appliedPromoInfo: {
    flex: 1,
  },
  appliedPromoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  appliedPromoCode: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  appliedPromoDiscount: {
    fontSize: 13,
    color: '#1A1A1A',
    marginTop: 6,
    fontWeight: '500',
  },
  removePromoBtn: {
    padding: 4,
  },
  removePromoBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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

export default CheckoutScreen;
