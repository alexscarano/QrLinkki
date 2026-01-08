import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated, Pressable, Modal, useWindowDimensions } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import IconButton from '@/components/ui/IconButton';
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
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowWeb = Platform.OS === 'web' && windowWidth <= 420;

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const accountBtnRef = useRef<any>(null);

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
      <View style={[styles.inner, isNarrowWeb ? { paddingHorizontal: 8 } : undefined]}>
        <View style={styles.leftGroup}>
          <View style={[styles.avatar, { backgroundColor: theme.authAccent, width: isNarrowWeb ? 36 : 44, height: isNarrowWeb ? 36 : 44 }]}> 
            <MaterialIcons name="qr-code" size={isNarrowWeb ? 18 : 22} color={theme.authButtonText} />
          </View>
          <View style={styles.titleCol} pointerEvents="none">
            <Text style={[styles.title, { color: theme.text, fontSize: isNarrowWeb ? 16 : 18 }]}>QrLinkki</Text>
            {!isNarrowWeb ? <Text style={[styles.subtitle, { color: theme.text }]}>Seus links rápidos e QR codes</Text> : null}
          </View>
        </View>

        <View style={styles.actions}>
          <IconButton
            name="add"
            onPress={() => router.push('/links/new')}
            accessibilityLabel="Novo link"
            accessibilityHint="Cria um novo link"
            variant="primary"
            style={{ backgroundColor: theme.authAccent }}
          />

          <IconButton
            name="qr-code-scanner"
            onPress={() => router.push('/scan')}
            accessibilityLabel="Ler QR"
            accessibilityHint="Abre o leitor de QR code"
            variant="secondary"
            style={{ borderColor: theme.authAccent }}
          />

          <IconButton
            ref={accountBtnRef}
            name="person"
            onPress={async () => {
              try {
                if (accountBtnRef.current && accountBtnRef.current.measureInWindow) {
                  accountBtnRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                    setMenuCoords({ x, y, w, h });
                    setMenuVisible((v) => !v);
                    // eslint-disable-next-line no-console
                    console.debug('DashboardHeader: measured account button', { x, y, w, h });
                  });
                } else {
                  setMenuVisible((v) => !v);
                  // eslint-disable-next-line no-console
                  console.debug('DashboardHeader: account button pressed (no measure)');
                }
              } catch (e) {
                setMenuVisible((v) => !v);
              }
            }}
            accessibilityLabel="Conta"
            accessibilityHint="Abre o menu de conta"
            variant="secondary"
            style={{ borderColor: theme.authAccent }}
          />

          {menuVisible ? (
            <Modal transparent animationType="fade" visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
              <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)} />
              <View
                style={[
                  styles.menuFloating,
                  {
                    top: menuCoords ? menuCoords.y + menuCoords.h + 8 : 64,
                    left: menuCoords ? Math.max(8, Math.min(menuCoords.x, windowWidth - 188)) : windowWidth - 188,
                    backgroundColor: theme.authBackground,
                    borderColor: theme.authBorder,
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    try {
                      router.push('/profile');
                    } catch (e) {}
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed, { flexDirection: 'row', alignItems: 'center' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Conta"
                >
                  <MaterialIcons name="person-outline" size={18} color={theme.authAccent} />
                  <Text style={[styles.menuItemText, { color: theme.text, marginLeft: 10 }]}>Conta</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    handleLogout();
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed, { flexDirection: 'row', alignItems: 'center' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Sair"
                >
                  <MaterialIcons name="logout" size={18} color={theme.authAccent} />
                  <Text style={[styles.menuItemText, { color: theme.text, marginLeft: 10 }]}>Sair</Text>
                </Pressable>
              </View>
            </Modal>
          ) : null}
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
  circleBtnNarrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
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
  /* Account menu */
  menu: {
    position: 'absolute',
    minWidth: 140,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  menuInline: {
    minWidth: 140,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  menuDivider: { height: 1, backgroundColor: '#0b2a33', marginVertical: 4 },
  /* Floating overlay + menu */
  overlayFloating: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  menuFloating: {
    position: 'absolute',
    width: 180,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  menuItemPressed: { opacity: 0.7 },
  menuItemText: { fontSize: 14, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
