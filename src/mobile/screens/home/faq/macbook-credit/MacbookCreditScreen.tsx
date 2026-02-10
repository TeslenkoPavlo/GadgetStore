import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface MacbookCreditScreenProps {
  onBack?: () => void;
}

const FAQ_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/FAQ%2Fmacbook-credit-banner%2F0.jpg?alt=media';

const sections = [
  {
    title: 'Оплата частинами',
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'На жаль, наразі оплата частинами недоступна. Наш магазин нещодавно відкрився, і ми активно працюємо над підключенням цієї послуги.',
  },
  {
    title: 'Плани на майбутнє',
    icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Ми плануємо додати можливість оформлення розстрочки від ПриватБанку та Monobank найближчим часом. Слідкуйте за оновленнями!',
  },
  {
    title: 'Як придбати зараз',
    icon: 'cart-outline' as keyof typeof Ionicons.glyphMap,
    content:
      "Наразі ви можете придбати MacBook за повну вартість з оплатою при отриманні або онлайн. Зв'яжіться з нами для консультації!",
  },
];

const MacbookCreditScreen: React.FC<MacbookCreditScreenProps> = ({ onBack }) => {
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
        <Text style={styles.title}>Розстрочка на MacBook</Text>
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.questionCard}
        >
          <Image
            source={{ uri: FAQ_IMAGE }}
            style={styles.questionImage}
            resizeMode="cover"
          />
          <View style={styles.questionOverlay}>
            <View style={styles.questionContent}>
              <View style={styles.questionIconCircle}>
                <Ionicons name="help" size={20} color="#1A1A1A" />
              </View>
              <Text style={styles.questionText}>Як оформити розстрочку на MacBook?</Text>
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={styles.card}
        >
          {sections.map((section, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: 'timing',
                duration: 350,
                delay: 350 + index * 100,
              }}
            >
              <View style={[styles.sectionHeader, index === 0 && styles.firstSectionHeader]}>
                <View style={styles.iconCircle}>
                  <Ionicons name={section.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.paragraph}>{section.content}</Text>
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
  questionCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
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
  },
  questionImage: {
    width: '100%',
    height: 180,
  },
  questionOverlay: {
    padding: 16,
  },
  questionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 22,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  firstSectionHeader: {
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
    flex: 1,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(0,0,0,0.5)',
    marginLeft: 48,
  },
});

export default MacbookCreditScreen;

