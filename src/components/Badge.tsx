import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
    label: string;
    color?: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge = ({ label, color, variant = 'default' }: BadgeProps) => {
    const getBackgroundColor = () => {
        if (color) return color;
        switch (variant) {
            case 'success':
                return colors.success;
            case 'warning':
                return colors.warning;
            case 'danger':
                return colors.danger;
            case 'info':
                return colors.info;
            default:
                return colors.subtext;
        }
    };

    return (
        <View style={[styles.badge, { backgroundColor: getBackgroundColor() }]}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
