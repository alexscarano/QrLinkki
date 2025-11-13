import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, Text, Platform, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as api from '@/lib/api';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function LinkDetail() {
  const params = useLocalSearchParams();
  const code = String(params.code ?? '');
  const [link, setLink] = useState<any | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!code) return;
    load();
  }, [code]);

  async function load() {
    try {
      const data = await api.getLink(code);
      setLink(data);
    } catch (err) {
      console.error(err);
      const msg = String(err ?? '');
      if (msg.startsWith('403')) {
        toast.show('error', 'Acesso negado: você não é o proprietário deste link');
        router.replace('/dashboard');
        return;
      }

      if (msg.startsWith('401')) {
        toast.show('error', 'Autenticação necessária');
        router.replace('/login');
        return;
      }

      toast.show('error', String(err));
    }
  }

  async function handleDelete() {
    try {
      await api.deleteLink(code);
      toast.show('success', 'Deletado');
      router.replace('/dashboard');
    } catch (err) {
      const msg = String(err ?? '');
      if (msg.startsWith('403')) {
        toast.show('error', 'Acesso negado: você não pode deletar este link');
        return;
      }

      if (msg.startsWith('401')) {
        toast.show('error', 'Autenticação necessária');
        router.replace('/login');
        return;
      }

      toast.show('error', String(err));
    }
  }

  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleDeleteConfirm() {
    setConfirmVisible(true);
  }

  async function doDelete() {
    setConfirmVisible(false);
    try {
      await api.deleteLink(code);
      toast.show('success', 'Deletado');
      router.replace('/dashboard');
    } catch (err) {
      const msg = String(err ?? '');
      if (msg.startsWith('403')) {
        toast.show('error', 'Acesso negado: você não pode deletar este link');
        return;
      }

      if (msg.startsWith('401')) {
        toast.show('error', 'Autenticação necessária');
        router.replace('/login');
        return;
      }

      toast.show('error', String(err));
    }
  }

  async function handleOpenPublic() {
    try {
      // Preferir abrir a URL encurtada pública quando disponível
      const url = link?.complete_shortened_url ?? link?.original_url;
      if (url) await Linking.openURL(url);
      else toast.show('error', 'URL não encontrada');
    } catch (err) {
      toast.show('error', String(err));
    }
  }

  async function handleCopy() {
    try {
      const toCopy = link?.complete_shortened_url ?? link?.original_url ?? '';
      if (!toCopy) return toast.show('error', 'Nada para copiar');
      if (typeof navigator !== 'undefined' && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
        await (navigator as any).clipboard.writeText(toCopy);
        toast.show('success', 'Copiado para a área de transferência');
      } else {
        // clipboard API not available (likely native). Inform the user.
        toast.show('error', 'Clipboard não disponível nesta plataforma');
      }
    } catch (e) {
      toast.show('error', 'Não foi possível copiar');
    }
  }

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView style={{ backgroundColor: theme.authBackground }} contentContainerStyle={{ padding: 16 }}>

      {/* use plain View to avoid injecting themed background blocks */}
      <View style={{ backgroundColor: 'transparent' }}>
        <ThemedText type="title">Detalhes</ThemedText>

  {/* removed dark band under title for cleaner look */}

        {link ? (
          <View style={{ marginTop: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.codePill, { borderColor: theme.authAccent, backgroundColor: theme.authAccent }]}> 
              <Text style={[styles.codePillText, { color: theme.authButtonText }]}>{link.shortened_code ?? code}</Text>
            </View>
          </View>
        ) : null}

        {link ? (
          <View style={[styles.box]}>
            <ThemedText type="defaultSemiBold" style={styles.originalUrl}>{link.original_url}</ThemedText>
            <ThemedText type="subtitle" style={[styles.shortUrl, { marginTop: 8 }]}>{link.complete_shortened_url}</ThemedText>
            <ThemedText type="subtitle" style={{ marginTop: 8, marginBottom: 8 }}>Clicks: {link.click}</ThemedText>

            {link.qr_base64 ? (
              <View style={styles.qrWrap}>
                <Image
                  source={{ uri: `data:image/png;base64,${link.qr_base64}` }}
                  // responsive size based on viewport
                  style={[styles.qrImage, { width: Math.min(320, Math.round(Dimensions.get('window').width * 0.72)), height: Math.min(320, Math.round(Dimensions.get('window').width * 0.72)) }]}
                />
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.authAccent, flex: 1 }]} onPress={handleOpenPublic}>
                <Text style={[styles.primaryButtonText, { color: theme.authButtonText }]}>ABRIR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.authAccent, marginLeft: 10 }]} onPress={handleCopy}>
                <Text style={[styles.secondaryButtonText, { color: theme.authAccent }]}>COPIAR</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <TouchableOpacity style={[styles.primaryButtonFull, { backgroundColor: theme.authAccent }]} onPress={() => router.push(`/links/${code}/edit` as any)}>
                  <Text style={[styles.primaryButtonText, { color: theme.authButtonText }]}>EDITAR</Text>
                </TouchableOpacity>
            </View>
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity style={[styles.ghostButtonFull, { borderColor: theme.authAccent }]} onPress={handleDeleteConfirm}>
                  <Text style={[styles.ghostButtonText, { color: theme.authAccent }]}>DELETAR</Text>
                </TouchableOpacity>
              </View>
              <ConfirmModal
                visible={confirmVisible}
                title="Confirmação"
                message="Tem certeza que deseja deletar este link?"
                confirmLabel="Deletar"
                cancelLabel="Cancelar"
                onCancel={() => setConfirmVisible(false)}
                onConfirm={() => { void doDelete(); }}
              />
          </View>
        ) : (
          <ThemedText>Carregando...</ThemedText>
        )}
      </View>
    </ScrollView>
  );
}

// Garantir que a barra nativa/cabeçalho seja exibida quando esta rota for renderizada diretamente
export const options = {
  headerShown: true,
  title: 'Detalhes',
};

const styles = StyleSheet.create({
  box: { marginTop: 12 },
  codePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  codePillText: { fontWeight: '700', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined },
  originalUrl: { fontSize: 14 },
  shortUrl: { fontSize: 18, fontWeight: '700' },
  qrWrap: { alignSelf: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 12 },
  qrImage: { width: 200, height: 200 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { fontWeight: '700' },
  primaryButtonFull: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', width: '100%' },
  ghostButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  ghostButtonText: { fontWeight: '700' },
  ghostButtonFull: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', width: '100%', borderWidth: 1 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '700' },
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
