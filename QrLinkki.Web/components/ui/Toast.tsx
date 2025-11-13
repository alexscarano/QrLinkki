import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ToastType = 'info' | 'success' | 'error';

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  show: (type: ToastType, message: string, ttl?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(1);

  const show = useCallback((type: ToastType, message: string, ttl = 3000) => {
    const id = counter.current++;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
  {children}
  {/* Renderizar sobreposição de toasts */}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function Toast({ type, message }: { type: ToastType; message: string }) {
  const translate = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.spring(translate, { toValue: 0, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(translate, { toValue: -40, duration: 200, useNativeDriver: true }).start();
    }, 3000);
    return () => clearTimeout(t);
  }, [translate]);

  const backgroundColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#0ea5e9';

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY: translate }], backgroundColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 32,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  text: { color: '#fff' },
});

export default Toast;
