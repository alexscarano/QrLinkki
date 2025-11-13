import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, StatusBar, useWindowDimensions } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Props = {
  onBack?: () => void;
  iconColor?: string;
  textColor?: string;
  showBack?: boolean;
};

export default function AuthHeader({ onBack, iconColor, textColor, showBack = true }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];

  // valores padrão sensatos quando não fornecidos
  const resolvedIconColor = iconColor ?? theme.authAccent;
  const resolvedTextColor = textColor ?? theme.text;

  // Altura visível base do cabeçalho (excluindo o safe-area inset)
  const BASE_HEADER_HEIGHT = 44; // bom para a maioria dos dispositivos

  // No Android, StatusBar.currentHeight pode importar; prefira safe-area insets quando disponíveis
  const insetTop = insets.top ?? (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  // Se estivermos na web desktop, use um layout ligeiramente diferente
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;

  // O container é relativo para não sobrepor o conteúdo da página — mantém o layout simples
  const containerStyle = [
    styles.container,
    isDesktopWeb ? styles.containerDesktop : { paddingTop: insetTop, height: insetTop + BASE_HEADER_HEIGHT },
  ];

  const backRowStyle = [styles.backRow, { top: Math.max(insetTop ? insetTop : 8, 8) }];

  const handleBack =
    onBack ?? (() => {
      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
            window.history.back();
            return;
          }
        } catch (e) {
          // fallthrough
        }
        router.replace('/welcome');
        return;
      }

      router.back();
    });

  return (
    <View style={[containerStyle, { backgroundColor: theme.authBackground }]}> 
  {/* alça superior sutil para polir visualmente */}
      <View style={[styles.handle, { backgroundColor: 'rgba(0,0,0,0.06)' }]} />

      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={backRowStyle}
        >
          <MaterialIcons name="arrow-back" size={24} color={resolvedIconColor} />
          <Text style={[styles.backLabel, { color: resolvedTextColor }]}>Voltar</Text>
        </TouchableOpacity>
      ) : null}

  {/* sem título - apenas controle de voltar por design */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerDesktop: {
    position: 'relative',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    height: 64,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
  },
  backRow: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: { marginLeft: 6, fontSize: 16 },
  /* title removed intentionally */
});
