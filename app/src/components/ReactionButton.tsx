import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import api from '../services/api';
import type { ReactionTargetType } from '@disconnect/shared';

const REACTION_EMOJIS = ['🔥', '👏', '💪', '❤️'];

interface Props {
  targetType: ReactionTargetType;
  targetId: string;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
  onReacted?: () => void;
}

export default function ReactionButton({ targetType, targetId, reactions = [], onReacted }: Props) {
  const handleReact = async (emoji: string) => {
    try {
      await api.post('/reactions', { targetType, targetId, emoji });
      onReacted?.();
    } catch {
      // ignore
    }
  };

  if (reactions.length > 0) {
    return (
      <View style={styles.row}>
        {reactions.map((r) => (
          <View key={r.emoji} style={[styles.badge, r.userReacted && styles.badgeActive]}>
            <Text style={styles.badgeText}>{r.emoji} {r.count}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => handleReact('🔥')}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {REACTION_EMOJIS.map((emoji) => (
        <TouchableOpacity key={emoji} style={styles.emojiButton} onPress={() => handleReact(emoji)}>
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  badge: { backgroundColor: '#262626', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeActive: { backgroundColor: '#1a3a1a', borderWidth: 1, borderColor: '#4ade80' },
  badgeText: { fontSize: 12, color: '#ccc' },
  addButton: { backgroundColor: '#262626', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  addText: { fontSize: 14, color: '#888' },
  emojiButton: { padding: 4 },
  emoji: { fontSize: 16 },
});
