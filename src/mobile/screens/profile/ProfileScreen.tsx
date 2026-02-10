import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { type RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileScreenProps {
  cartCount: number;
  wishlistCount?: number;
  ordersCount?: number;
  setOrdersCount?: (count: number) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    card: string;
  };
  onCartPress?: () => void;
  shouldAnimate?: boolean;
}

export function ProfileScreen({
  cartCount,
  wishlistCount = 0,
  ordersCount = 0,
  setOrdersCount,
  onCartPress,
  shouldAnimate = true,
}: ProfileScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useContext(AuthContext);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const loadOrdersCount = async () => {
        if (!user?.uid || !setOrdersCount) return;

        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          setOrdersCount(snapshot.size);
        } catch (error) {
          console.error('Error loading orders count:', error);
        }
      };

      loadOrdersCount();
    }, [user?.uid, setOrdersCount])
  );

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setDisplayName(user?.displayName || 'Користувач');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const firstName = userData.firstName || '';
          const lastName = userData.lastName || '';

          if (firstName || lastName) {
            setDisplayName(`${firstName} ${lastName}`.trim());
          } else {
            setDisplayName(user?.displayName || 'Користувач');
          }
        } else {
          setDisplayName(user?.displayName || 'Користувач');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setDisplayName(user?.displayName || 'Користувач');
      }
    };

    loadUserData();
  }, [user?.uid, user?.displayName]);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Помилка', 'Не вдалося вийти з акаунту');
    }
  };

  const cancelLogout = () => {
    setLogoutModalVisible(false);
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.screenBackground}
      >
        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 0 }}
        >
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'user@gadgetstore.ua'}</Text>
              </View>
            </View>
          </View>
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 50 }}
        >
          <ProfileMenuItem
            iconName="person-outline"
            title="Редагування профілю"
            onPress={() => navigation.navigate('EditProfile')}
          />
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 100 }}
        >
          <ProfileMenuItem
            iconName="cart-outline"
            title="Кошик"
            badge={cartCount}
            onPress={onCartPress}
          />
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 150 }}
        >
          <ProfileMenuItem
            iconName="heart-outline"
            title="Вподобане"
            badge={wishlistCount}
            onPress={() => navigation.navigate('Wishlist')}
          />
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 200 }}
        >
          <ProfileMenuItem
            iconName="document-text-outline"
            title="Мої замовлення"
            badge={ordersCount}
            onPress={() => navigation.navigate('MyOrders')}
          />
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 225 }}
        >
          <ProfileMenuItem
            iconName="chatbubbles-outline"
            title="ШІ-консультант"
            onPress={() => navigation.navigate('AiAssistant')}
          />
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 250 }}
        >
          <ProfileMenuItem
            iconName="information-circle-outline"
            title="Про програму"
            onPress={() => navigation.navigate('AboutApp')}
          />
        </MotiView>

        <MotiView
          from={shouldAnimate ? { translateY: 30 } : undefined}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: shouldAnimate ? 400 : 0, delay: 300 }}
        >
          <ProfileMenuItem
            iconName="log-out-outline"
            title="Вийти з акаунту"
            onPress={handleLogout}
          />
        </MotiView>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Вихід</Text>
            <Text style={styles.modalMessage}>Ви впевнені, що хочете вийти з акаунту?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelButton} onPress={cancelLogout}>
                <Text style={styles.modalCancelText}>Скасувати</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmButton} onPress={confirmLogout}>
                <Text style={styles.modalConfirmText}>Вийти</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileMenuItem({ iconName, title, badge, onPress }: {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.menuCard} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.menuTitle}>{title || ''}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{String(badge)}</Text>
        </View>
      )}
      <View style={styles.arrowCircle}>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenBackground: {
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#F5F7F8',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  profileInfo: {
    marginLeft: 18,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: '#000000',
  },
  profileEmail: {
    fontSize: 15,
    color: '#666666',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F8',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#000000',
    paddingHorizontal: 7,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F7F8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
