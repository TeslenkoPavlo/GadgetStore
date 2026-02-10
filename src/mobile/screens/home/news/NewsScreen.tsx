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


interface NewsScreenProps {
  onBack?: () => void;
}

const NEWS_DATA = [
  {
    id: '1',
    title: 'Партнерство з Meest ПОШТА',
    description: 'GadgetStore підписує угоду з Meest! Незабаром доставка ваших замовлень стане ще швидшою та зручнішою по всій Україні.',
    date: '15 вересня 2026',
    image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/news%2Fukraine-digital-logistics-tech-map%2F0.jpg?alt=media',
  },
  {
    id: '2',
    title: 'Відкриття магазинів у 5 нових містах',
    description: 'Плануємо розширення мережі! Вінниця, Львів, Чернігів, Рівне та Івано-Франківськ — GadgetStore невдовзі буде ближче до вас.',
    date: '10 жовтня 2026',
    image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/news%2Fdigital-ukraine-network-map%2F0.jpg?alt=media',
  },
  {
    id: '3',
    title: 'Онлайн-підтримка 24/7',
    description: 'Запускаємо цілодобову службу підтримки! Наші консультанти будуть на зв\'язку в будь-який час, щоб допомогти з вашими питаннями.',
    date: '15 жовтня 2026',
    image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/news%2Fdigital-time-chat-interface%2F0.jpg?alt=media',
  },
  {
    id: '4',
    title: 'Запуск програми лояльності GadgetClub',
    description: 'Накопичуйте бали за кожну покупку та обмінюйте їх на знижки! Реєстрація в програмі відкриється восени.',
    date: '1 листопада 2026',
    image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/news%2Fabstract-financial-growth-concept%2F0.jpg?alt=media',
  },
  {
    id: '5',
    title: 'Благодійна акція "Гаджети для шкіл"',
    description: 'GadgetStore долучається до підтримки освіти. Частина коштів з кожної покупки піде на забезпечення шкіл сучасною технікою.',
    date: '5 листопада 2026',
    image: 'https://firebasestorage.googleapis.com/v0/b/ecommercemobileapp-9b513.firebasestorage.app/o/news%2Fdigital-education-innovation-concept%2F0.jpg?alt=media',
  },
];

const NewsScreen: React.FC<NewsScreenProps> = ({ onBack }) => {
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
        <Text style={styles.title}>Новини</Text>
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.newsGrid}>
          {NEWS_DATA.map((news, index) => (
            <MotiView
              key={news.id}
              from={{ opacity: 0, translateY: 30, scale: 0.95 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: 150 + index * 80,
              }}
              style={styles.newsCard}
            >
              <View style={styles.imageContainer}>
                {news.image ? (
                  <Image
                    source={{ uri: news.image }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#C7C7CC" />
                  </View>
                )}
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.dateText}>{news.date}</Text>
                </View>
              </View>
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {news.title}
                </Text>
                <Text style={styles.newsDescription} numberOfLines={3}>
                  {news.description}
                </Text>
              </View>
            </MotiView>
          ))}
        </View>
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
    fontSize: 24,
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
  newsGrid: {
    flexDirection: 'column',
  },
  newsCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
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
    overflow: 'hidden',
  },
  lastOddCard: {
    // No longer needed since all cards are full width
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(0,0,0,0.5)',
  },
});

export default NewsScreen;
