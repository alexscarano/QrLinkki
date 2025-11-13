import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '@/components/ui/Toast';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as api from '@/lib/api';
import { isValidUrl } from '../lib/validation';

export default function NewLink() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];

  async function handleCreate() {
    const value = originalUrl.trim();
    if (!isValidUrl(value)) {
      setError('Informe uma URL válida (começando com http:// ou https://)');
      toast.show('error', 'URL inválida');
      return;
    }

    try {
      await api.createLink({ original_url: value });
      toast.show('success', 'Link criado');
      router.replace('/dashboard');
    } catch (err) {
      toast.show('error', String(err));
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.authBackground, flex: 1 }]}>
      <ThemedText type="title">Novo Link</ThemedText>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.authCard, borderColor: error ? '#ff6b6b' : theme.authBorder, color: '#fff' },
        ]}
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
          onPress={handleCreate}
          disabled={!isValidUrl(originalUrl.trim())}
        >
          <Text style={[styles.primaryButtonText, { color: theme.authButtonText }]}>CRIAR</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 12 },
  primaryButtonFull: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', width: '100%' },
  primaryButtonText: { fontWeight: '700', color: '#012' },
});
