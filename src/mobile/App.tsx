import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoadingSpinner } from '@/components/ui';
import '@/global.css';

function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.loadingContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <LoadingSpinner size={60} />
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoadingScreen onFinish={() => setIsLoading(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <RootNavigator />
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

