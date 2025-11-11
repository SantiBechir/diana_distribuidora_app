import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder ?? 'Buscar...'}
        placeholderTextColor={colors.subtext}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    fontSize: 16,
    color: colors.text,
  },
});