import React from 'react';
import { Pressable, Text, PressableProps, StyleSheet } from 'react-native';
import { MotiPressable } from 'moti/interactions';

interface ButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sm;
      case 'md':
        return styles.md;
      case 'lg':
        return styles.lg;
      default:
        return styles.md;
    }
  };

  const getTextStyle = () => {
    if (variant === 'outline') {
      return styles.outlineText;
    }
    return styles.text;
  };

  return (
    <MotiPressable
      animate={({ pressed }) => {
        'worklet';
        return {
          scale: pressed ? 0.95 : 1,
          opacity: pressed ? 0.9 : 1,
        };
      }}
      transition={{
        type: 'timing',
        duration: 100,
      }}
      style={[styles.base, getVariantStyle(), getSizeStyle()]}
      {...(props as any)}
    >
      <Text style={getTextStyle()}>{children}</Text>
    </MotiPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#FF6B35',
  },
  secondary: {
    backgroundColor: '#2D3436',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});
