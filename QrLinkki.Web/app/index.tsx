import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getTokenStorage } from '@/lib/storage';
import * as api from '@/lib/api';

export default function Index() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const token = await getTokenStorage();
                if (token) {
                    api.setToken(token);
                    // Usuário autenticado vai para o dashboard
                    if (mounted) router.replace('/dashboard');
                } else {
                    // Usuário não autenticado vai para a tela de boas-vindas
                    if (mounted) router.replace('/welcome');
                }
            } catch (e) {
                // Fallback em caso de erro
                if (mounted) router.replace('/welcome');
            } finally {
                if (mounted) setChecking(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // Mostra um indicador de carregamento enquanto decide a rota
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#05141a' }}>
            <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
    );
}
