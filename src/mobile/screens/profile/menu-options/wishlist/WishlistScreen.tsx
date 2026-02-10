import React, { useState, useCallback } from 'react';
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
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { type Product } from '@/services/api';
import { type RootStackParamList } from '@/navigation/RootNavigator';
import { getCachedProducts } from '@/services/storage';

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

interface WishlistItemCardProps {
  item: Product;
  index: number;
  onRemove: () => void;
  onAddToCart: () => void;
  onGoToCart: () => void;
  onPress: () => void;
  isAdded: boolean;
}

function WishlistItemCard({ item, index, onRemove, onAddToCart, onGoToCart, onPress, isAdded }: WishlistItemCardProps) {
  const discountedPrice = item.discount
    ? item.price - (item.price * item.discount) / 100
    : item.price;

  const formatPrice = (price: number) => {
    return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
    >
      <View style={styles.wishlistItem}>
        <Pressable onPress={onPress} style={styles.itemImageContainer}>
          <View style={styles.itemImageWrapper}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="cube-outline" size={36} color="#9CA3AF" />
              </View>
            )}
          </View>
        </Pressable>

        <View style={styles.itemInfo}>
          <Pressable onPress={onPress}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          </Pressable>

          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>{formatPrice(discountedPrice)} ₴</Text>
            {(item.discount || 0) > 0 && (
              <Text style={styles.oldPrice}>{formatPrice(item.price)} ₴</Text>
            )}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.addToCartBtn}
              onPress={isAdded ? onGoToCart : onAddToCart}
            >
              <Ionicons
                name={isAdded ? "checkmark" : "cart-outline"}
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
            <Pressable style={styles.wishlistIndicator} onPress={onRemove}>
              <Ionicons name="heart" size={20} color="#1A1A1A" />
            </Pressable>
          </View>
        </View>
      </View>
    </MotiView>
  );
}

export function WishlistScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, isInCart, canAddToCart } = useCart();

  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [productToRemove, setProductToRemove] = useState<{ id: string; name: string } | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const loadProducts = async () => {
      const cached = await getCachedProducts();
      if (cached) {
        setAllProducts(cached);
      }
    };
    loadProducts();
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    const relatedProducts = allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 6);
    navigation.navigate('ProductDetail', { product, relatedProducts });
  }, [navigation, allProducts]);

  const handleAddToCart = useCallback((product: Product) => {
    const alreadyInCart = isInCart(product.id);

    if (!alreadyInCart && !canAddToCart()) {
      setLimitModalVisible(true);
      return;
    }

    const added = addToCart(product);
    if (!added) {
      setLimitModalVisible(true);
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

  const handleRemove = (productId: string, productName: string) => {
    setProductToRemove({ id: productId, name: productName });
    setRemoveModalVisible(true);
  };

  const confirmRemove = () => {
    if (productToRemove) {
      removeFromWishlist(productToRemove.id);
    }
    setRemoveModalVisible(false);
    setProductToRemove(null);
  };

  const handleClearWishlist = () => {
    setClearModalVisible(true);
  };

  const confirmClearWishlist = async () => {
    await clearWishlist();
    setClearModalVisible(false);
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
        <Text style={styles.headerTitle}>Вподобане</Text>
        {items.length > 0 && (
          <Pressable onPress={handleClearWishlist} style={styles.clearBtn}>
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
              <Ionicons name="heart-outline" size={48} color="#1A1A1A" />
            </View>
            <Text style={styles.emptyTitle}>Список порожній</Text>
            <Pressable style={styles.catalogButton} onPress={handleGoToCatalog}>
              <Text style={styles.catalogButtonText}>До каталогу</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </Pressable>
          </MotiView>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item: Product, index: number) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              index={index}
              onRemove={() => handleRemove(item.id, item.name)}
              onAddToCart={() => handleAddToCart(item)}
              onGoToCart={handleGoToCart}
              onPress={() => handleProductPress(item)}
              isAdded={addedProducts.has(item.id)}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      <CustomModal
        visible={clearModalVisible}
        title="Очистити вподобане"
        message="Ви впевнені, що хочете видалити всі товари зі списку вподобаних?"
        confirmText="Очистити"
        cancelText="Скасувати"
        onConfirm={confirmClearWishlist}
        onCancel={() => setClearModalVisible(false)}
        icon="trash-outline"
      />
      <CustomModal
        visible={removeModalVisible}
        title="Видалити товар"
        message={`Ви впевнені, що хочете видалити "${productToRemove?.name || ''}" зі списку вподобаних?`}
        confirmText="Видалити"
        cancelText="Скасувати"
        onConfirm={confirmRemove}
        onCancel={() => { setRemoveModalVisible(false); setProductToRemove(null); }}
        icon="close-circle-outline"
      />
      <CustomModal
        visible={limitModalVisible}
        title="Кошик заповнено"
        message="Ви можете додати не більше 5 різних товарів до кошика. Видаліть один з товарів, щоб додати новий."
        confirmText="До кошика"
        cancelText="Закрити"
        onConfirm={() => {
          setLimitModalVisible(false);
          navigation.navigate('Cart');
        }}
        onCancel={() => setLimitModalVisible(false)}
        icon="cart"
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
  wishlistItem: {
    flexDirection: 'row',
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
  itemImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    padding: 8,
    position: 'relative',
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addToCartBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  wishlistIndicator: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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

export default WishlistScreen;
