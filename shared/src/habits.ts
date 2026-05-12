import { HabitDefinition } from './types';

export const CURATED_HABITS: readonly HabitDefinition[] = [
  {
    id: 'exercise',
    name: 'Exercise',
    description: '30+ minutes of physical activity',
    researchNote: 'Reduces depression with effect size d=0.68, comparable to antidepressants in mild-moderate cases.',
    citation: 'Schuch et al. 2016 meta-analysis (n=1,487)',
    emoji: '🏃',
    targetMinutes: 30,
  },
  {
    id: 'nature',
    name: 'Nature Time',
    description: '20+ minutes outdoors in a natural setting',
    researchNote: 'Reduces cortisol by 21% per 30-minute session. Decreases rumination.',
    citation: 'Hunter 2019, Bratman et al. (Stanford)',
    emoji: '🌿',
    targetMinutes: 20,
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: '10+ minutes of meditation or mindful breathing',
    researchNote: 'Reliably reduces anxiety and stress (d=0.55-0.65). Strengthens anterior cingulate cortex.',
    citation: 'Hofmann et al. 2010 meta-analysis (39 studies)',
    emoji: '🧘',
    targetMinutes: 10,
  },
  {
    id: 'reading',
    name: 'Reading',
    description: '20+ minutes of reading (not screens)',
    researchNote: 'Builds cognitive reserve, reduces stress by 68% in 6 minutes. Improves focus and empathy.',
    citation: 'University of Sussex 2009, Wilson & Gallagher 2017',
    emoji: '📖',
    targetMinutes: 20,
  },
  {
    id: 'journaling',
    name: 'Journaling',
    description: 'Write about your day, thoughts, or gratitude',
    researchNote: 'Sustained happiness increase at 6-month follow-up (d=0.36) with just 1 week of practice.',
    citation: 'Seligman et al. 2005 RCT',
    emoji: '✍️',
  },
  {
    id: 'deep_work',
    name: 'Deep Work',
    description: '2+ hours of uninterrupted focused work',
    researchNote: 'Context switching costs 23 minutes per interruption. 4 focused hours = 8 fragmented hours of output.',
    citation: 'Gloria Mark (UC Irvine), Cal Newport',
    emoji: '🎯',
    targetMinutes: 120,
  },
  {
    id: 'screen_free_evening',
    name: 'Screen-Free Evening',
    description: 'No screens after 9pm',
    researchNote: 'Reduces depression and loneliness (d=0.35-0.5). Improves sleep onset by 20-30 minutes.',
    citation: 'Hunt et al. 2018 (U of Penn), Chang et al. 2015',
    emoji: '🌙',
  },
  {
    id: 'sleep',
    name: 'Quality Sleep',
    description: '7+ hours of sleep last night',
    researchNote: 'Chronic <6hr sleep equals cognitive impairment of 2 days total deprivation (d>1.0).',
    citation: 'Walker meta-analyses, Van Dongen et al. 2003',
    emoji: '😴',
    targetMinutes: 420,
  },
  {
    id: 'cold_exposure',
    name: 'Cold Exposure',
    description: 'Cold shower, plunge, or outdoor cold exposure',
    researchNote: 'Increases norepinephrine 300-500%, improving mood, alertness, and resilience.',
    citation: 'Šrámek et al. 2000, Souza 2018',
    emoji: '🧊',
  },
  {
    id: 'social_connection',
    name: 'Social Connection',
    description: 'Meaningful in-person interaction (not via screens)',
    researchNote: 'Strong social ties reduce all-cause mortality risk by 50%. Loneliness is equivalent to smoking 15 cigarettes/day.',
    citation: 'Holt-Lunstad et al. 2010 meta-analysis',
    emoji: '🤝',
  },
] as const;

export const CURATED_HABIT_IDS: readonly string[] = CURATED_HABITS.map((h) => h.id);
export const MAX_HABITS = 5;
export const MAX_CUSTOM_HABITS = 1;
