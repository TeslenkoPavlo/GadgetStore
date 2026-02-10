import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

interface PromoCodesScreenProps {
  onBack?: () => void;
}


export interface PromoCode {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountPercent: number;
  minOrderAmount: number;
  validUntil: string;
  steps: string[];
  conditions: string;
}

export const promoCodes: PromoCode[] = [
  {
    id: '1',
    code: 'START',
    title: '',
    description: '',
    discount: '-10%',
    discountPercent: 10,
    minOrderAmount: 500,
    validUntil: '01.08.2026',
    steps: [],
    conditions: 'Мінімальна сума замовлення — 500 грн.',
  },
  {
    id: '2',
    code: 'BONUS',
    title: '',
    description: '',
    discount: '-15%',
    discountPercent: 15,
    minOrderAmount: 2000,
    validUntil: '15.09.2026',
    steps: [],
    conditions: 'Мінімальна сума замовлення — 2000 грн.',
  },
  {
    id: '3',
    code: 'SALE',
    title: '',
    description: '',
    discount: '-20%',
    discountPercent: 20,
    minOrderAmount: 3000,
    validUntil: '01.10.2026',
    steps: [],
    conditions: 'Мінімальна сума замовлення — 3000 грн.',
  },
  {
    id: '4',
    code: 'VIP',
    title: '',
    description: '',
    discount: '-25%',
    discountPercent: 25,
    minOrderAmount: 5000,
    validUntil: '30.11.2026',
    steps: [],
    conditions: 'Мінімальна сума замовлення — 5000 грн.',
  },
  {
    id: '5',
    code: 'HELLO',
    title: '',
    description: '',
    discount: '-5%',
    discountPercent: 5,
    minOrderAmount: 300,
    validUntil: '31.12.2026',
    steps: [],
    conditions: 'Мінімальна сума замовлення — 300 грн.',
  },
];

export default function PromoCodesScreen({ onBack }: PromoCodesScreenProps) {
  const navigation = useNavigation();
  const backgroundColor = '#FFFFFF';
  const textColor = '#000000';
  const cardBackground = '#FFFFFF';
  const secondaryText = 'rgba(0,0,0,0.5)';

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const copyToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setShowCopyModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <MotiView
        from={{ translateY: -20 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Ваші промокоди</Text>
        <View style={styles.headerRight} />
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {promoCodes.map((promo, index) => (
          <MotiView
            key={promo.id}
            from={{ translateY: 30 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 50 + index * 50 }}
            style={styles.promoCardWrapper}
          >
            <View style={[styles.promoContentBlock, { backgroundColor: cardBackground }]}>
              <View style={styles.promoHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{promo.discount}</Text>
                </View>
                <View style={styles.promoCodeContainer}>
                  <Text style={[styles.promoCodeLabel, { color: secondaryText }]}>Промокод</Text>
                  <Text style={[styles.promoCode, { color: textColor }]}>{promo.code}</Text>
                </View>
              </View>

              <View style={styles.timelineContainer}>
                <View style={styles.timelineLineContainer}>
                  <View style={styles.timelineIconCircle}>
                    <Ionicons name="information-circle-outline" size={16} color={secondaryText} />
                  </View>
                  <View style={styles.timelineVerticalLine} />
                  <View style={styles.timelineIconCircle}>
                    <Ionicons name="time-outline" size={16} color={secondaryText} />
                  </View>
                </View>

                <View style={styles.timelineTextContainer}>
                  <Text style={[styles.timelineText, { color: secondaryText }]}>
                    {promo.conditions}
                  </Text>
                  <Text style={[styles.timelineText, { color: secondaryText }]}>
                    Діє до {promo.validUntil}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.copyButton}
                activeOpacity={0.8}
                onPress={() => copyToClipboard(promo.code)}
              >
                <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                <Text style={styles.copyButtonText}>Скопіювати код</Text>
              </TouchableOpacity>
            </View>

            {index < promoCodes.length - 1 && (
              <View style={styles.sectionSeparator} />
            )}
          </MotiView>
        ))}
      </ScrollView>

      <Modal visible={showCopyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.modalContent}
          >
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#1A1A1A" />
            </View>
            <Text style={styles.modalTitle}>Код скопійовано!</Text>
            <Text style={styles.modalMessage}>
              Промокод <Text style={styles.modalCodeText}>{copiedCode}</Text> успішно скопійовано в буфер обміну
            </Text>
            <Pressable
              style={styles.modalConfirmBtn}
              onPress={() => setShowCopyModal(false)}
            >
              <Text style={styles.modalConfirmText}>OK</Text>
            </Pressable>
          </MotiView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  promoCardWrapper: {
    marginBottom: 12,
  },
  promoContentBlock: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  discountBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  promoCodeContainer: {
    marginLeft: 14,
  },
  promoCodeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  timelineContainer: {
    flexDirection: 'row',
  },
  timelineLineContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineVerticalLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  timelineTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  timelineText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionSeparator: {
    height: 2,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 20,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  modalCodeText: {
    fontWeight: '700',
    color: '#1A1A1A',
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
