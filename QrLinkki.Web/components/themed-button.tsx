import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform, PressableProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

type ThemedButtonProps = PressableProps & {
  title: string;
  color?: string; // sobrescreve a cor primária
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'destructive';
};

const ThemedButtonComponent = ({ title, color, loading, variant = 'primary', style, ...rest }: ThemedButtonProps) => {
  const primary = useThemeColor({}, 'authAccent');
  const buttonText = useThemeColor({}, 'authButtonText');
  const borderToken = useThemeColor({}, 'authBorder');

  const bgColor = variant === 'primary' ? (color ?? primary) : 'transparent';
  const textColor = variant === 'primary' ? buttonText : variant === 'destructive' ? '#fff' : buttonText;
  const borderColor = variant === 'outline' ? borderToken : variant === 'destructive' ? '#cc0000' : 'transparent';

  const ripple = Platform.select({ android: { color: 'rgba(255,255,255,0.12)' } });
  const { accessibilityLabel, disabled, onPress, ...pressableRest } = rest as PressableProps;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      android_ripple={ripple}
      onPress={onPress}
      disabled={disabled || loading}
      {...pressableRest}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? { backgroundColor: bgColor } : undefined,
        variant === 'outline' ? { backgroundColor: 'transparent', borderWidth: 1, borderColor } : undefined,
        variant === 'destructive' ? { backgroundColor: '#cc0000' } : undefined,
        disabled ? { opacity: 0.6 } : undefined,
        pressed ? { opacity: 0.85 } : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
};

export const ThemedButton = React.memo(ThemedButtonComponent);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
