import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MotiPressable } from 'moti/interactions';

interface ProductCardProps {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  discount?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
  index?: number;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  discount,
  onPress,
  onAddToCart,
  index = 0,
}: ProductCardProps) {
  const discountedPrice = discount ? price - (price * discount) / 100 : price;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 500,
        delay: index * 100,
      }}
      style={styles.container}
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
        style={styles.card}
      >

        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
          {(discount || 0) > 0 && (
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={styles.discountBadge}
            >
              <Text style={styles.discountText}>{`-${discount}%`}</Text>
            </MotiView>
          )}
        </View>


        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {name || ''}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{`${discountedPrice.toFixed(0)} ₴`}</Text>
            {(discount || 0) > 0 && (
              <Text style={styles.originalPrice}>{`${price.toFixed(0)} ₴`}</Text>
            )}
          </View>
        </View>


        <MotiPressable
          onPress={onAddToCart}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.9 : 1,
            };
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </MotiPressable>
      </MotiPressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  placeholderText: {
    fontSize: 40,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
});

