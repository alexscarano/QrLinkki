import React from 'react';
import { Pressable, StyleSheet, Platform, useWindowDimensions, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type IconButtonProps = {
    name: React.ComponentProps<typeof MaterialIcons>['name'];
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle | ViewStyle[];
    size?: number; // sobrescrita opcional
};

const IconButton = React.forwardRef<any, IconButtonProps>(
    ({ name, onPress, accessibilityLabel, accessibilityHint, variant = 'secondary', style, size }, ref) => {
        const { width } = useWindowDimensions();
        const isNarrowWeb = Platform.OS === 'web' && width <= 420;
        const btnSize = size ?? (isNarrowWeb ? 40 : 48);
        const iconSize = Math.round(btnSize * 0.45);

        return (
            <Pressable
                ref={ref}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
                style={({ pressed }) => [
                    styles.circleBtn,
                    variant === 'primary' ? styles.primary : styles.secondary,
                    { width: btnSize, height: btnSize, borderRadius: btnSize / 2, transform: [{ scale: pressed ? 0.96 : 1 }] },
                    style,
                ]}
            >
                <MaterialIcons name={name} size={iconSize} color={variant === 'primary' ? '#012' : '#0ea5e9'} />
            </Pressable>
        );
    }
);

export default IconButton;

const styles = StyleSheet.create({
    circleBtn: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    primary: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
    secondary: { borderWidth: 1, backgroundColor: 'transparent' },
});
