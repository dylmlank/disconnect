import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useThemeStore, themes, type ThemeColors } from '../../store/themeStore';
import type { LearningPostWithAuthor, LearningPostType, Skill } from '@disconnect/shared';

// Map the screen's design tokens onto the project's ThemeColors palette.
type ScreenTheme = {
  background: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
};
function toScreenTheme(c: ThemeColors): ScreenTheme {
  return {
    background: c.bg,
    card: c.card,
    border: c.cardBorder,
    text: c.text,
    textSecondary: c.textSecondary,
    primary: c.accent,
  };
}

type PostTypeFilter = LearningPostType | 'all';

const POST_TYPE_LABELS: Record<LearningPostType, { label: string; icon: string; color: string }> = {
  learned: { label: 'Learned', icon: 'lightbulb', color: '#10b981' },
  practicing: { label: 'Practicing', icon: 'fitness', color: '#3b82f6' },
  question: { label: 'Question', icon: 'help-circle', color: '#f59e0b' },
  building: { label: 'Building', icon: 'hammer', color: '#8b5cf6' },
};

export default function LearningFeedScreen() {
  const navigation = useNavigation();
  const mode = useThemeStore((s) => s.mode);
  const theme = toScreenTheme(themes[mode]);
  const [posts, setPosts] = useState<LearningPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (selectedSkillId) params.skillId = selectedSkillId;

      const response = await api.get('/learning/posts', { params });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to fetch learning posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, selectedSkillId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const renderPost = ({ item }: { item: LearningPostWithAuthor }) => (
    <LearningPostCard post={item} theme={theme} />
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Type Filter Tabs */}
      <View style={[styles.filterBar, { borderBottomColor: theme.border }]}>
        <FilterTab
          label="All"
          isSelected={typeFilter === 'all'}
          onPress={() => setTypeFilter('all')}
          theme={theme}
        />
        {(Object.keys(POST_TYPE_LABELS) as LearningPostType[]).map((type) => (
          <FilterTab
            key={type}
            label={POST_TYPE_LABELS[type].label}
            isSelected={typeFilter === type}
            onPress={() => setTypeFilter(type)}
            theme={theme}
            color={POST_TYPE_LABELS[type].color}
          />
        ))}
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No learning posts yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Share something you learned or are working on
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Create Post FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => (navigation as any).navigate('CreateLearningPost')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function FilterTab({
  label,
  isSelected,
  onPress,
  theme,
  color,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  theme: ScreenTheme;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        isSelected && { borderBottomColor: color || theme.primary, borderBottomWidth: 2 },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterTabText,
          { color: isSelected ? color || theme.primary : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function LearningPostCard({ post, theme }: { post: LearningPostWithAuthor; theme: ScreenTheme }) {
  const typeInfo = POST_TYPE_LABELS[post.postType];
  const navigation = useNavigation();

  const handlePress = () => {
    (navigation as any).navigate('LearningPostDetail', { postId: post.id });
  };

  return (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={handlePress}
    >
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {post.author.firstName.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: theme.text }]}>{post.author.firstName}</Text>
            <Text style={[styles.postTime, { color: theme.textSecondary }]}>
              {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon as any} size={14} color={typeInfo.color} />
          <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={[styles.postTitle, { color: theme.text }]}>{post.title}</Text>
      {post.content && (
        <Text style={[styles.postContent, { color: theme.textSecondary }]} numberOfLines={3}>
          {post.content}
        </Text>
      )}

      {/* Skills */}
      {post.skills.length > 0 && (
        <View style={styles.skillsRow}>
          {post.skills.slice(0, 3).map((skill: Skill) => (
            <View key={skill.id} style={[styles.skillChip, { backgroundColor: theme.background }]}>
              <Text style={[styles.skillChipText, { color: theme.textSecondary }]}>
                {skill.name}
              </Text>
            </View>
          ))}
          {post.skills.length > 3 && (
            <Text style={[styles.moreSkills, { color: theme.textSecondary }]}>
              +{post.skills.length - 3}
            </Text>
          )}
        </View>
      )}

      {/* AI Label */}
      {(post.isAiAssisted || (post.aiDetectionScore && post.aiDetectionScore > 0.5)) && (
        <View style={styles.aiLabel}>
          <Ionicons name="logo-reddit" size={14} color="#f59e0b" />
          <Text style={styles.aiLabelText}>
            {post.isAiAssisted ? 'AI-assisted' : 'Possible AI content'}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.postFooter}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {post.reactionSummary.reduce((sum: number, r: { count: number }) => sum + r.count, 0)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>{post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    alignSelf: 'center',
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  aiLabelText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
});
