import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated, Pressable } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { removeTokenStorage } from '@/lib/storage';
import * as api from '@/lib/api';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function DashboardHeader() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const toast = useToast();

  async function doLogout() {
    try {
      await removeTokenStorage();
    } catch (e) {
      // ignorar
    }
    api.setToken(null);
    try {
      // Após logout explícito, enviar o usuário de volta para a tela pública Welcome
      // para que o app volte ao ponto de entrada não autenticado em todas as plataformas.
      router.replace('/welcome');
    } catch (e) {
      // ignorar
    }
    // mostrar um toast no app após logout bem-sucedido
    try {
      toast.show('info', 'Desconectado');
    } catch (e) {
      // ignorar
    }
  }
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Espaçamento extra superior para separar visualmente o cabeçalho da barra
  // de status/área de notificações do Android. Valores maiores fazem o
  // cabeçalho ficar mais baixo e alinham verticalmente ícones e título.
  // Use padrões sensíveis à plataforma.
  const extraTop = Platform.OS === 'android' ? 20 : 10;
  const minH = Platform.OS === 'android' ? 84 : 72;

  function handleLogout() {
    // mostrar modal de confirmação dentro do app (mesmo comportamento na web e nativo)
    setConfirmVisible(true);
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.authBackground,
          paddingTop: (insets.top ?? 0) + extraTop,
          paddingBottom: 10,
          minHeight: minH,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.leftGroup}>
          {/* Mostrar ícone de QR no avatar */}
          <View style={[styles.avatar, { backgroundColor: theme.authAccent }]}> 
            <MaterialIcons name="qr-code" size={22} color={theme.authButtonText} />
          </View>
          <View style={styles.titleCol} pointerEvents="none">
            <Text style={[styles.title, { color: theme.text }]}>QrLinkki</Text>
            <Text style={[styles.subtitle, { color: theme.text }]}>Seus links rápidos e QR codes</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* Botões circulares apenas com ícone para UI/UX compacta */}
          <Pressable
            onPress={() => router.push('/links/new')}
            style={({ pressed }) => [
              styles.circleBtn,
              styles.circleBtnPrimary,
              { backgroundColor: theme.authAccent, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Novo link"
            accessibilityHint="Cria um novo link"
            hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
          >
            <MaterialIcons name="add" size={22} color={theme.authButtonText} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [
              styles.circleBtn,
              styles.circleBtnSecondary,
              { borderColor: theme.authAccent, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ler QR"
            accessibilityHint="Abre o leitor de QR code"
            hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
          >
            <MaterialIcons name="qr-code-scanner" size={22} color={theme.authAccent} />
          </Pressable>

          {/* Atualizar (movido da página para o cabeçalho) */}
          {/* apenas os botões adicionar / scan / sair permanecem no cabeçalho */}

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.circleBtn,
              styles.circleBtnSecondary,
              { borderColor: theme.authAccent, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sair"
            accessibilityHint="Faz logout da sua conta"
            hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
          >
            <MaterialIcons name="logout" size={22} color={theme.authAccent} />
          </Pressable>
        </View>
      </View>
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmação"
        message="Tem certeza que deseja sair?"
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          void doLogout();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  left: { position: 'absolute', left: 12, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  right: { position: 'absolute', right: 12, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { position: 'absolute', left: 0, right: 0, top: 15, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  iconBtn: { marginLeft: 12, padding: 8, borderRadius: 8 },
  inner: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  titleCol: { marginLeft: 10 },
  subtitle: { fontSize: 12, marginTop: 2, opacity: 0.85 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { marginLeft: 10, padding: 8, borderRadius: 10, backgroundColor: 'transparent' },
  logoutBtn: { marginLeft: 8 },
  /* New styled buttons */
  primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, marginLeft: 6 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, backgroundColor: 'transparent', marginLeft: 6 },
  iconOnlyBtn: { marginLeft: 10, padding: 8, borderRadius: 10, backgroundColor: 'transparent' },
  btnText: { marginLeft: 8, fontWeight: '700', fontSize: 14 },
  btnTextSecondary: { marginLeft: 8, fontWeight: '600', fontSize: 14 },
  /* Circular icon button styles */
  circleBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  circleBtnPrimary: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  circleBtnSecondary: { borderWidth: 1, backgroundColor: 'transparent' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '88%', maxWidth: 420, padding: 16, borderRadius: 12, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  modalMessage: { fontSize: 14, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  modalCancel: { backgroundColor: 'transparent' },
  modalConfirm: {},
  modalCancelText: { color: '#9ca3af' },
  modalConfirmText: { fontWeight: '700' },
});
