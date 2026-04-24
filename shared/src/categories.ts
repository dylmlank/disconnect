import { EventCategory } from './types';

export interface CategoryInfo {
  id: EventCategory;
  label: string;
  emoji: string;
}

export const EVENT_CATEGORIES: readonly CategoryInfo[] = [
  { id: 'outdoors', label: 'Outdoors', emoji: '\u{1F3D5}' },
  { id: 'coffee', label: 'Coffee', emoji: '\u{2615}' },
  { id: 'sports', label: 'Sports', emoji: '\u{26BD}' },
  { id: 'games', label: 'Games', emoji: '\u{1F3AE}' },
  { id: 'study', label: 'Study', emoji: '\u{1F4DA}' },
  { id: 'creative', label: 'Creative', emoji: '\u{1F3A8}' },
  { id: 'food', label: 'Food', emoji: '\u{1F355}' },
  { id: 'music', label: 'Music', emoji: '\u{1F3B5}' },
  { id: 'volunteering', label: 'Volunteering', emoji: '\u{1F91D}' },
] as const;

export const CATEGORY_IDS: readonly EventCategory[] = EVENT_CATEGORIES.map((c) => c.id);
