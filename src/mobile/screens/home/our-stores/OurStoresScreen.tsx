import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

interface OurStoresScreenProps {
  onBack?: () => void;
}


const stores = [
  {
    id: '1',
    name: 'GadgetStore №1',
    address: 'вул. Соборності, 33, Полтава, Україна',
    phone: '+380969032235',
    hours: 'Пн-Пт: 9:00 - 17:00, Сб-Нд: вихідний',
    coordinates: { lat: 49.5879527, lng: 34.5508599 },
  },
  {
    id: '2',
    name: 'GadgetStore №2',
    address: 'вул. Соборності, 46, Полтава, Україна',
    phone: '+380954100830',
    hours: 'Пн-Пт: 9:00 - 17:00, Сб-Нд: вихідний',
    coordinates: { lat: 49.5930488, lng: 34.5446376 },
  },
];

const OurStoresScreen: React.FC<OurStoresScreenProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const [expandedStore, setExpandedStore] = useState<string | null>(stores[0].id);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const openInMaps = (store: typeof stores[0]) => {
    const { lat, lng } = store.coordinates;
    const latLng = `${lat},${lng}`;
    const label = store.name;
    const url = `geo:0,0?q=${latLng}(${label})`;

    Linking.openURL(url);
  };

  const callPhone = (phone: string) => {
    const phoneNumber = phone.replace(/[^+\d]/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderMapHtml = (store: typeof stores[0]) => {
    return `
      <!DOCTYPE html>
      <html lang="uk">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; }
            iframe { width: 100%; height: 100%; border: 0; border-radius: 12px; }
          </style>
        </head>
        <body>
          <iframe 
            src="https://www.google.com/maps?q=${store.coordinates.lat},${store.coordinates.lng}&z=16&output=embed"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </body>
      </html>
    `;
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
        <Text style={styles.title}>Наші магазини</Text>
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {stores.map((store, index) => (
          <MotiView
            key={store.id}
            from={{ opacity: 0, translateY: 40, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 200 + index * 150 }}
            style={styles.storeCard}
          >
            <TouchableOpacity
              style={styles.storeHeader}
              onPress={() => setExpandedStore(expandedStore === store.id ? null : store.id)}
              activeOpacity={0.7}
            >
              <View style={styles.storeIconCircle}>
                <Ionicons name="storefront" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.storeHeaderText}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeAddress}>{store.address}</Text>
              </View>
              <Ionicons
                name={expandedStore === store.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#666666"
              />
            </TouchableOpacity>

            {expandedStore === store.id && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View style={styles.mapContainer}>
                  <WebView
                    source={{ html: renderMapHtml(store) }}
                    style={styles.map}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                  />
                </View>

                <View style={styles.storeInfo}>
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => callPhone(store.phone)}
                  >
                    <View style={styles.infoIconCircle}>
                      <Ionicons name="call-outline" size={16} color="#1A1A1A" />
                    </View>
                    <Text style={styles.infoText}>{store.phone}</Text>
                  </TouchableOpacity>

                  <View style={styles.infoRow}>
                    <View style={styles.infoIconCircle}>
                      <Ionicons name="time-outline" size={16} color="#1A1A1A" />
                    </View>
                    <Text style={styles.infoText}>{store.hours}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openInMaps(store)}
                  >
                    <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Маршрут</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => callPhone(store.phone)}
                  >
                    <Ionicons name="call-outline" size={18} color="#1A1A1A" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Зателефонувати</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            )}
          </MotiView>
        ))}
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
  storeCard: {
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
    marginBottom: 16,
    overflow: 'hidden',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  storeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeHeaderText: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  storeInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    color: '#1A1A1A',
  },
});

export default OurStoresScreen;

