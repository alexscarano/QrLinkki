import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title = 'Confirmação',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {message ? <Text style={styles.modalMessage}>{message}</Text> : null}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onCancel} style={[styles.modalBtn, styles.modalCancel]}>
              <Text style={styles.modalCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.modalBtn, styles.modalConfirm]}>
              <Text style={[styles.modalConfirmText]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { width: '88%', maxWidth: 420, padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: '#052029' },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, color: '#fff' },
  modalMessage: { fontSize: 14, marginBottom: 12, color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  modalCancel: { backgroundColor: 'transparent' },
  modalConfirm: { backgroundColor: '#0ea5e9' },
  modalCancelText: { color: '#9ca3af' },
  modalConfirmText: { fontWeight: '700', color: '#012' },
});
