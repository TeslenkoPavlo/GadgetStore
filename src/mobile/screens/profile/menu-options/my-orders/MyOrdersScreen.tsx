import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui';
import { type Order } from './OrderDetailScreen';

type RootStackParamList = {
  OrderDetail: { order: Order };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

interface OrderListItemProps {
  order: Order;
  index: number;
  onPress: () => void;
}

function OrderListItem({ order, index, onPress }: OrderListItemProps) {
  const statusInfo = getStatusInfo(order.status);

  return (
    <MotiView
      from={{ translateY: 30 }}
      animate={{ translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 50 + index * 50 }}
    >
      <Pressable style={styles.orderListItem} onPress={onPress}>
        <View style={styles.orderListHeader}>
          <View style={[styles.listStatusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.listStatusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          <Text style={styles.orderListNumber}>#{order.orderId?.slice(-4)}</Text>
        </View>

        <Text style={styles.orderListDate}>{formatDate(order.createdAt)}</Text>

        <View style={styles.orderListFooter}>
          <Text style={styles.orderListTotal}>{formatPrice(order.totalAmount)} ₴</Text>
          <View style={styles.orderListItems}>
            <Text style={styles.orderListItemsText}>
              {order.items?.length || 0} товар{order.items?.length === 1 ? '' : order.items?.length && order.items.length < 5 ? 'и' : 'ів'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

export function MyOrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const ordersData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Order[];

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetail', { order });
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
        <Text style={styles.headerTitle}>Мої замовлення</Text>
        <View style={styles.headerRight} />
      </MotiView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={60} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={48} color="#1A1A1A" />
            </View>
            <Text style={styles.emptyTitle}>Замовлень поки немає</Text>
          </MotiView>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {orders.map((order, index) => (
            <OrderListItem
              key={order.id}
              order={order}
              index={index}
              onPress={() => handleOrderPress(order)}
            />
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  orderListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orderListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  listStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderListNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  orderListDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  orderListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderListTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  orderListItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderListItemsText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
});

export default MyOrdersScreen;
