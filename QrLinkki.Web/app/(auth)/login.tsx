import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as api from '@/lib/api';
import { setTokenStorage, getTokenStorage } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';

// ocultar o cabeçalho nativo da stack para esta tela; o app usa um cabeçalho customizado
export const options = { headerShown: false };

export default function Login() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];
  const searchParams = useLocalSearchParams();
  const hideBack = !!(searchParams?.noBack === '1' || searchParams?.noBack === 'true');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  // validations
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = emailRe.test(email.trim());
  const passwordValid = password.length >= 6;
  const formValid = emailValid && passwordValid;

  useEffect(() => {
    // opcional: focar o campo de email quando a tela montar
    const t = setTimeout(() => emailRef.current?.focus(), 300);
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    return () => clearTimeout(t);
  }, []);

  function focusFirstInvalid() {
    if (!emailValid) return emailRef.current?.focus();
    if (!passwordValid) return passwordRef.current?.focus();
  }

  async function handleLogin() {
    setTouched({ email: true, password: true });
    if (!formValid) {
      focusFirstInvalid();
      return;
    }

    try {
      console.debug('handleLogin:start', { email });
      setLoading(true);
      const token = await api.login(email.trim(), password);
      console.debug('handleLogin:api.login returned', { token });
      if (!token) {
        toast.show('error', 'Credenciais inválidas');
        return;
      }

      await setTokenStorage(token);
      // verify token was persisted
      try {
        const stored = await getTokenStorage();
        console.debug('handleLogin:storage after set', { stored });
      } catch (e) {
        console.debug('handleLogin:storage read failed', e);
      }

      api.setToken(token);
      console.debug('handleLogin:about to navigate to dashboard');
      // navigate directly to dashboard to avoid extra redirects
      try {
        router.replace('/dashboard');
        console.debug('handleLogin:navigate called');
      } catch (e) {
        console.debug('handleLogin:navigate error', e);
      }
    } catch (err: any) {
      console.debug('handleLogin:error', err);
      toast.show('error', err?.message ?? String(err));
    } finally {
      console.debug('handleLogin:finally - clearing loading');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
  {/* cabeçalho omitido intencionalmente aqui (telas de auth usam layout full-bleed) */}

          <Animated.View style={[styles.content, { opacity: fade }]}>
            <MaterialIcons name="qr-code" size={76} color={theme.authAccent} />
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={[styles.subtitle, { color: theme.authSubtitle }]}>Gerencie seus QR Codes e links curtos</Text>

            <TextInput
              ref={emailRef}
              style={[styles.input, { backgroundColor: theme.authCard, borderColor: theme.authBorder }]}
              placeholder="email@example.com"
              placeholderTextColor="#9fb6c8"
              keyboardType="email-address"
              value={email}
              onChangeText={(v) => { setEmail(v); if (!touched.email) setTouched((s) => ({ ...s, email: true })); }}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Email"
              textContentType="username"
            />
            {touched.email && !emailValid ? <Text style={styles.fieldError}>Email inválido</Text> : null}

            <View style={styles.passwordWrap}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput]}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor="#9fb6c8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(v) => { setPassword(v); if (!touched.password) setTouched((s) => ({ ...s, password: true })); }}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Senha"
                textContentType="password"
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eye} accessibilityRole="button">
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#9fb6c8" />
              </TouchableOpacity>
            </View>
            {touched.password && !passwordValid ? <Text style={styles.fieldError}>Senha precisa ter pelo menos 6 caracteres</Text> : null}

            <TouchableOpacity
              style={[styles.button, (!formValid || loading) ? styles.buttonDisabled : null, { backgroundColor: theme.authAccent }]}
              onPress={handleLogin}
              disabled={!formValid || loading}
              accessibilityRole="button"
            >
              {loading ? <ActivityIndicator color="#012" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem conta?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}><Text style={[styles.link, { color: theme.authAccent }]}> Registrar</Text></TouchableOpacity>
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
  // cabeçalho tratado por components/ui/AuthHeader
  input: { width: '100%', borderWidth: 1, borderColor: '#0b2a33', padding: 12, borderRadius: 8, backgroundColor: '#07101a', color: '#fff', marginBottom: 8 },
  passwordWrap: { width: '100%', position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eye: { position: 'absolute', right: 12, top: 12 },
  button: { backgroundColor: '#0ea5e9', width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#012', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  footer: { flexDirection: 'row', marginTop: 12, justifyContent: 'center' },
  footerText: { color: '#9ca3af' },
  link: { color: '#7dd3fc', marginLeft: 6 },
  fieldError: { color: '#fca5a5', alignSelf: 'flex-start', marginBottom: 8 },
});
