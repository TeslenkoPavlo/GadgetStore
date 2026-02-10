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

interface AboutUsScreenProps {
  onBack?: () => void;
}

const sections = [
  {
    title: 'Про GadgetStore',
    icon: 'storefront-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'GadgetStore — мережа магазинів техніки у Полтаві, що працює з 2026 року. Ми спеціалізуємось на продажу смартфонів, планшетів, ноутбуків та аксесуарів від провідних брендів.',
  },
  {
    title: 'Наша команда',
    icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'У нас працює команда з 2 досвідчених консультантів, які допоможуть обрати ідеальний гаджет саме для вас. Кожен з них пройшов навчання від офіційних представників Apple, Samsung та Xiaomi.',
  },
  {
    title: 'Асортимент',
    icon: 'phone-portrait-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'В асортименті iPhone, Samsung Galaxy, Xiaomi, MacBook, iPad, AirPods та багато іншого. Тільки оригінальні товари з офіційною гарантією.',
  },
  {
    title: 'Наші клієнти',
    icon: 'heart-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Наші клієнти завжди задоволені покупками та сервісом. Багато з них повертаються до нас знову або рекомендують друзям та знайомим.',
  },
  {
    title: 'Чому обирають нас',
    icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Конкурентні ціни, швидка доставка по Україні, можливість перевірити товар перед покупкою та професійна консультація — ось чому клієнти обирають GadgetStore.',
  },
  {
    title: "Зв'язатися з нами",
    icon: 'call-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Телефон: +380 96 903 22 35. Email: teslenkopasha5@gmail.com. Ми на зв\'язку з 9:00 до 17:00 у будні дні.',
  },
];

const AboutUsScreen: React.FC<AboutUsScreenProps> = ({ onBack }) => {
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
        <Text style={styles.title}>Про нас</Text>
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
          {sections.map((section, index) => (
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

export default AboutUsScreen;

