import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const options = { headerShown: false };

export default function Welcome() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <MaterialIcons name="qr-code" size={96} color={theme.authAccent} />
        <Text style={styles.title}>Bem-vindo ao QrLinkki</Text>
        <Text style={[styles.subtitle, { color: theme.authSubtitle }]}>Gerencie seus QR Codes e links curtos com facilidade.</Text>

        <TouchableOpacity style={[styles.primary, { backgroundColor: theme.authAccent }]} onPress={() => router.push('/login')} accessibilityRole="button">
          <Text style={[styles.primaryText, { color: theme.authButtonText }]}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={() => router.push('/register')} accessibilityRole="button">
          <Text style={[styles.secondaryText, { color: theme.authAccent }]}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05141a' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#9ad1ef', textAlign: 'center', marginVertical: 12 },
  primary: { backgroundColor: '#0ea5e9', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8, marginTop: 12 },
  primaryText: { color: '#012', fontWeight: '700' },
  secondary: { marginTop: 12 },
  secondaryText: { color: '#7dd3fc' },
});
