import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { MotiView } from 'moti';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
}

export function SearchBar({
  placeholder = 'Search products...',
  value,
  onChangeText,
  onSearch,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <MotiView
      animate={{
        borderColor: isFocused ? '#FF6B35' : '#E0E0E0',
        shadowOpacity: isFocused ? 0.15 : 0.05,
      }}
      transition={{
        type: 'timing',
        duration: 200,
      }}
      style={styles.container}
    >
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={() => onSearch?.(value || '')}
        returnKeyType="search"
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
    padding: 0,
  },
});

