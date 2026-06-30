import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useThemeStore, themes, type ThemeColors } from '../../store/themeStore';
import type {
  LearningPostDetail,
  LearningPostComment,
  ReactionSummary,
  LearningPostType,
} from '@disconnect/shared';

type RootStackParamList = {
  LearningPostDetail: { postId: string };
};

type LearningPostDetailRouteProp = RouteProp<RootStackParamList, 'LearningPostDetail'>;

const POST_TYPE_CONFIG: Record<LearningPostType, { label: string; icon: string; color: string }> = {
  learned: { label: 'Learned', icon: 'lightbulb', color: '#10b981' },
  practicing: { label: 'Practicing', icon: 'fitness', color: '#3b82f6' },
  question: { label: 'Question', icon: 'help-circle', color: '#f59e0b' },
  building: { label: 'Building', icon: 'hammer', color: '#8b5cf6' },
};

const COMMON_REACTIONS = ['👍', '❤️', '🔥', '💡', '🤔', '👏'];

export default function LearningPostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<LearningPostDetailRouteProp>();
  const { postId } = route.params;

  const mode = useThemeStore((s) => s.mode);
  const theme = themes[mode];

  const [post, setPost] = useState<LearningPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reacting, setReacting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ post: LearningPostDetail }>(`/learning/posts/${postId}`);
      setPost(response.data.post);
    } catch (err: any) {
      console.error('Error fetching post:', err);
      setError(err.response?.data?.error || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleReaction = useCallback(
    async (emoji: string) => {
      if (!post || reacting) return;

      try {
        setReacting(true);
        const response = await api.post<{ reacted: boolean }>(`/learning/posts/${postId}/react`, {
          emoji,
        });

        // Update local state
        setPost((prev) => {
          if (!prev) return prev;

          const existingReaction = prev.reactionSummary.find((r) => r.emoji === emoji);
          let newSummary: ReactionSummary[];

          if (response.data.reacted) {
            // Add or increment reaction
            if (existingReaction) {
              newSummary = prev.reactionSummary.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r,
              );
            } else {
              newSummary = [...prev.reactionSummary, { emoji, count: 1, userReacted: true }];
            }
          } else {
            // Remove or decrement reaction
            newSummary = prev.reactionSummary
              .map((r) =>
                r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r,
              )
              .filter((r) => r.count > 0);
          }

          return { ...prev, reactionSummary: newSummary };
        });
      } catch (err: any) {
        console.error('Error reacting:', err);
        Alert.alert('Error', 'Failed to add reaction');
      } finally {
        setReacting(false);
      }
    },
    [post, postId, reacting],
  );

  const handleSubmitComment = useCallback(async () => {
    if (!post || !commentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const response = await api.post<{ comment: LearningPostComment }>(
        `/learning/posts/${postId}/comments`,
        { content: commentText.trim(), isAiAssisted: false },
      );

      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, response.data.comment],
          commentCount: prev.commentCount + 1,
        };
      });

      setCommentText('');
    } catch (err: any) {
      console.error('Error posting comment:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  }, [post, postId, commentText, submittingComment]);

  const handleOpenResource = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (err) {
      console.error('Error opening URL:', err);
      Alert.alert('Error', 'Failed to open link');
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="alert-circle" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {error || 'Post not found'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPost}>
          <Text style={[styles.retryText, { color: theme.accent }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeConfig = POST_TYPE_CONFIG[post.postType];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
            <Ionicons name={typeConfig.icon as any} size={16} color={typeConfig.color} />
            <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
        </View>

        {/* Author Info */}
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: theme.accent + '30' }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {post.author.firstName[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.text }]}>{post.author.firstName}</Text>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>

        {/* Content */}
        {post.content && (
          <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>
        )}

        {/* Skills */}
        {post.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {post.skills.map((skill) => (
              <View key={skill.id} style={[styles.skillBadge, { backgroundColor: theme.card }]}>
                <Text style={[styles.skillText, { color: theme.textSecondary }]}>{skill.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Resource Link */}
        {post.resourceUrl && (
          <TouchableOpacity
            style={[styles.resourceCard, { backgroundColor: theme.card }]}
            onPress={() => handleOpenResource(post.resourceUrl!)}
          >
            <Ionicons name="link" size={20} color={theme.accent} />
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>
                {post.resourceTitle || 'View Resource'}
              </Text>
              <Text style={[styles.resourceUrl, { color: theme.textSecondary }]} numberOfLines={1}>
                {post.resourceUrl}
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        {/* AI Detection */}
        {(post.isAiAssisted || post.aiDetectionFlags.length > 0) && (
          <View style={[styles.aiBanner, { backgroundColor: theme.accent + '10' }]}>
            <Ionicons name="information-circle" size={18} color={theme.accent} />
            <Text style={[styles.aiText, { color: theme.textSecondary }]}>
              {post.isAiAssisted ? 'Author noted AI assistance' : 'AI-generated content detected'}
            </Text>
          </View>
        )}

        {/* Reactions */}
        <View style={styles.reactionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Reactions</Text>
          <View style={styles.reactionsRow}>
            {COMMON_REACTIONS.map((emoji) => {
              const reaction = post.reactionSummary.find((r) => r.emoji === emoji);
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionButton,
                    reaction?.userReacted && {
                      backgroundColor: theme.accent + '20',
                      borderColor: theme.accent,
                    },
                    !reaction?.userReacted && {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => handleReaction(emoji)}
                  disabled={reacting}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                  {reaction && (
                    <Text
                      style={[
                        styles.reactionCount,
                        reaction.userReacted
                          ? { color: theme.accent }
                          : { color: theme.textSecondary },
                      ]}
                    >
                      {reaction.count}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Comments ({post.commentCount})
          </Text>

          {post.comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-outline" size={32} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No comments yet. Start the conversation!
              </Text>
            </View>
          ) : (
            post.comments.map((comment) => (
              <View
                key={comment.id}
                style={[styles.commentItem, { borderBottomColor: theme.cardBorder }]}
              >
                <View style={[styles.commentAvatar, { backgroundColor: theme.accent + '30' }]}>
                  <Text style={[styles.avatarText, { color: theme.accent, fontSize: 12 }]}>
                    {comment.author.firstName[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: theme.text }]}>
                      {comment.author.firstName}
                    </Text>
                    <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: theme.text }]}>{comment.content}</Text>
                  {comment.isAiAssisted && (
                    <View style={styles.commentAiTag}>
                      <Text style={[styles.commentAiText, { color: theme.textSecondary }]}>
                        AI-assisted
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Spacer for keyboard */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Comment Input */}
      <View
        style={[
          styles.commentInputContainer,
          { backgroundColor: theme.bg, borderTopColor: theme.cardBorder },
        ]}
      >
        <TextInput
          style={[styles.commentInput, { backgroundColor: theme.card, color: theme.text }]}
          placeholder="Add a comment..."
          placeholderTextColor={theme.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: commentText.trim() ? theme.accent : theme.cardBorder },
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={commentText.trim() ? 'white' : theme.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 32,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceUrl: {
    fontSize: 12,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  aiText: {
    fontSize: 14,
    marginLeft: 8,
  },
  reactionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  emojiText: {
    fontSize: 18,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  commentsSection: {
    marginBottom: 16,
  },
  emptyComments: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentAiTag: {
    marginTop: 4,
  },
  commentAiText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
