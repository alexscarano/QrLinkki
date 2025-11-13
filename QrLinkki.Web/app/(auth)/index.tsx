import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Redireciona o índice do grupo de auth para a tela de boas-vindas
export default function AuthIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/welcome');
  }, [router]);

  return null;
}
