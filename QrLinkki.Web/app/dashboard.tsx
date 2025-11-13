import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View, Linking, ActivityIndicator, TouchableOpacity, Text, TextInput, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { removeTokenStorage } from '@/lib/storage';
import { subscribeRefresh } from '@/lib/refreshBus';
import ConfirmModal from '@/components/ui/ConfirmModal';

export const options = { headerShown: false };

export default function Dashboard() {

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const toast = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmItem, setConfirmItem] = useState<any | null>(null);

  // Subscribe to header-triggered refresh events
  useEffect(() => {
    const unsub = subscribeRefresh(() => {
      // header-triggered refresh should use the pull-to-refresh spinner
      void refresh(false);
    });
    return unsub;
  }, []);

  // Refresh when the screen receives focus (covers returning from create/edit/detail)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function refresh(showLoader = true) {
    if (showLoader) setLoading(true); else setRefreshing(true);
    try {
      const data = await api.getLinks();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      const msg = String(err ?? '');
      // If the token was invalid/expired the backend returns 401. Handle it gracefully
      // by clearing storage/token and redirecting to login so we don't trigger the dev error overlay.
      if (msg.includes('401')) {
        try {
          await removeTokenStorage();
        } catch (e) {
          // ignorar
        }
        api.setToken(null);
        try {
          router.replace('/login');
        } catch (e) {
          // ignorar erros de navegação
        }
        return;
      }

      toast.show('error', msg);
    } finally {
      if (showLoader) setLoading(false); else setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!query) return links;
    const q = query.toLowerCase();
    return links.filter((l) => (l.original_url || '').toLowerCase().includes(q) || (l.shortened_code || '').toLowerCase().includes(q));
  }, [links, query]);

  function formatDate(v: any) {
    try {
      if (!v) return '';
      const d = typeof v === 'string' ? new Date(v) : new Date(v);
      // show date and hour:minute (no seconds)
      return d.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(v);
    }
  }

  async function handleOpen(item: any) {
    try {
      // Preferir abrir o link encurtado (URL pública). Caso não exista, abrir a URL original.
      const url = item.complete_shortened_url ?? item.original_url;
      if (url) {
        await Linking.openURL(url);
      } else {
        toast.show('error', 'URL não encontrada');
      }
    } catch (err) {
      toast.show('error', String(err));
    }
  }

  // logout is now handled by the DashboardHeader; keep removeTokenStorage import for refresh 401 handling

  async function handleCopy(text?: string) {
    try {
      const toCopy = String(text ?? '');
      if (!toCopy) return toast.show('error', 'Nada para copiar');
      if (typeof navigator !== 'undefined' && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
        await (navigator as any).clipboard.writeText(toCopy);
        toast.show('success', 'Copiado para a área de transferência');
      } else {
        toast.show('info', 'Cópia não suportada nesta plataforma');
      }
    } catch (e) {
      toast.show('error', 'Não foi possível copiar');
    }
  }

  async function handleDelete(item: any) {
    const code = item.shortened_code || item.linkId;
    try {
      await api.deleteLink(String(code));
      toast.show('success', 'Deletado');
      // refresh list after delete
      void refresh();
    } catch (err) {
      const msg = String(err ?? '');
      if (msg.startsWith('403')) {
        toast.show('error', 'Acesso negado: você não pode deletar este link');
        return;
      }
      if (msg.startsWith('401')) {
        toast.show('error', 'Autenticação necessária');
        try { router.replace('/login'); } catch (e) { /* ignorar */ }
        return;
      }
      toast.show('error', msg);
    }
  }

  function handleDeleteConfirm(item: any) {
    setConfirmItem(item);
    setConfirmVisible(true);
  }
  return (
    <ThemedView style={[styles.safe, { backgroundColor: theme.authBackground }] as any}>
      <View style={styles.container}>
        <View style={styles.headerRowTop}>
          <View>
            <ThemedText type="title">Meus Links</ThemedText>
            <ThemedText type="default" style={styles.headerSubtitle}>Gerencie seus URLs encurtados e QR codes</ThemedText>
          </View>

          <View style={styles.actionRow}>
            {/* In-page action buttons moved to header for a more compact mobile layout */}
          </View>
        </View>

        <TextInput
          placeholder="Buscar por URL ou código..."
          placeholderTextColor="#9fb6c8"
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: theme.authCard, borderColor: theme.authBorder }]}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText type="title">Você ainda não tem links</ThemedText>
            <ThemedText style={{ marginTop: 8 }} type="default">Crie seu primeiro link clicando em &quot;NOVO&quot;</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.shortened_code ?? String(item.linkId ?? '')}
            renderItem={({ item }) => (
              <Pressable style={[styles.rowCard, Platform.OS === 'web' ? { boxShadow: '0 6px 16px rgba(0,0,0,0.28)' } : styles.rowCardShadow, { backgroundColor: theme.authCard, borderColor: theme.authBorder }]} onPress={() => router.push((`/links/${item.shortened_code || item.linkId}`) as any)}>
                <View style={styles.rowMain}>
                  <ThemedText type="default" style={styles.fieldLabel}>Original</ThemedText>
                  <View style={styles.singleLineRow}>
                    <ThemedText type="defaultSemiBold" style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1} ellipsizeMode="middle">{item.original_url}</ThemedText>
                    <TouchableOpacity onPress={() => handleCopy(item.original_url)} style={styles.copyButton}>
                      <IconSymbol name="doc.on.doc" size={18} color={theme.authAccent} />
                    </TouchableOpacity>
                  </View>
                  <ThemedText type="default" style={[styles.fieldLabel, { marginTop: 8 }]}>Encurtada</ThemedText>
                  <View style={styles.singleLineRow}>
                    <ThemedText type="subtitle" style={[styles.rowSubtitle, { flex: 1 }]} numberOfLines={1} ellipsizeMode="middle">{item.complete_shortened_url}</ThemedText>
                    <TouchableOpacity onPress={() => handleCopy(item.complete_shortened_url)} style={styles.copyButton}>
                      <IconSymbol name="doc.on.doc" size={18} color={theme.authAccent} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.metaRow}>
                        <View style={styles.codeRow}>
                          <View style={[styles.codePill, { borderColor: theme.authAccent, backgroundColor: theme.authAccent }]}> 
                            <Text style={[styles.codePillText, { color: theme.authButtonText }]}>{item.shortened_code}</Text>
                          </View>
                          <ThemedText type="default" style={{ marginLeft: 8, color: '#fff' }}>{formatDate(item.created_at)}</ThemedText>
                        </View>
                  </View>

                  {/* Clicks shown in a compact row below the shortened URL for cleaner UI */}
                  <View style={styles.clickRow}>
                    <View style={[styles.clickPill, { borderColor: theme.authAccent, backgroundColor: theme.authAccent }]}> 
                      <Text style={[styles.clickPillText, { color: theme.authButtonText }]}>{String(item.click ?? 0)}</Text>
                    </View>
                    <ThemedText type="default" style={{ marginLeft: 8, color: '#9ad1ef' }}>Cliques</ThemedText>
                  </View>
                </View>

                  <View style={[styles.rowActionsRight, { marginTop: 16 }]}> 
                    <TouchableOpacity style={[styles.smallButton, { backgroundColor: theme.authAccent }]} onPress={() => handleOpen(item)}>
                      <Text style={[styles.smallButtonText, { color: theme.authButtonText }]}>Abrir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallButtonOutline, { borderColor: theme.authAccent, marginTop: 8 }]} onPress={() => router.push((`/links/${item.shortened_code || item.linkId}`) as any)}>
                      <Text style={[styles.smallButtonOutlineText, { color: theme.authAccent }]}>Detalhes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallButtonOutline, { borderColor: '#ff6b6b', marginTop: 8 }]} onPress={() => handleDeleteConfirm(item)}>
                      <Text style={[styles.smallButtonOutlineText, { color: '#ff6b6b' }]}>Deletar</Text>
                    </TouchableOpacity>
                  </View>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshing={refreshing}
            onRefresh={() => { void refresh(false); }}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar exclusão"
        message="Tem certeza que deseja deletar este link? Esta ação não pode ser desfeita."
        confirmLabel="Deletar"
        cancelLabel="Cancelar"
        onCancel={() => { setConfirmVisible(false); setConfirmItem(null); }}
        onConfirm={() => { setConfirmVisible(false); if (confirmItem) void handleDelete(confirmItem); setConfirmItem(null); }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // match auth screens (login/register/welcome) theme
  safe: { flex: 1, backgroundColor: '#05141a' },
  container: { flex: 1, padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' },
  headerSubtitle: { marginTop: 4, color: '#9ad1ef' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  search: { width: '100%', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, color: '#fff' },
  primaryButton: { backgroundColor: '#0ea5e9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  primaryButtonText: { color: '#012', fontWeight: '700' },
  ghostButton: { backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8, borderWidth: 1, borderColor: '#0ea5e9' },
  ghostButtonText: { color: '#0ea5e9', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#0b2a33', backgroundColor: '#07101a' },
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: '#07101a' },
  rowCardShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  rowMain: { flex: 1, paddingRight: 12 },
  // make original and shortened URL text the same size for visual parity
  rowTitle: { fontSize: 16 },
  rowSubtitle: { fontSize: 16, marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  rowActionsRight: { flexDirection: 'column', alignItems: 'flex-end' },
  rowActions: { flexDirection: 'row', marginTop: 8 },
  smallButton: { backgroundColor: '#0ea5e9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  smallButtonText: { color: '#012', fontWeight: '700' },
  smallButtonOutline: { borderColor: '#0ea5e9', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  smallButtonOutlineText: { color: '#0ea5e9', fontWeight: '700' },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: '#022' },
  codePillText: { fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, fontWeight: '700' },
  clickRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  clickPill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: '#022' },
  clickPillText: { fontWeight: '700' },
  fieldLabel: { fontSize: 12, color: '#9ad1ef', marginBottom: 4 },
  noWrapWeb: { /* placeholder for web-only no-wrap - applied via inline style as needed */ },
  singleLineRow: { flexDirection: 'row', alignItems: 'center' },
  copyButton: { paddingHorizontal: 8, paddingVertical: 6 },
  copyText: { fontSize: 16 },
});
