import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';

interface BannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  backgroundColor?: string;
  image?: string;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

export function Banner({
  title,
  subtitle,
  buttonText = 'Shop Now',
  backgroundColor = '#FF6B35',
  image,
  onPress,
}: BannerProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{
        type: 'timing',
        duration: 600,
      }}
    >
      <MotiPressable
        onPress={onPress}
        animate={({ pressed }) => {
          'worklet';
          return {
            scale: pressed ? 0.98 : 1,
          };
        }}
        transition={{
          type: 'timing',
          duration: 150,
        }}
        style={[styles.container, { backgroundColor }]}
      >
        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: 200,
            }}
          >
            <Text style={styles.title}>{title || ''}</Text>
          </MotiView>

          {subtitle && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: 300,
              }}
            >
              <Text style={styles.subtitle}>{subtitle || ''}</Text>
            </MotiView>
          )}

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'spring',
              damping: 15,
              delay: 400,
            }}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>{buttonText || ''}</Text>
            </View>
          </MotiView>
        </View>

        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </MotiPressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 160,
  },
  content: {
    flex: 1,
    zIndex: 1,
    maxWidth: '70%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 14,
  },
  decorCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    right: -30,
    top: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    right: 50,
    bottom: -20,
  },
});

