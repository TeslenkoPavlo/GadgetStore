import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface DeliveryMethodsScreenProps {
  onBack?: () => void;
}

const deliveryMethods = [
  {
    title: 'Нова Пошта',
    icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Доставка до відділення або поштомату Нової Пошти по всій Україні. Термін доставки: 1-3 робочих дні.',
  },
  {
    title: 'Укрпошта',
    icon: 'mail-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Економна доставка через Укрпошту. Термін доставки: 3-7 робочих днів. Ідеально підходить для невеликих замовлень.',
  },
  {
    title: 'Самовивіз',
    icon: 'storefront-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Безкоштовний самовивіз з наших магазинів у Полтаві (вул. Соборності, 33 та вул. Соборності, 46). Товар буде готовий до отримання протягом 1-2 годин після підтвердження замовлення.',
  },
];

const DeliveryMethodsScreen: React.FC<DeliveryMethodsScreenProps> = ({ onBack }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Способи доставки</Text>
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
          {deliveryMethods.map((method, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: 'timing',
                duration: 350,
                delay: 300 + index * 100,
              }}
            >
              <View style={[styles.methodHeader, index === 0 && styles.firstMethodHeader]}>
                <View style={styles.iconCircle}>
                  <Ionicons name={method.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitle}>
                  {method.title}
                </Text>
              </View>
              <Text style={styles.paragraph}>{method.content}</Text>
            </MotiView>
          ))}
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  firstMethodHeader: {
    marginTop: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(0,0,0,0.5)',
    marginLeft: 48,
  },
});

export default DeliveryMethodsScreen;

