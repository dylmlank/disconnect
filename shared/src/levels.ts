export interface LevelDefinition {
  level: number;
  name: string;
  xpRequired: number;
  emoji: string;
  unlocks: string | null;
}

export const LEVELS: readonly LevelDefinition[] = [
  { level: 1,  name: 'newcomer',    xpRequired: 0,    emoji: '🌱', unlocks: null },
  { level: 2,  name: 'explorer',    xpRequired: 50,   emoji: '🌿', unlocks: 'Create circles' },
  { level: 3,  name: 'regular',     xpRequired: 150,  emoji: '🌳', unlocks: 'Create challenges' },
  { level: 4,  name: 'committed',   xpRequired: 350,  emoji: '⭐', unlocks: 'Custom challenge templates' },
  { level: 5,  name: 'dedicated',   xpRequired: 600,  emoji: '🔥', unlocks: 'Create public challenges' },
  { level: 6,  name: 'focused',     xpRequired: 1000, emoji: '🎯', unlocks: 'Walk & Talk rooms' },
  { level: 7,  name: 'consistent',  xpRequired: 1500, emoji: '💎', unlocks: 'Custom habit names' },
  { level: 8,  name: 'unstoppable', xpRequired: 2200, emoji: '⚡', unlocks: 'Extended focus sessions (3hr)' },
  { level: 9,  name: 'inspiring',   xpRequired: 3000, emoji: '🌟', unlocks: 'City-wide challenges' },
  { level: 10, name: 'legendary',   xpRequired: 4000, emoji: '👑', unlocks: 'Gold profile badge' },
] as const;

// XP is earned from:
// - Logging a habit: 5 XP
// - Completing a check-in: 10 XP
// - Completing a focus session: 15 XP
// - Attending an event: 20 XP
// - Completing a challenge: 50 XP
// - Setting a vibe: 2 XP

export function getLevelForXP(xp: number): LevelDefinition {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  const next = LEVELS.find((l) => l.level === currentLevel + 1);
  return next || null;
}

export function getXPProgress(xp: number): { current: LevelDefinition; next: LevelDefinition | null; progressPercent: number } {
  const current = getLevelForXP(xp);
  const next = getNextLevel(current.level);
  if (!next) return { current, next: null, progressPercent: 100 };

  const xpIntoLevel = xp - current.xpRequired;
  const xpNeeded = next.xpRequired - current.xpRequired;
  const progressPercent = Math.round((xpIntoLevel / xpNeeded) * 100);

  return { current, next, progressPercent };
}
