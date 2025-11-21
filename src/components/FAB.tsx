import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface FABProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const FAB = ({ onPress, icon = 'add' }: FABProps) => {
    return (
        <TouchableOpacity style={styles.fab} onPress={onPress}>
            <Ionicons name={icon} size={24} color={colors.white} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
});
