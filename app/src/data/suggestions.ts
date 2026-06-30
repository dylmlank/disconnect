import { type Suggestion, type GoalType, SuggestionType } from '@disconnect/shared';

// ─── Quick Wins (under 10 min, no prep) ──────────────────────

export const QUICK_WINS: Suggestion[] = [
  {
    id: 'qw-1',
    type: 'quick_win',
    title: 'Stretch for 5 minutes',
    description: 'Get up and stretch your back, neck, and shoulders.',
    durationMinutes: 5,
    emoji: '🧘',
  },
  {
    id: 'qw-2',
    type: 'quick_win',
    title: 'Drink a glass of water',
    description: 'Hydrate. Most people are perpetually dehydrated.',
    durationMinutes: 1,
    emoji: '💧',
  },
  {
    id: 'qw-3',
    type: 'quick_win',
    title: 'Text a friend',
    description: "Reach out to someone you haven't talked to this week.",
    durationMinutes: 5,
    emoji: '💬',
  },
  {
    id: 'qw-4',
    type: 'quick_win',
    title: 'Take 10 deep breaths',
    description: 'Box breathing: 4 in, 4 hold, 4 out, 4 hold.',
    durationMinutes: 2,
    emoji: '🌬️',
  },
  {
    id: 'qw-5',
    type: 'quick_win',
    title: 'Walk around the block',
    description: 'Get outside, even just for a few minutes.',
    durationMinutes: 10,
    emoji: '🚶',
  },
  {
    id: 'qw-6',
    type: 'quick_win',
    title: "Write down 3 things you're grateful for",
    description: 'Gratitude shifts your mindset.',
    durationMinutes: 3,
    emoji: '🙏',
  },
  {
    id: 'qw-7',
    type: 'quick_win',
    title: 'Tidy your desk',
    description: 'Clear space, clear mind.',
    durationMinutes: 5,
    emoji: '🧹',
  },
  {
    id: 'qw-8',
    type: 'quick_win',
    title: 'Do 20 pushups',
    description: 'Quick burst of physical activity.',
    durationMinutes: 2,
    emoji: '💪',
  },
];

// ─── Goal-Aligned Suggestions ────────────────────────────────

export const GOAL_SUGGESTIONS: Record<GoalType, Suggestion[]> = {
  read: [
    {
      id: 'read-1',
      type: 'goal_aligned',
      title: 'Read 10 pages',
      description: "You're always a few pages away from finishing a chapter.",
      durationMinutes: 15,
      relatedGoal: 'read',
      emoji: '📚',
    },
    {
      id: 'read-2',
      type: 'goal_aligned',
      title: 'Read one article',
      description: 'Find something substantial to read — not a tweet thread.',
      durationMinutes: 10,
      relatedGoal: 'read',
      emoji: '📰',
    },
    {
      id: 'read-3',
      type: 'goal_aligned',
      title: 'Visit the library',
      description: 'Browse the shelves. Pick up something unexpected.',
      durationMinutes: 30,
      relatedGoal: 'read',
      emoji: '🏛️',
    },
  ],

  exercise: [
    {
      id: 'ex-1',
      type: 'goal_aligned',
      title: 'Go for a run',
      description: 'Even 15 minutes counts.',
      durationMinutes: 20,
      relatedGoal: 'exercise',
      emoji: '🏃',
    },
    {
      id: 'ex-2',
      type: 'goal_aligned',
      title: 'Do a home workout',
      description: 'No gym needed. Pushups, squats, planks.',
      durationMinutes: 20,
      relatedGoal: 'exercise',
      emoji: '🏋️',
    },
    {
      id: 'ex-3',
      type: 'goal_aligned',
      title: 'Take a long walk',
      description: 'Leave your phone at home if you can.',
      durationMinutes: 30,
      relatedGoal: 'exercise',
      emoji: '🚶',
    },
    {
      id: 'ex-4',
      type: 'goal_aligned',
      title: 'Stretch or do yoga',
      description: 'Your body will thank you.',
      durationMinutes: 15,
      relatedGoal: 'exercise',
      emoji: '🧘',
    },
  ],

  create: [
    {
      id: 'create-1',
      type: 'goal_aligned',
      title: 'Write in a journal',
      description: 'One page. Stream of consciousness.',
      durationMinutes: 10,
      relatedGoal: 'create',
      emoji: '✍️',
    },
    {
      id: 'create-2',
      type: 'goal_aligned',
      title: 'Draw something',
      description: "Sketch what's in front of you. It doesn't have to be good.",
      durationMinutes: 15,
      relatedGoal: 'create',
      emoji: '🎨',
    },
    {
      id: 'create-3',
      type: 'goal_aligned',
      title: 'Take a photo',
      description: 'Find something interesting and compose a shot.',
      durationMinutes: 10,
      relatedGoal: 'create',
      emoji: '📷',
    },
    {
      id: 'create-4',
      type: 'goal_aligned',
      title: 'Write a poem or short story',
      description: 'Just start writing. See what happens.',
      durationMinutes: 20,
      relatedGoal: 'create',
      emoji: '📝',
    },
    {
      id: 'create-5',
      type: 'goal_aligned',
      title: 'Build or fix something',
      description: "That thing you've been meaning to repair...",
      durationMinutes: 30,
      relatedGoal: 'create',
      emoji: '🔧',
    },
  ],

  learn: [
    {
      id: 'learn-1',
      type: 'goal_aligned',
      title: 'Practice an instrument',
      description: 'Even 15 minutes of deliberate practice counts.',
      durationMinutes: 15,
      relatedGoal: 'learn',
      emoji: '🎸',
    },
    {
      id: 'learn-2',
      type: 'goal_aligned',
      title: 'Learn 5 words in a new language',
      description: 'Duolingo exists. Use it.',
      durationMinutes: 10,
      relatedGoal: 'learn',
      emoji: '🌍',
    },
    {
      id: 'learn-3',
      type: 'goal_aligned',
      title: 'Watch an educational video',
      description: 'Actually learn something — no entertainment masquerading as education.',
      durationMinutes: 15,
      relatedGoal: 'learn',
      emoji: '🎓',
    },
    {
      id: 'learn-4',
      type: 'goal_aligned',
      title: 'Work through a tutorial',
      description: "That skill you've been meaning to pick up...",
      durationMinutes: 30,
      relatedGoal: 'learn',
      emoji: '💻',
    },
  ],

  connect: [
    {
      id: 'connect-1',
      type: 'goal_aligned',
      title: 'Call a friend or family member',
      description: 'Actually talk to someone, not just text.',
      durationMinutes: 15,
      relatedGoal: 'connect',
      emoji: '📞',
    },
    {
      id: 'connect-2',
      type: 'goal_aligned',
      title: 'Write a letter',
      description: 'Handwritten. Send it to someone who would appreciate it.',
      durationMinutes: 20,
      relatedGoal: 'connect',
      emoji: '✉️',
    },
    {
      id: 'connect-3',
      type: 'goal_aligned',
      title: 'Plan to meet someone',
      description: 'Schedule coffee, a walk, or a meal with a friend.',
      durationMinutes: 10,
      relatedGoal: 'connect',
      emoji: '👥',
    },
    {
      id: 'connect-4',
      type: 'goal_aligned',
      title: 'Have a conversation',
      description: 'Talk to someone near you. Even a stranger.',
      durationMinutes: 10,
      relatedGoal: 'connect',
      emoji: '🗣️',
    },
  ],

  outside: [
    {
      id: 'out-1',
      type: 'goal_aligned',
      title: 'Go for a walk',
      description: 'No destination needed. Just move.',
      durationMinutes: 20,
      relatedGoal: 'outside',
      emoji: '🌳',
    },
    {
      id: 'out-2',
      type: 'goal_aligned',
      title: 'Sit in a park',
      description: 'Find a bench. Watch the world.',
      durationMinutes: 15,
      relatedGoal: 'outside',
      emoji: '🌲',
    },
    {
      id: 'out-3',
      type: 'goal_aligned',
      title: 'Go for a hike',
      description: 'Find a trail near you.',
      durationMinutes: 60,
      relatedGoal: 'outside',
      emoji: '⛰️',
    },
    {
      id: 'out-4',
      type: 'goal_aligned',
      title: 'Watch the sunset',
      description: 'Look up. The sky is free.',
      durationMinutes: 20,
      relatedGoal: 'outside',
      emoji: '🌅',
    },
  ],

  other: [
    {
      id: 'other-1',
      type: 'goal_aligned',
      title: 'Meditate',
      description: 'Sit. Breathe. Observe.',
      durationMinutes: 10,
      relatedGoal: 'other',
      emoji: '🧘',
    },
    {
      id: 'other-2',
      type: 'goal_aligned',
      title: 'Cook something',
      description: 'Make a meal from scratch.',
      durationMinutes: 30,
      relatedGoal: 'other',
      emoji: '🍳',
    },
    {
      id: 'other-3',
      type: 'goal_aligned',
      title: 'Listen to music intentionally',
      description: "Put on an album. Don't multitask. Just listen.",
      durationMinutes: 30,
      relatedGoal: 'other',
      emoji: '🎵',
    },
    {
      id: 'other-4',
      type: 'goal_aligned',
      title: 'Take a nap',
      description: '15-20 minutes. Set an alarm.',
      durationMinutes: 20,
      relatedGoal: 'other',
      emoji: '😴',
    },
  ],
};

// ─── Hobby Discovery (things they might not have tried) ─────

export const HOBBY_DISCOVERIES: Suggestion[] = [
  {
    id: 'hobby-1',
    type: 'hobby_discovery',
    title: 'Try sketching',
    description: "All you need is a pencil and paper. Draw what's in front of you.",
    durationMinutes: 15,
    emoji: '✏️',
  },
  {
    id: 'hobby-2',
    type: 'hobby_discovery',
    title: 'Try journaling',
    description: "One sentence about today. That's it.",
    durationMinutes: 5,
    emoji: '📔',
  },
  {
    id: 'hobby-3',
    type: 'hobby_discovery',
    title: 'Try cooking a new recipe',
    description: "Find something you've never made. You have the ingredients.",
    durationMinutes: 30,
    emoji: '👨‍🍳',
  },
  {
    id: 'hobby-4',
    type: 'hobby_discovery',
    title: 'Try solving a puzzle',
    description: 'Crossword, sudoku, jigsaw — pick your poison.',
    durationMinutes: 15,
    emoji: '🧩',
  },
  {
    id: 'hobby-5',
    type: 'hobby_discovery',
    title: 'Try learning origami',
    description: 'All you need is a piece of paper.',
    durationMinutes: 10,
    emoji: '🦢',
  },
  {
    id: 'hobby-6',
    type: 'hobby_discovery',
    title: 'Try photography',
    description: 'Your phone has a camera. Use it intentionally.',
    durationMinutes: 15,
    emoji: '📸',
  },
];

// ─── Suggestion Engine ───────────────────────────────────────

export function getSuggestions(goals: GoalType[], count: number = 5): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Always include 1 quick win
  const quickWin = QUICK_WINS[Math.floor(Math.random() * QUICK_WINS.length)];
  suggestions.push(quickWin);

  // Add goal-aligned suggestions
  if (goals.length > 0) {
    const goal = goals[Math.floor(Math.random() * goals.length)];
    const goalOptions = GOAL_SUGGESTIONS[goal] || [];
    if (goalOptions.length > 0) {
      const goalSuggestion = goalOptions[Math.floor(Math.random() * goalOptions.length)];
      suggestions.push(goalSuggestion);
    }
  }

  // Occasionally add a hobby discovery
  if (Math.random() > 0.5) {
    const hobby = HOBBY_DISCOVERIES[Math.floor(Math.random() * HOBBY_DISCOVERIES.length)];
    suggestions.push(hobby);
  }

  // Fill remaining with more quick wins
  while (suggestions.length < count) {
    const unusedQuickWins = QUICK_WINS.filter((qw) => !suggestions.find((s) => s.id === qw.id));
    if (unusedQuickWins.length === 0) break;
    suggestions.push(unusedQuickWins[Math.floor(Math.random() * unusedQuickWins.length)]);
  }

  return suggestions;
}
