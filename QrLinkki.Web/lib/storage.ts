import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'qrlinkki_token';
const DEV_API_KEY = 'qrlinkki_dev_api';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export async function setTokenStorage(token: string | null) {
  if (isWeb) {
    try {
      if (token === null) {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        localStorage.setItem(TOKEN_KEY, token);
      }
      return;
      } catch (e) {
        // prossegue para AsyncStorage como fallback
      }
  }

  try {
    if (token === null) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (e) {
    // fallback para AsyncStorage
    if (token === null) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  }
}

export async function getTokenStorage(): Promise<string | null> {
  if (isWeb) {
    try {
      const v = localStorage.getItem(TOKEN_KEY);
      return v;
    } catch (e) {
      // prosseguir (tentar storages nativos em seguida)
    }
  }

  try {
    const v = await SecureStore.getItemAsync(TOKEN_KEY);
    if (v) return v;
  } catch (e) {
    // ignorar
  }

  try {
    const v = await AsyncStorage.getItem(TOKEN_KEY);
    return v;
  } catch (e) {
    return null;
  }
}

export async function removeTokenStorage() {
  await setTokenStorage(null);
}

// Helpers para URL da API em desenvolvimento (usados para persistir um host API customizado durante dev)
export async function setDevApiUrl(url: string | null) {
  if (isWeb) {
    try {
      if (url === null) {
        localStorage.removeItem(DEV_API_KEY);
      } else {
        localStorage.setItem(DEV_API_KEY, url);
      }
      return;
    } catch (e) {
      // prossegue para os storages nativos como fallback
    }
  }

  try {
    if (url === null) {
      await SecureStore.deleteItemAsync(DEV_API_KEY);
    } else {
      await SecureStore.setItemAsync(DEV_API_KEY, url);
    }
  } catch (e) {
    // fallback para AsyncStorage
    if (url === null) {
      await AsyncStorage.removeItem(DEV_API_KEY);
    } else {
      await AsyncStorage.setItem(DEV_API_KEY, url);
    }
  }
}

export async function getDevApiUrl(): Promise<string | null> {
  if (isWeb) {
    try {
      const v = localStorage.getItem(DEV_API_KEY);
      if (v) return v;
    } catch (e) {
      // prosseguir em caso de erro
    }
  }

  try {
    const v = await SecureStore.getItemAsync(DEV_API_KEY);
    if (v) return v;
  } catch (e) {
    // ignorar
  }

  try {
    const v = await AsyncStorage.getItem(DEV_API_KEY);
    return v;
  } catch (e) {
    return null;
  }
}
