import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform, TouchableOpacity, Text, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getTokenStorage, removeTokenStorage, getDevApiUrl } from '@/lib/storage';
import * as api from '@/lib/api';
import { isAuthenticated } from '../lib/auth';
import { useRouter } from 'expo-router';
import { ToastProvider, toast } from '@/components/ui/Toast';
import AuthHeader from '@/components/ui/AuthHeader';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { useSegments } from 'expo-router';
import Constants from 'expo-constants';
import { logger } from '@/lib/logger';

export const unstable_settings = {
  // Mantemos a âncora no nível raiz para que o roteador respeite a URL atual
  // em recarregamentos completos. Redirecionamentos para autenticado/não
  // autenticado são tratados pelos próprios layouts/páginas depois que os
  // dados iniciais (token) forem restaurados.
  anchor: '/',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [restored, setRestored] = useState(false);
  const [showSplashOverlay, setShowSplashOverlay] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const segments = useSegments();

  // Função auxiliar que o botão 'voltar' do cabeçalho usa na web para decidir
  // entre navegar para trás no histórico ou redirecionar para uma rota segura
  // quando não há histórico (ex.: após recarregar a página).
  const headerBack = () => {
    if (Platform.OS === 'web') {
      try {
        // Preferimos usar a API de histórico do navegador na web para evitar
        // despachar uma ação GO_BACK que pode não ser tratada pelo
        // react-navigation (e gerar warnings em desenvolvimento).
        if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
          window.history.back();
          return;
        }
      } catch (e) {
        // ignorar e prosseguir para o replace
      }
      router.replace('/welcome');
      return;
    }

    // Em plataformas nativas: usar o comportamento padrão de voltar
    router.back();
  };

  useEffect(() => {
    // Evita que o splash nativo seja ocultado automaticamente; controlamos
    // manualmente quando a tela deve desaparecer para garantir uma transição
    // estável entre o splash nativo e a UI do app.
    (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        // ignorar se não disponível ou já prevenido
      }
    })();

    // Restaurar token do armazenamento seguro / AsyncStorage ao iniciar o app
    (async () => {
      try {
        // Permitir configurar a URL da API em tempo de execução (defina
        // globalThis.__API_URL__ antes do carregamento, se necessário)
        let runtimeUrl = (globalThis as any).__API_URL__ ?? (Constants?.expoConfig as any)?.extra?.apiUrl;

        // Se não houver URL de runtime explícita, prefira uma URL de API
        // de desenvolvimento persistida (assim você pode configurar o host
        // sem editar o código). getDevApiUrl verificará localStorage /
        // SecureStore / AsyncStorage conforme a plataforma.
        if (!runtimeUrl) {
          try {
            const persisted = await getDevApiUrl();
            if (persisted) runtimeUrl = persisted;
          } catch (e) {
            // ignorar
          }
        }

        // Não usar fallbacks hardcoded. Se runtimeUrl for definido, aplica-o.
        if (runtimeUrl) {
          try {
            (globalThis as any).__API_URL__ = runtimeUrl;
          } catch (e) {
            // ignorar
          }
          api.setBaseUrl(runtimeUrl);
        }

        const token = await getTokenStorage();
        if (token) {
          api.setToken(token);
          // validação rápida do token no servidor; se inválido, limpa e redireciona
          try {
            const currentUser = await isAuthenticated();
            if (!currentUser) {
              await removeTokenStorage();
              api.setToken(null);
              try { router.replace('/login'); } catch { }
            }
          } catch (e) {
            // ignora erros de validação
          }
        }

        // Registra um handler global para respostas não autorizadas (401).
        // Ele limpa o token, registra contexto para diagnóstico e redireciona
        // para login. Protegemos para que chamadas repetidas não disparem
        // navegações em loop (cooldown de 3s) e suprimimos o toast quando
        // já estivermos na tela de login.
        let handlingUnauthorized = false;
        let lastUnauthorizedToast = 0;
        api.registerUnauthorizedHandler(async (info) => {
          logger.debug('unauthorizedHandler: invoked', info);
          if (handlingUnauthorized) {
            logger.debug('unauthorizedHandler: already handling, skipping');
            return;
          }
          handlingUnauthorized = true;
          try {
            logger.debug('unauthorizedHandler: clearing token and redirecting to /login');
            // Registra a requisição de origem (se fornecida) para ajudar a identificar qual
            // endpoint disparou o 401.
            try { logger.debug('unauthorizedHandler: request-info', info); } catch { }
            await removeTokenStorage();
          } catch (e) {
            // ignorar
          }
          api.setToken(null);
          try {
            // Decidir se mostramos um toast: não mostrar se já estivermos
            // na rota /login. Para web, usar window.location; para nativo,
            // usar os segmentos do router.
            const now = Date.now();
            const onLoginRoute = (typeof window !== 'undefined' && window.location.pathname?.includes('/login')) || (segments ?? []).includes('login');
            if (!onLoginRoute && now - lastUnauthorizedToast > 5000) {
              try { toast.show('error', 'Sessão inválida. Faça login novamente.'); } catch (err) { 
                logger.warn('toast.show failed', { error: err });
              }
              lastUnauthorizedToast = now;
            }
            try { router.replace('/login'); } catch (e) { /* ignorar erros de navegação */ }
          } catch (e) {
            // ignorar erros de navegação
          }
          // permite que o próximo tratamento ocorra após um pequeno cooldown
          setTimeout(() => (handlingUnauthorized = false), 3000);
        });
      } catch (e) {
        // ignorar erros
      } finally {
        // marcar como restaurado para que o roteamento/children possam renderizar com segurança
        setRestored(true);
      }
    })();
  }, []);

  // Quando a restauração inicial terminar, mostramos uma pequena animação
  // em JS sobre o splash nativo e então o ocultamos de forma controlada.
  useEffect(() => {
    if (!restored) return;
    let mounted = true;
    (async () => {
      try {
        setShowSplashOverlay(true);
        // breve atraso para garantir que a sobreposição JS seja montada
        await new Promise((r) => setTimeout(r, 80));
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start(async () => {
          // pequena pausa para que a animação seja perceptível, sem bloquear
          // a experiência do usuário.
          await new Promise((r) => setTimeout(r, 800));
          try {
            await SplashScreen.hideAsync();
          } catch (e) {
            // ignorar
          }
          // Depois de ocultar o splash nativo, marcamos o fluxo como concluído
          // e removemos a sobreposição JS.
          if (mounted) {
            setShowSplashOverlay(false);
            setSplashFinished(true);
          }
        });
      } catch (e) {
        try { await SplashScreen.hideAsync(); } catch (err) { }
        if (mounted) {
          setShowSplashOverlay(false);
          setSplashFinished(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, [restored]);

  if (!restored) {
    return (
      <View style={styles.center} pointerEvents="none">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const theme = Colors[colorScheme ?? 'light'];
  // ocultar cabeçalho customizado quando a rota incluir a tela de welcome (conta grupos aninhados (auth))
  const segs = (segments ?? []) as string[];
  const showHeader = !segs.includes('welcome');
  // UX: remover o botão de voltar no dashboard (não deve voltar para o login)
  const hideBackOnDashboard = segs.includes('dashboard');
  const isDashboard = hideBackOnDashboard;
  const showBack = !hideBackOnDashboard;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        {/* Sobreposição do splash: mostra ícone animado sobre o fundo do splash nativo */}
        {showSplashOverlay && (
          <Animated.View style={[StyleSheet.absoluteFill, styles.splashOverlay, { opacity, backgroundColor: theme.authBackground }]}>
            <View style={styles.center} pointerEvents="none">
              <Animated.View style={[{ transform: [{ scale }] }, styles.logoWrapper]}>
                <View style={styles.logoCircle}>
                  <MaterialIcons name="qr-code" size={92} color="#0ea5e9" />
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {/* Enquanto o splash não tiver terminado, renderizamos um placeholder
              full-screen com o mesmo background da tela de boas-vindas para
              evitar que a tela 'welcome' apareça por trás da sobreposição. */}
        {!splashFinished ? (
          <View style={{ flex: 1, backgroundColor: theme.authBackground }} />
        ) : (
          <>
            {/* Cabeçalho global customizado (substitui o cabeçalho nativo da stack). */}
            {showHeader ? (isDashboard ? <DashboardHeader /> : <AuthHeader showBack={showBack} />) : null}
            <Stack
              // Na web, definir uma rota inicial quando não houver histórico de
              // navegação para que o cabeçalho/botão voltar esteja disponível
              // de forma consistente após recarregamentos completos.
              initialRouteName={Platform.OS === 'web' ? 'welcome' : undefined}
              screenOptions={{
                // Desabilitar completamente o cabeçalho nativo: usaremos nosso cabeçalho customizado.
                headerShown: false,
              }}
            >
              {/* Ocultar cabeçalho para o grupo de auth e para o grupo de tabs */}
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              {/* Ocultar explicitamente o cabeçalho da rota dashboard para garantir layout full-bleed */}
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </>
        )}
        <StatusBar style="auto" />
      </ToastProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashOverlay: { backgroundColor: 'transparent', zIndex: 9999 },
  logoWrapper: { alignItems: 'center', justifyContent: 'center' },
  logoCircle: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 999,
    // sombra sutil para Android/iOS
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12 },
      default: { elevation: 6 },
    }),
  },
});
