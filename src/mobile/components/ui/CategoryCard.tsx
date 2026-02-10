import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';

interface CategoryCardProps {
  id: number | string;
  name: string;
  icon: string;
  color?: string;
  onPress?: () => void;
  index?: number;
}

export function CategoryCard({
  id,
  name,
  icon,
  color = '#FF6B35',
  onPress,
  index = 0,
}: CategoryCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        delay: index * 50,
      }}
    >
      <MotiPressable
        onPress={onPress}
        animate={({ pressed }) => {
          'worklet';
          return {
            scale: pressed ? 0.95 : 1,
          };
        }}
        transition={{
          type: 'timing',
          duration: 100,
        }}
        style={styles.container}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Text style={styles.icon}>{icon || ''}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {name || ''}
        </Text>
      </MotiPressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D3436',
    textAlign: 'center',
    maxWidth: 64,
  },
});

