import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart, CartItem } from '@/context/CartContext';
import { type RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

function CustomModal({ visible, title, message, confirmText, cancelText, onConfirm, onCancel, icon }: CustomModalProps) {
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
            <View style={styles.modalIconCircle}>
              <Ionicons name={icon} size={48} color="#1A1A1A" />
            </View>
          )}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtons}>
            {cancelText && (
              <Pressable style={styles.modalCancelBtn} onPress={onCancel}>
                <Text style={styles.modalCancelText}>{cancelText}</Text>
              </Pressable>
            )}
            <Pressable style={styles.modalConfirmBtn} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

export function CartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [productToRemove, setProductToRemove] = useState<{ id: string; name: string } | null>(null);

  const handleIncrement = (productId: string, currentQuantity: number) => {
    if (currentQuantity < 10) {
      updateQuantity(productId, currentQuantity + 1);
    }
  };

  const handleDecrement = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleRemove = (productId: string, productName: string) => {
    setProductToRemove({ id: productId, name: productName });
    setRemoveModalVisible(true);
  };

  const confirmRemove = () => {
    if (productToRemove) {
      removeFromCart(productToRemove.id);
    }
    setRemoveModalVisible(false);
    setProductToRemove(null);
  };

  const handleClearCart = () => {
    setClearModalVisible(true);
  };

  const confirmClearCart = async () => {
    await clearCart();
    setClearModalVisible(false);
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  const handleProductPress = (item: CartItem) => {
    navigation.navigate('ProductDetail', {
      product: item.product,
      relatedProducts: []
    });
  };

  const handleGoToCatalog = () => {
    navigation.navigate('MainTabs', { screen: 'Catalog' });
  };

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
        <Text style={styles.headerTitle}>Кошик</Text>
        {items.length > 0 && (
          <Pressable onPress={handleClearCart} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color="#1A1A1A" />
          </Pressable>
        )}
      </MotiView>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.emptyContent}
          >
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={48} color="#1A1A1A" />
            </View>
            <Text style={styles.emptyTitle}>Кошик порожній</Text>
            <Pressable style={styles.catalogButton} onPress={handleGoToCatalog}>
              <Text style={styles.catalogButtonText}>До каталогу</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </Pressable>
          </MotiView>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {items.map((item: CartItem, index: number) => (
              <CartItemCard
                key={item.product.id}
                item={item}
                index={index}
                onIncrement={() => handleIncrement(item.product.id, item.quantity)}
                onDecrement={() => handleDecrement(item.product.id, item.quantity)}
                onRemove={() => handleRemove(item.product.id, item.product.name)}
                onProductPress={() => handleProductPress(item)}
              />
            ))}
            <View style={{ height: 180 }} />
          </ScrollView>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Всього товарів:</Text>
              <Text style={styles.summaryValue}>
                {items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)} шт.
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>До сплати:</Text>
              <Text style={styles.totalValue}>{getCartTotal().toFixed(0)} ₴</Text>
            </View>
            <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Оформити замовлення</Text>
            </Pressable>
          </View>
        </>
      )}

      <CustomModal
        visible={clearModalVisible}
        title="Очистити кошик"
        message="Ви впевнені, що хочете видалити всі товари з кошика?"
        confirmText="Очистити"
        cancelText="Скасувати"
        onConfirm={confirmClearCart}
        onCancel={() => setClearModalVisible(false)}
        icon="trash-outline"
      />

      <CustomModal
        visible={removeModalVisible}
        title="Видалити товар"
        message={`Ви впевнені, що хочете видалити "${productToRemove?.name || ''}" з кошика?`}
        confirmText="Видалити"
        cancelText="Скасувати"
        onConfirm={confirmRemove}
        onCancel={() => { setRemoveModalVisible(false); setProductToRemove(null); }}
        icon="close-circle-outline"
      />
    </SafeAreaView>
  );
}

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onProductPress: () => void;
}

function CartItemCard({ item, index, onIncrement, onDecrement, onRemove, onProductPress }: CartItemCardProps) {
  const { product, quantity } = item;
  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;
  const itemTotal = discountedPrice * quantity;

  const formatPrice = (price: number) => {
    return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
    >
      <View style={styles.cartItem}>
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="close" size={18} color="#6B7280" />
        </Pressable>

        <Pressable onPress={onProductPress} style={styles.itemImageContainer}>
          <View style={styles.itemImageWrapper}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.itemImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="cube-outline" size={36} color="#9CA3AF" />
              </View>
            )}
          </View>
        </Pressable>

        <View style={styles.itemInfo}>
          <Pressable onPress={onProductPress}>
            <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
          </Pressable>

          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>{formatPrice(discountedPrice)} ₴</Text>
            {(product.discount || 0) > 0 && (
              <Text style={styles.oldPrice}>{formatPrice(product.price)} ₴</Text>
            )}
          </View>

          <View style={styles.quantityTotalRow}>
            <View style={styles.quantityControls}>
              <Pressable
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={onDecrement}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? '#D1D5DB' : '#1A1A1A'} />
              </Pressable>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Pressable
                style={[styles.quantityButton, quantity >= 10 && styles.quantityButtonDisabled]}
                onPress={onIncrement}
                disabled={quantity >= 10}
              >
                <Ionicons name="add" size={20} color={quantity >= 10 ? '#D1D5DB' : '#1A1A1A'} />
              </Pressable>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.itemTotal} numberOfLines={1} adjustsFontSizeToFit>{formatPrice(itemTotal)} ₴</Text>
            </View>
          </View>
        </View>
      </View>
    </MotiView>
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
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  catalogButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    paddingTop: 48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    padding: 8,
  },
  itemImageWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
    paddingRight: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  oldPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  quantityTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 40,
    textAlign: 'center',
  },
  totalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexShrink: 1,
    marginLeft: 12,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
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
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  checkoutButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  checkoutButtonText: {
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalConfirmBtn: {
    flex: 1,
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

export default CartScreen;
