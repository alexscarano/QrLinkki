import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getTokenStorage } from '@/lib/storage';

export default function HomeRedirect() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getTokenStorage();
        if (token) {
          // user is authenticated -> go to dashboard
          router.replace('/dashboard');
        } else {
          // not authenticated -> go to login
          router.replace('/login');
        }
      } catch (e) {
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
