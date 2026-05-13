import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet, Modal, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const REASONS = [
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'spam', label: 'Spam or scam' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'safety', label: 'Safety concern' },
  { id: 'other', label: 'Other' },
];

interface Props {
  targetType: 'user' | 'event' | 'beacon' | 'chat_message';
  targetId: string;
  reportedUserId?: string;
}

export default function ReportButton({ targetType, targetId, reportedUserId }: Props) {
  const [showModal, setShowModal] = useState(false);

  const handleReport = async (reason: string) => {
    setShowModal(false);
    try {
      await api.post('/reports', { targetType, targetId, reportedUserId, reason });
      Alert.alert('Reported', 'Thanks for helping keep Disconnect safe. We will review this.');
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setShowModal(true)}>
        <Ionicons name="flag-outline" size={16} color="#f87171" />
        <Text style={styles.text}>Report</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Report</Text>
            <Text style={styles.modalSubtitle}>Why are you reporting this?</Text>
            {REASONS.map((r) => (
              <TouchableOpacity key={r.id} style={styles.option} onPress={() => handleReport(r.id)}>
                <Text style={styles.optionText}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  text: { fontSize: 13, color: '#f87171' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  option: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#262626' },
  optionText: { fontSize: 15, color: '#fff' },
  cancelButton: { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
});
