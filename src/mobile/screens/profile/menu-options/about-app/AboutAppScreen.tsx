import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export function AboutAppScreen() {
  const navigation = useNavigation();


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
        <Text style={styles.headerTitle}>Про програму</Text>
        <View style={styles.placeholder} />
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.appInfoCard}
        >
          <View style={styles.appIconCircle}>
            <Ionicons name="school" size={36} color="#1A1A1A" />
          </View>
          <View style={styles.appInfoText}>
            <Text style={styles.appName}>GadgetStore</Text>
            <Text style={styles.versionText}>Версія 1.0.0</Text>
            <Text style={styles.yearText}>© 2026</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.card}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="document-text" size={24} color="#1A1A1A" />
          </View>
          <Text style={styles.cardTitle}>Дипломна робота</Text>
          <Text style={styles.cardDescription}>
            Кваліфікаційна робота на підтвердження ступеня фахового молодшого бакалавра
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          style={styles.card}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="business" size={24} color="#1A1A1A" />
          </View>
          <Text style={styles.cardTitle}>Навчальний заклад</Text>
          <Text style={styles.cardDescription}>
            ВСП «ППФК НТУ «ХПІ»
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={styles.card}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="people" size={24} color="#1A1A1A" />
          </View>
          <Text style={styles.cardTitle}>Розробник & Керівник диплому</Text>
          <Text style={styles.authorName}>Тесленко Павло Петрович</Text>
          <Text style={[styles.authorName, { marginTop: 8 }]}>Бабич Олександр Вікторович</Text>
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  appInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  appIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfoText: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
  },
  authorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  supervisorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  yearText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

export default AboutAppScreen;
