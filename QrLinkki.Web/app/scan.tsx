import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

import { useToast } from '@/components/ui/Toast';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as api from '@/lib/api';
import { isValidUrl } from './lib/validation';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme ?? 'light'];
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      (async () => {
        try {
          const res = await requestPermission();
          // res.granted pode ser true/false; marcar estado negado quando for false
          setPermissionDenied(!(res && res.granted));
        } catch (e) {
          // tratar como negado em caso de erro
          setPermissionDenied(true);
        }
      })();
    }
  }, [permission]);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || isProcessing) return;
    setScanned(true);
    setIsProcessing(true);

    const originalUrl = data?.trim() ?? '';

    // Validar dados lidos antes de enviar para a API
    if (!isValidUrl(originalUrl)) {
      toast.show('error', 'QR inválido: não é uma URL válida');
      // permitir reiniciar o leitor após uma pequena pausa
      setTimeout(() => setScanned(false), 1200);
      setIsProcessing(false);
      return;
    }

    try {
      await api.createLink({ original_url: originalUrl });
      toast.show('success', 'Link criado a partir do QR');
      router.replace('/dashboard');
    } catch (err: any) {
      toast.show('error', String(err));
      setTimeout(() => setScanned(false), 1500);
    } finally {
      setIsProcessing(false);
    }
  }

  if (!permission) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.authBackground }]}> 
        <ThemedText type="title">Scanner</ThemedText>
        <Text style={{ marginTop: 12, color: '#fff' }}>Carregando...</Text>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    if (permissionDenied) {
      return (
        <ThemedView style={[styles.container, { backgroundColor: theme.authBackground }]}> 
          <ThemedText type="title">Permissão necessária</ThemedText>
          <Text style={{ marginTop: 12, color: '#fff' }}>A permissão da câmera foi negada. Abra as configurações do aplicativo para habilitar a câmera.</Text>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity style={[styles.primaryButtonFull, { backgroundColor: theme.authAccent }]} onPress={() => {
              Linking.openSettings().catch(() => toast.show('error', 'Não foi possível abrir as configurações'));
            }}>
              <Text style={[styles.primaryButtonText, { color: theme.authButtonText }]}>Abrir configurações</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity style={[styles.primaryButtonFull, { backgroundColor: '#444' }]} onPress={() => router.replace('/dashboard')}>
              <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.authBackground }]}> 
        <ThemedText type="title">Scanner</ThemedText>
        <Text style={{ marginTop: 12, color: '#fff' }}>Solicitando permissão de câmera...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.authBackground, flex: 1 }]}> 
      <ThemedText type="title">Leitor de QR</ThemedText>
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        {scanned ? (
          <TouchableOpacity 
            style={[styles.primaryButtonFull, { backgroundColor: theme.authAccent }]} 
            onPress={() => setScanned(false)}
          >
            <Text style={[styles.primaryButtonText, { color: theme.authButtonText }]}>
              {isProcessing ? 'Processando...' : 'Ler novamente'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  scannerContainer: { flex: 1, marginTop: 12, borderRadius: 8, overflow: 'hidden' },
  scanner: { flex: 1, width: '100%' },
  primaryButtonFull: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', width: '100%' },
  primaryButtonText: { fontWeight: '700', color: '#012' },
});
