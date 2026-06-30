import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useThemeStore, themes, type ThemeColors } from '../../store/themeStore';
import type { LearningPostType, Skill } from '@disconnect/shared';

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

const POST_TYPES: { type: LearningPostType; label: string; icon: string; description: string }[] = [
  {
    type: 'learned',
    label: 'Learned',
    icon: 'lightbulb',
    description: 'Share something new you learned',
  },
  {
    type: 'practicing',
    label: 'Practicing',
    icon: 'fitness',
    description: "Show what you're working on",
  },
  {
    type: 'question',
    label: 'Question',
    icon: 'help-circle',
    description: 'Ask for help or insights',
  },
  {
    type: 'building',
    label: 'Building',
    icon: 'hammer',
    description: "Share a project you're creating",
  },
];

export default function CreateLearningPostScreen() {
  const navigation = useNavigation();
  const mode = useThemeStore((s) => s.mode);
  const theme = toScreenTheme(themes[mode]);

  const [postType, setPostType] = useState<LearningPostType>('learned');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [isAiAssisted, setIsAiAssisted] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillResults, setSkillResults] = useState<Skill[]>([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [aiDetectionWarning, setAiDetectionWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search skills
  useEffect(() => {
    if (skillSearch.length < 2) {
      setSkillResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/discover/learning/skills/search', {
          params: { q: skillSearch },
        });
        setSkillResults(res.data.skills);
      } catch (error) {
        console.error('Skill search failed:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [skillSearch]);

  // AI detection on content change
  useEffect(() => {
    if (content.length < 50) {
      setAiDetectionWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setDetecting(true);
      try {
        const res = await api.post('/learning/detect', { content });
        if (res.data.detection.confidence > 0.5) {
          setAiDetectionWarning(res.data.summary);
        } else {
          setAiDetectionWarning(null);
        }
      } catch (error) {
        console.error('AI detection failed:', error);
      } finally {
        setDetecting(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const addSkill = (skill: Skill) => {
    if (!selectedSkills.find((s) => s.id === skill.id)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillSearch('');
    setShowSkillPicker(false);
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== skillId));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a title for your post');
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert('Missing skills', 'Please add at least one skill related to your post');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/learning/posts', {
        postType,
        title: title.trim(),
        content: content.trim() || null,
        skillIds: selectedSkills.map((s) => s.id),
        resourceUrl: resourceUrl.trim() || null,
        resourceTitle: resourceTitle.trim() || null,
        isAiAssisted,
        isPublic,
      });

      (navigation as any).goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Post Type Selector */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>What are you sharing?</Text>
      <View style={styles.typeGrid}>
        {POST_TYPES.map((pt) => (
          <TouchableOpacity
            key={pt.type}
            style={[
              styles.typeCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              postType === pt.type && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            onPress={() => setPostType(pt.type)}
          >
            <Ionicons
              name={pt.icon as any}
              size={24}
              color={postType === pt.type ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: postType === pt.type ? theme.primary : theme.text },
              ]}
            >
              {pt.label}
            </Text>
            <Text style={[styles.typeDesc, { color: theme.textSecondary }]}>{pt.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Title</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="What's the headline?"
        placeholderTextColor={theme.textSecondary}
        value={title}
        onChangeText={setTitle}
        maxLength={200}
      />

      {/* Content */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Details (optional)</Text>
      <TextInput
        style={[
          styles.textArea,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="Share more context, what you learned, or what help you need..."
        placeholderTextColor={theme.textSecondary}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* AI Detection Warning */}
      {(detecting || aiDetectionWarning) && (
        <View style={[styles.aiWarning, { backgroundColor: '#fef3c7' }]}>
          {detecting ? (
            <ActivityIndicator size="small" color="#d97706" />
          ) : (
            <>
              <Ionicons name="information-circle" size={20} color="#d97706" />
              <Text style={styles.aiWarningText}>{aiDetectionWarning}</Text>
            </>
          )}
        </View>
      )}

      {/* AI Assistance Toggle */}
      <View style={[styles.toggleRow, { borderColor: theme.border }]}>
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>I used AI assistance</Text>
          <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
            Be honest if AI helped you write this
          </Text>
        </View>
        <Switch
          value={isAiAssisted}
          onValueChange={setIsAiAssisted}
          trackColor={{ false: theme.border, true: theme.primary }}
        />
      </View>

      {/* Skills */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Related Skills</Text>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setShowSkillPicker(!showSkillPicker)}
      >
        <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
        <Text style={[styles.pickerButtonText, { color: theme.primary }]}>Add skills</Text>
      </TouchableOpacity>

      {showSkillPicker && (
        <View
          style={[styles.skillPicker, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <TextInput
            style={[styles.skillSearch, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Search skills..."
            placeholderTextColor={theme.textSecondary}
            value={skillSearch}
            onChangeText={setSkillSearch}
          />
          {skillResults.length > 0 && (
            <View style={styles.skillResults}>
              {skillResults.slice(0, 5).map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={styles.skillResult}
                  onPress={() => addSkill(skill)}
                >
                  <Text style={[styles.skillResultText, { color: theme.text }]}>{skill.name}</Text>
                  <Text style={[styles.skillResultCategory, { color: theme.textSecondary }]}>
                    {skill.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <View style={styles.selectedSkills}>
          {selectedSkills.map((skill) => (
            <View
              key={skill.id}
              style={[styles.selectedSkill, { backgroundColor: theme.primary + '20' }]}
            >
              <Text style={[styles.selectedSkillText, { color: theme.primary }]}>{skill.name}</Text>
              <TouchableOpacity onPress={() => removeSkill(skill.id)}>
                <Ionicons name="close-circle" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Resource Link */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Resource Link (optional)</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="https://..."
        placeholderTextColor={theme.textSecondary}
        value={resourceUrl}
        onChangeText={setResourceUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      {resourceUrl.length > 0 && (
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Resource title"
          placeholderTextColor={theme.textSecondary}
          value={resourceTitle}
          onChangeText={setResourceTitle}
        />
      )}

      {/* Visibility */}
      <View style={[styles.toggleRow, { borderColor: theme.border }]}>
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Public post</Text>
          <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
            {isPublic ? 'Visible to everyone' : 'Only your circles can see'}
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: theme.border, true: theme.primary }}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: theme.primary },
          submitting && { opacity: 0.6 },
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  typeCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  typeDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
  },
  aiWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  aiWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  skillPicker: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  skillSearch: {
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  skillResults: {
    marginTop: 8,
  },
  skillResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  skillResultText: {
    fontSize: 15,
    fontWeight: '500',
  },
  skillResultCategory: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  selectedSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  selectedSkill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedSkillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
