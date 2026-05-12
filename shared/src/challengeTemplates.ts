import { ChallengeTemplate } from './types';

export const CHALLENGE_TEMPLATES: readonly ChallengeTemplate[] = [
  {
    id: 'phone_free_mornings',
    title: 'Phone-Free Mornings',
    description: 'No phone before 9am. Start your day with intention, not notifications.',
    durationDays: 7,
    dailyRequirement: 'Keep your phone untouched until 9:00 AM',
    category: 'phone_free',
    researchNote: 'Limiting social media to 30min/day significantly reduces loneliness and depression over 3 weeks. (Hunt et al. 2018, U of Penn)',
  },
  {
    id: 'daily_walk_30',
    title: '30-Day Daily Walk',
    description: '30 minutes outdoors every day. Rain or shine.',
    durationDays: 30,
    dailyRequirement: 'Walk outside for at least 30 minutes',
    category: 'walk',
    researchNote: '30 minutes in nature reduces cortisol by 21% per session. (Hunter 2019, Frontiers in Psychology)',
  },
  {
    id: 'deep_work_week',
    title: 'Deep Work Week',
    description: '2+ hours of uninterrupted focus every day. No phone, no notifications, no multitasking.',
    durationDays: 7,
    dailyRequirement: 'Complete 2+ hours of focused, distraction-free work',
    category: 'deep_work',
    researchNote: 'Each context switch costs 23 minutes to recover full focus. 4 focused hours equal 8 fragmented. (Gloria Mark, UC Irvine)',
  },
  {
    id: 'digital_sunset',
    title: 'Digital Sunset',
    description: 'All screens off by 9pm for 14 days. Reclaim your evenings.',
    durationDays: 14,
    dailyRequirement: 'Put all screens away by 9:00 PM',
    category: 'digital_sunset',
    researchNote: 'Evening screen exposure delays sleep onset by 20-30 minutes and reduces REM sleep quality. (Chang et al. 2015, PNAS)',
  },
  {
    id: 'gratitude_sprint',
    title: 'Gratitude Sprint',
    description: 'Log 3 good things every day for 7 days. Simple but powerful.',
    durationDays: 7,
    dailyRequirement: 'Write down 3 good things that happened today',
    category: 'gratitude',
    researchNote: 'Just 1 week of practice produces sustained happiness increase at 6-month follow-up (d=0.36). (Seligman et al. 2005 RCT)',
  },
] as const;
