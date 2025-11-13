import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useToast } from '@/components/ui/Toast';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as api from '@/lib/api';
import { isValidUrl } from '../../lib/validation';

export default function EditLink() {
  const params = useLocalSearchParams();
  const code = String(params.code ?? '');
  const [originalUrl, setOriginalUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (!code) return;
    load();
  }, [code]);

  async function load() {
    try {
      const data = await api.getLink(code);
      setOriginalUrl(data?.original_url ?? '');
    } catch (err) {
      toast.show('error', String(err));
    }
  }

  async function handleUpdate() {
    const value = originalUrl.trim();
    if (!isValidUrl(value)) {
      setError('Informe uma URL válida (começando com http:// ou https://)');
      toast.show('error', 'URL inválida');
      return;
    }

    try {
      setLoading(true);
      await api.updateLink(code, { original_url: value });
      toast.show('success', 'Atualizado');
      router.replace('/dashboard');
    } catch (err) {
      toast.show('error', String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.authBackground, flex: 1 }] as any}>
      <View style={{ padding: 16 }}>
        <ThemedText type="title">Editar Link</ThemedText>

        <TextInput
          style={[styles.input, { backgroundColor: theme.authCard, borderColor: theme.authBorder, color: '#fff' }]}
          placeholder="https://example.com"
          placeholderTextColor="#9fb6c8"
          value={originalUrl}
          onChangeText={(t) => {
            setOriginalUrl(t);
            if (error) setError('');
          }}
          autoCapitalize="none"
        />

        {error ? <Text style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</Text> : null}

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            style={[styles.primaryButtonFull, { backgroundColor: theme.authAccent, opacity: isValidUrl(originalUrl.trim()) ? 1 : 0.6 }]}
            onPress={handleUpdate}
            disabled={loading || !isValidUrl(originalUrl.trim())}
          >
            <Text style={[styles.primaryButtonText, { color: theme.authButtonText }]}>{loading ? 'Atualizando...' : 'ATUALIZAR'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0 },
  input: { borderWidth: 1, borderRadius: 6, padding: 12, marginTop: 12 },
  primaryButtonFull: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', width: '100%' },
  primaryButtonText: { fontWeight: '700', color: '#012' },
});
