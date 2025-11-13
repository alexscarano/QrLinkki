import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, KeyboardAvoidingView, ScrollView, View, TextInput, Text, TouchableOpacity, ActivityIndicator, Platform, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

// esconder o cabeçalho padrão da stack para esta tela; usamos um AuthHeader customizado
export const options = { headerShown: false };

export default function Register() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = emailRe.test(email.trim());
  const passwordValid = password.length >= 6;
  const formValid = emailValid && passwordValid;

  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 300);
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    return () => clearTimeout(t);
  }, []);

  function focusFirstInvalid() {
    if (!emailValid) return emailRef.current?.focus();
    if (!passwordValid) return passwordRef.current?.focus();
  }

  async function handleRegister() {
    setTouched({ email: true, password: true });
    if (!formValid) {
      focusFirstInvalid();
      return;
    }

    try {
      setLoading(true);
      await api.register(email.trim(), password);
      toast.show('success', 'Usuário criado. Faça login.');
      router.replace('/login');
    } catch (err: any) {
      toast.show('error', err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">


          <Animated.View style={[styles.content, { opacity: fade }]}>
            <MaterialIcons name="qr-code" size={76} color={theme.authAccent} />
            <Text style={[styles.title, { color: theme.text }]}>Criar conta</Text>
            <Text style={[styles.subtitle, { color: theme.authSubtitle }]}>Crie uma conta para começar a gerar QR Codes</Text>

            <TextInput
              ref={emailRef}
              style={[styles.input, { backgroundColor: theme.authCard, borderColor: theme.authBorder }]}
              placeholder="email@example.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              value={email}
              onChangeText={(v) => { setEmail(v); if (!touched.email) setTouched((s) => ({ ...s, email: true })); }}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Email"
            />
            {touched.email && !emailValid ? <Text style={styles.fieldError}>Email inválido</Text> : null}

            <TextInput
              ref={passwordRef}
              style={[styles.input, { backgroundColor: theme.authCard, borderColor: theme.authBorder }]}
              placeholder="Senha (mín. 6 caracteres)"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); if (!touched.password) setTouched((s) => ({ ...s, password: true })); }}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              accessibilityLabel="Senha"
            />
            {touched.password && !passwordValid ? <Text style={styles.fieldError}>Senha precisa ter pelo menos 6 caracteres</Text> : null}

            <TouchableOpacity style={[styles.button, (!formValid || loading) ? styles.buttonDisabled : null, { backgroundColor: theme.authAccent }]} onPress={handleRegister} disabled={!formValid || loading} accessibilityRole="button">
              {loading ? <ActivityIndicator color={theme.authButtonText} /> : <Text style={[styles.buttonText, { color: theme.authButtonText }]}>Criar conta</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem conta?</Text>
              <TouchableOpacity onPress={() => router.push('/login')}><Text style={[styles.link, { color: theme.authAccent }]}> Entrar</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05141a' },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 22, alignItems: 'center' },
  title: { color: '#fff', fontSize: 28, marginTop: 8, fontWeight: '700' },
  subtitle: { color: '#9ad1ef', marginBottom: 18, textAlign: 'center' },
  // header handled by components/ui/AuthHeader
  input: { width: '100%', borderWidth: 1, borderColor: '#0b2a33', padding: 12, borderRadius: 8, backgroundColor: '#07101a', color: '#fff', marginBottom: 8 },
  button: { backgroundColor: '#0ea5e9', width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#012', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  footer: { flexDirection: 'row', marginTop: 12, justifyContent: 'center' },
  footerText: { color: '#9ca3af' },
  link: { color: '#7dd3fc', marginLeft: 6 },
  fieldError: { color: '#fca5a5', alignSelf: 'flex-start', marginBottom: 8 },
});
