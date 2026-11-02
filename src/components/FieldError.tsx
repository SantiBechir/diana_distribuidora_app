import React from 'react';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: 4 }}>{message}</Text>
  ) : null;
}
