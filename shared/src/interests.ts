export interface InterestInfo {
  id: string;
  label: string;
}

export const INTERESTS: readonly InterestInfo[] = [
  { id: 'hiking', label: 'Hiking' },
  { id: 'running', label: 'Running' },
  { id: 'cycling', label: 'Cycling' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'climbing', label: 'Climbing' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'soccer', label: 'Soccer' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'skateboarding', label: 'Skateboarding' },
  { id: 'surfing', label: 'Surfing' },
  { id: 'photography', label: 'Photography' },
  { id: 'painting', label: 'Painting' },
  { id: 'music', label: 'Music' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'cooking', label: 'Cooking' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'board-games', label: 'Board Games' },
  { id: 'video-games', label: 'Video Games' },
  { id: 'film', label: 'Film' },
  { id: 'volunteering', label: 'Volunteering' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'camping', label: 'Camping' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'dogs', label: 'Dogs' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'dancing', label: 'Dancing' },
  { id: 'language-learning', label: 'Language Learning' },
  { id: 'travel', label: 'Travel' },
] as const;

export const INTEREST_IDS: readonly string[] = INTERESTS.map((i) => i.id);

export const MIN_INTERESTS = 2;
export const MAX_INTERESTS = 3;
