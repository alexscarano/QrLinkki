import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';

import { getTokenStorage, removeTokenStorage } from '@/lib/storage';
import * as api from '@/lib/api';

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'function') return null; // não é possível decodificar de forma segura
    const json = atob(b64);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token: string | null) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false; // sem exp -> assumir válido
  const expMs = payload.exp * 1000;
  return Date.now() >= expMs;
}

export default function AuthLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getTokenStorage();
        if (token && !isTokenExpired(token)) {
          // se o usuário já estiver logado, define o token e redireciona para a raiz do app
          api.setToken(token);
          if (mounted) router.replace('/');
          return;
        }

        // token expirado ou ausente -> garantir que o estado esteja limpo
        if (token && isTokenExpired(token)) {
          await removeTokenStorage();
          api.setToken(null);
        }
      } catch (e) {
        // ignorar e deixar o usuário ver as telas de autenticação
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <View style={styles.center} pointerEvents="none">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

// Garantir que a stack de navegação não mostre o cabeçalho padrão para o grupo de auth
export const options = { headerShown: false };

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

