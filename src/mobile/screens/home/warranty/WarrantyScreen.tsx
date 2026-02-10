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

interface WarrantyScreenProps {
  onBack?: () => void;
}

const sections = [
  {
    title: 'Гарантійні умови',
    icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Усі товари мають офіційну гарантію виробника. Термін гарантії: смартфони, планшети, ноутбуки, телевізори, консолі — 12 місяців; навушники, аудіо, камери, годинники — 12 місяців; аксесуари — 6 місяців.',
  },
  {
    title: 'Що покриває гарантія',
    icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Гарантія поширюється на заводські дефекти та несправності, що виникли не з вини покупця: проблеми з екраном, батареєю, кнопками, динаміками, камерою та іншими компонентами.',
  },
  {
    title: 'Що не покриває гарантія',
    icon: 'close-circle-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Гарантія не поширюється на механічні пошкодження, потрапляння вологи, наслідки неправильної експлуатації, використання неоригінальних аксесуарів та самостійного ремонту.',
  },
  {
    title: 'Повернення товару',
    icon: 'refresh-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Ви маєте право повернути товар належної якості протягом 14 днів з моменту покупки за умови збереження товарного вигляду, оригінальної упаковки та повної комплектації.',
  },
  {
    title: 'Як оформити повернення',
    icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
    content:
      "Зв'яжіться з нами за телефоном +380 96 903 22 35 або відвідайте один з наших магазинів у Полтаві з товаром та чеком.",
  },
  {
    title: 'Терміни повернення коштів',
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    content:
      'Повернення коштів здійснюється протягом 3-5 робочих днів на картку, з якої була здійснена оплата, або готівкою при поверненні в магазині.',
  },
];

const WarrantyScreen: React.FC<WarrantyScreenProps> = ({ onBack }) => {
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
        <Text style={styles.title}>Гарантія та повернення</Text>
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

export default WarrantyScreen;
