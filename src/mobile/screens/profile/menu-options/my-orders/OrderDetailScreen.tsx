import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

const ErrorHint: React.FC<{ message: string }> = ({ message }) => (
  <View style={errorHintStyles.container}>
    <View style={errorHintStyles.iconContainer}>
      <Ionicons name="information-circle" size={18} color="#6B7280" />
    </View>
    <Text style={errorHintStyles.text}>{message}</Text>
  </View>
);

const errorHintStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'ukr.net', 'i.ua', 'meta.ua', 'bigmir.net',
  'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com',
];

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryMethod: string;
  deliveryAddress: string;
  deliveryCostIncluded: string | null;
  paymentMethod: string;
  promoDiscount?: number;
  promoCode?: string;
  status: string;
  createdAt: any;
}

const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: "Обов'язкове поле" };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Мінімум 2 літери' };
  }
  if (name.trim().length > 15) {
    return { isValid: false, error: 'Максимум 15 літер' };
  }
  const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Тільки літери' };
  }
  return { isValid: true };
};

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: "Обов'язкове поле" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Невірний формат email' };
  }
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return { isValid: false, error: 'Непідтримуваний домен' };
  }
  return { isValid: true };
};

const formatPrice = (price: number) => {
  return price?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';

  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];

  let date: Date;
  if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { text: 'Очікує оплати', color: '#1A1A1A', bgColor: '#F2F2F7' };
    case 'paid':
      return { text: 'Оплачено', color: '#1A1A1A', bgColor: '#F2F2F7' };
    case 'processing':
      return { text: 'В обробці', color: '#1A1A1A', bgColor: '#F2F2F7' };
    case 'shipped':
      return { text: 'Відправлено', color: '#1A1A1A', bgColor: '#F2F2F7' };
    case 'delivered':
      return { text: 'Доставлено', color: '#1A1A1A', bgColor: '#F2F2F7' };
    case 'cancelled':
      return { text: 'Скасовано', color: '#1A1A1A', bgColor: '#F2F2F7' };
    default:
      return { text: status, color: '#1A1A1A', bgColor: '#F2F2F7' };
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'cash_on_delivery':
      return 'Оплата при отриманні';
    case 'liqpay':
      return 'LiqPay';
    case 'card':
      return 'Карткою онлайн';
    default:
      return method;
  }
};

type OrderDetailRouteParams = {
  OrderDetail: {
    order: Order;
  };
};

export function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OrderDetailRouteParams, 'OrderDetail'>>();
  const { order } = route.params;

  const [firstName, setFirstName] = useState(order.customerFirstName || '');
  const [lastName, setLastName] = useState(order.customerLastName || '');
  const [email, setEmail] = useState(order.customerEmail || '');

  const [initialFirstName, setInitialFirstName] = useState(order.customerFirstName || '');
  const [initialLastName, setInitialLastName] = useState(order.customerLastName || '');
  const [initialEmail, setInitialEmail] = useState(order.customerEmail || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});
  const [showNoChangesModal, setShowNoChangesModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const hasChanges = () => {
    return firstName.trim() !== initialFirstName ||
        lastName.trim() !== initialLastName ||
        email.trim().toLowerCase() !== initialEmail.toLowerCase();
  };

  const validateAll = () => {
    const firstNameValidation = validateName(firstName);
    const lastNameValidation = validateName(lastName);
    const emailValidation = validateEmail(email);

    const newErrors: { firstName?: string; lastName?: string; email?: string } = {};
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.error;
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error;
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      setShowNoChangesModal(true);
      return;
    }

    if (!validateAll()) return;

    setIsSaving(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        customerFirstName: firstName.trim(),
        customerLastName: lastName.trim(),
        customerEmail: email.trim().toLowerCase(),
        updatedAt: serverTimestamp(),
      });

      setInitialFirstName(firstName.trim());
      setInitialLastName(lastName.trim());
      setInitialEmail(email.trim().toLowerCase());

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await deleteDoc(orderRef);
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusInfo = getStatusInfo(order.status);

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
        <Text style={styles.headerTitle}>
          Замовлення #{order.orderId?.slice(-4)}
        </Text>
        <View style={styles.headerRight} />
      </MotiView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={undefined}
      >
        <ScrollView
          style={styles.detailScrollView}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ translateY: 20 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <View style={[styles.statusContainer, { backgroundColor: statusInfo.bgColor }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 20 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 50 }}
          >
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderNumberText}>
                Замовлення #{order.orderId?.slice(-4) || 'N/A'}
              </Text>
              <Text style={styles.orderDateText}>{formatDate(order.createdAt)}</Text>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 30 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Товари</Text>
              {order.items?.map((item, idx) => (
                <View key={idx} style={[styles.itemRow, idx === order.items.length - 1 && styles.lastItemRow]}>
                  <View style={styles.itemImageContainer}>
                    <Image source={{ uri: item.productImage }} style={styles.itemImage} resizeMode="contain" />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                    <View style={styles.itemPriceQuantity}>
                      <Text style={styles.itemPrice}>{formatPrice(item.price)} ₴</Text>
                      <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 30 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 150 }}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Де забрати</Text>
              <View style={styles.deliveryInfo}>
                {order.deliveryAddress && order.deliveryAddress.includes(',') ? (
                  <>
                    <View style={styles.deliveryRow}>
                      <Ionicons name="business-outline" size={20} color="#6B7280" />
                      <Text style={styles.deliveryCity}>
                        {order.deliveryAddress.split(',')[0]?.trim() || 'Не вказано'}
                      </Text>
                    </View>
                    <View style={styles.deliveryRow}>
                      <Ionicons name="location-outline" size={20} color="#6B7280" />
                      <Text style={styles.deliveryAddress}>
                        {order.deliveryAddress.split(',').slice(1).join(',').trim() || 'Не вказано'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.deliveryRow}>
                    <Ionicons name="location-outline" size={20} color="#6B7280" />
                    <Text style={styles.deliveryAddress}>{order.deliveryAddress || 'Не вказано'}</Text>
                  </View>
                )}
                {order.deliveryCostIncluded && (
                  <View style={styles.deliveryRow}>
                    <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
                    <Text style={styles.deliveryFree}>{order.deliveryCostIncluded}</Text>
                  </View>
                )}
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 30 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Дані отримувача</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ім'я</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (errors.firstName) {
                      const validation = validateName(text);
                      setErrors(prev => ({ ...prev, firstName: validation.isValid ? undefined : validation.error }));
                    }
                  }}
                  onBlur={() => {
                    const validation = validateName(firstName);
                    setErrors(prev => ({ ...prev, firstName: validation.isValid ? undefined : validation.error }));
                  }}
                  placeholder="Введіть ім'я"
                  placeholderTextColor="#9CA3AF"
                  maxLength={20}
                />
                {errors.firstName && <ErrorHint message={errors.firstName} />}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Прізвище</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (errors.lastName) {
                      const validation = validateName(text);
                      setErrors(prev => ({ ...prev, lastName: validation.isValid ? undefined : validation.error }));
                    }
                  }}
                  onBlur={() => {
                    const validation = validateName(lastName);
                    setErrors(prev => ({ ...prev, lastName: validation.isValid ? undefined : validation.error }));
                  }}
                  placeholder="Введіть прізвище"
                  placeholderTextColor="#9CA3AF"
                  maxLength={15}
                />
                {errors.lastName && <ErrorHint message={errors.lastName} />}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Пошта</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      const validation = validateEmail(text);
                      setErrors(prev => ({ ...prev, email: validation.isValid ? undefined : validation.error }));
                    }
                  }}
                  onBlur={() => {
                    const validation = validateEmail(email);
                    setErrors(prev => ({ ...prev, email: validation.isValid ? undefined : validation.error }));
                  }}
                  placeholder="Введіть email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <ErrorHint message={errors.email} />}
              </View>

              <Pressable
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Зберегти</Text>
                )}
              </Pressable>
            </View>
          </MotiView>

          {order.promoDiscount != null && order.promoDiscount > 0 ? (
            <MotiView
              from={{ translateY: 30 }}
              animate={{ translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 250 }}
            >
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Знижка</Text>
                <View style={styles.promoInfoRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
                  <View style={styles.promoInfoContent}>
                    {order.promoCode ? (
                      <Text style={styles.promoCodeText}>{order.promoCode}</Text>
                    ) : null}
                    <Text style={styles.promoDiscountValue}>-{order.promoDiscount}%</Text>
                  </View>
                </View>
              </View>
            </MotiView>
          ) : null}

          <MotiView
            from={{ translateY: 30 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: (order.promoDiscount != null && order.promoDiscount > 0) ? 300 : 250 }}
          >
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>До сплати</Text>
              <Text style={styles.totalAmount}>{formatPrice(order.totalAmount)} ₴</Text>
              <Text style={styles.paymentMethod}>{getPaymentMethodText(order.paymentMethod)}</Text>
            </View>
          </MotiView>

          <MotiView
            from={{ translateY: 20 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: (order.promoDiscount != null && order.promoDiscount > 0) ? 350 : 300 }}
          >
            <Pressable
              style={styles.deleteButton}
              onPress={() => setDeleteModalVisible(true)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Видалити замовлення</Text>
            </Pressable>
          </MotiView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showNoChangesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoChangesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.modalContent}
          >
            <View style={styles.modalIconCircle}>
              <Ionicons name="create-outline" size={32} color="#1A1A1A" />
            </View>
            <Text style={styles.modalTitle}>Немає змін</Text>
            <Text style={styles.modalMessage}>
              Щоб оновити дані, внесіть зміни.
            </Text>
            <Pressable
              style={styles.modalSingleBtn}
              onPress={() => setShowNoChangesModal(false)}
            >
              <Text style={styles.modalSingleBtnText}>Зрозуміло</Text>
            </Pressable>
          </MotiView>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.modalContent}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#000000" />
            </View>
            <Text style={styles.modalTitle}>Успішно!</Text>
            <Text style={styles.modalMessage}>
              Дані замовлення успішно оновлено.
            </Text>
            <Pressable
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>ОК</Text>
            </Pressable>
          </MotiView>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.modalContent}
          >
            <View style={styles.modalIconCircle}>
              <Ionicons name="trash-outline" size={32} color="#1A1A1A" />
            </View>
            <Text style={styles.modalTitle}>Видалити замовлення?</Text>
            <Text style={styles.modalMessage}>
              Ви впевнені, що хочете видалити це замовлення? Цю дію неможливо скасувати.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Скасувати</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDeleteBtn, isDeleting && styles.modalDeleteBtnDisabled]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Видалити</Text>
                )}
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>
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
  headerRight: {
    width: 44,
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 16,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderInfoRow: {
    marginBottom: 20,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  orderDateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItemRow: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  itemImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 6,
  },
  itemPriceQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  deliveryInfo: {
    gap: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryCity: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
    lineHeight: 20,
  },
  deliveryAddress: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
    lineHeight: 20,
  },
  deliveryFree: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6B7280',
  },
  promoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInfoContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  promoCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  promoDiscountValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successButton: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F7F8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDeleteBtnDisabled: {
    opacity: 0.7,
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSingleBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  modalSingleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OrderDetailScreen;
