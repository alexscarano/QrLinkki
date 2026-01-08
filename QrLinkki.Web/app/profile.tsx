
import React, { useEffect, useState, useCallback } from 'react';
import { TextInput, ActivityIndicator, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, View, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getTokenStorage } from '../lib/storage';
import * as api from '../lib/api';
import { useRouter } from 'expo-router';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedButton } from '@/components/themed-button';
import { useToast } from '@/components/ui/Toast';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const authAccent = useThemeColor({}, 'authAccent');
  const authBorder = useThemeColor({}, 'authBorder');
  const authSubtitle = useThemeColor({}, 'authSubtitle');
  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const pageBg = useThemeColor({}, 'authBackground');

  // Sempre carregar usuário de /api/auth/me
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const t = await getTokenStorage();
        setToken(t);
        api.setToken(t);
        const userObj = await api.validateToken();
        console.debug('profile:loaded-user', userObj);
        setUser(userObj);
        setEmail(userObj.email ?? '');
      } catch (err) {
        console.debug('profile:load-error', err);
        toast.show('error', 'Sessão inválida. Faça login novamente.');
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, toast]);

  // Recarregar usuário da API
  const reloadUser = useCallback(async () => {
    setLoading(true);
    try {
      const userObj = await api.validateToken();
      console.debug('profile:reloaded-user', userObj);
      setUser(userObj);
      setEmail(userObj.email ?? '');
    } catch (err) {
      toast.show('error', 'Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const canSave = user && (
    (email && email !== user.email) || (password && password.trim().length > 0)
  );

  const onSave = useCallback(async () => {
    if (!token || !user) {
      toast.show('error', 'Sessão inválida. Faça login novamente.');
      router.replace('/login');
      return;
    }
    setSaving(true);
    try {
      const userId = user.user_id ?? user.id ?? user.UserId;
      if (!userId) throw new Error('ID de usuário não encontrado');
      const body: any = { email };
      if (password && password.trim().length > 0) body.password = password;
      await api.updateUser(userId, body);
      toast.show('success', 'Perfil atualizado.');
      setPassword('');
      await reloadUser();
    } catch (err: any) {
      if (err?.message && (err.message.includes('409') || err.message.toLowerCase().includes('already'))) {
        toast.show('error', 'Este email já está em uso. Escolha outro.');
      } else if (err?.message && err.message.toLowerCase().includes('network')) {
        toast.show('error', 'Não foi possível conectar. Verifique sua internet.');
      } else {
        toast.show('error', 'Falha ao atualizar perfil. Verifique os dados e tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  }, [token, user, email, password, toast, router, reloadUser]);

  const performDelete = useCallback(async () => {
    if (!token || !user) {
      toast.show('error', 'Sessão inválida. Faça login novamente.');
      router.replace('/login');
      return;
    }
    try {
      setLoading(true);
      const userId = user.user_id ?? user.id ?? user.UserId;
      if (!userId) {
        console.debug('performDelete:user-object', user);
        throw new Error('ID de usuário não encontrado');
      }
      await api.deleteUser(userId);
      try {
        const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
        if (isWeb) {
          localStorage.removeItem('qrlinkki_token');
          localStorage.removeItem('user');
        } else {
          await SecureStore.deleteItemAsync('qrlinkki_token');
          await SecureStore.deleteItemAsync('user');
        }
      } catch { }
      toast.show('success', 'Conta excluída');
      router.replace('/welcome');
      // Reforço para web: previne voltar para o dashboard
      if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
        window.location.replace('/welcome');
      }
    } catch (err: any) {
      if (err?.message && err.message.toLowerCase().includes('network')) {
        toast.show('error', 'Não foi possível conectar. Verifique sua internet.');
      } else {
        toast.show('error', 'Falha ao excluir conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, user, router, toast]);

  const onDelete = useCallback(() => {
    if (!token || !user) {
      toast.show('error', 'Sessão inválida. Faça login novamente.');
      router.replace('/login');
      return;
    }
    setConfirmVisible(true);
  }, [token, user, toast, router]);



  if (loading) return <ThemedView style={styles.center}><ActivityIndicator color={tint} /></ThemedView>;
  if (!user) return null;

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={80}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <ThemedView style={[styles.content, { backgroundColor: pageBg, borderColor: authBorder }]}>
              <ThemedView style={[styles.headerRow, { backgroundColor: pageBg }]}>
                <ThemedView style={[styles.avatar, { backgroundColor: authAccent }]}>
                  <MaterialIcons name="person" size={26} color="#fff" />
                </ThemedView>
                <ThemedView style={[styles.headerTextWrap, { backgroundColor: pageBg, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }]}>
                  <ThemedText type="title" style={styles.title}>Minha Conta</ThemedText>
                  <ThemedText type="subtitle" style={styles.subtitle}>Gerencie suas informações e preferências</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedText type="defaultSemiBold" style={styles.label}>Email</ThemedText>
              <TextInput
                accessibilityLabel="Email"
                accessibilityHint="Seu endereço de e-mail"
                style={[styles.input, { borderColor: authBorder, backgroundColor: 'transparent', color: textColor, width: '100%' }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
                placeholderTextColor={authSubtitle}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <ThemedText style={[styles.note, { color: authSubtitle }]}>Deixe a senha em branco para mantê-la.</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.label}>Nova senha</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput
                  accessibilityLabel="Nova senha"
                  accessibilityHint="Digite sua nova senha"
                  style={[styles.input, { borderColor: authBorder, backgroundColor: 'transparent', color: textColor, width: '100%' }]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.inputIcon} accessibilityRole="button" accessibilityLabel={showPassword ? 'Esconder senha' : 'Mostrar senha'}>
                  <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={authSubtitle} />
                </Pressable>
              </View>

              {saving ? (
                <ActivityIndicator color={tint} />
              ) : (
                <ThemedView style={styles.actionsRow}>
                  <ThemedButton
                    title="Salvar"
                    accessibilityLabel="Salvar perfil"
                    onPress={onSave}
                    loading={saving}
                    disabled={!canSave || saving}
                    style={styles.saveBtn}
                    variant="primary"
                  />
                  <ThemedButton
                    title="Excluir conta"
                    accessibilityLabel="Excluir conta"
                    onPress={onDelete}
                    style={styles.deleteBtn}
                    variant="destructive"
                    disabled={!token || loading}
                  />
                </ThemedView>
              )}

              <ThemedView style={{ height: 12 }} />
              <ThemedButton title="Recarregar" accessibilityLabel="Recarregar perfil" onPress={reloadUser} variant="primary" />
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmação"
        message="Deseja realmente excluir sua conta? Essa ação é irreversível."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onCancel={() => {
          console.debug('ConfirmModal:onCancel');
          setConfirmVisible(false);
        }}
        onConfirm={() => {
          console.debug('ConfirmModal:onConfirm');
          setConfirmVisible(false);
          performDelete();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, alignItems: 'center', paddingTop: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  headerTextWrap: { marginLeft: 12, flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13 },
  label: { marginTop: 8, fontWeight: '600' },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 6 },
  note: { fontSize: 12, marginTop: 8 },
  inputWrap: { position: 'relative', width: '100%' },
  inputIcon: { position: 'absolute', right: 10, top: 12, padding: 6 },
  actionsRow: { flexDirection: 'row', marginTop: 18, justifyContent: 'space-between' },
  saveBtn: { flex: 1, marginRight: 8 },
  deleteBtn: { flex: 1 },
  content: { width: '100%', maxWidth: 560, padding: 16, alignSelf: 'center' },
});
