export interface ScienceBite {
  id: string;
  fact: string;
  citation: string;
  category: 'exercise' | 'nature' | 'focus' | 'social' | 'sleep' | 'mindfulness' | 'gratitude' | 'screen_time';
  emoji: string;
}

export const SCIENCE_BITES: readonly ScienceBite[] = [
  { id: 'sb1', fact: 'A 30-minute walk in nature reduces cortisol by 21%.', citation: 'Hunter 2019', category: 'nature', emoji: '🌿' },
  { id: 'sb2', fact: 'Each context switch costs 23 minutes to regain full focus.', citation: 'Gloria Mark, UC Irvine', category: 'focus', emoji: '🎯' },
  { id: 'sb3', fact: 'Writing 3 good things daily produces lasting happiness gains at 6-month follow-up.', citation: 'Seligman et al. 2005', category: 'gratitude', emoji: '📝' },
  { id: 'sb4', fact: 'Exercise reduces depression as effectively as medication in mild-moderate cases (d=0.68).', citation: 'Schuch et al. 2016', category: 'exercise', emoji: '🏃' },
  { id: 'sb5', fact: 'Social accountability increases goal follow-through by 65%.', citation: 'Gollwitzer et al.', category: 'social', emoji: '👥' },
  { id: 'sb6', fact: 'Limiting social media to 30min/day significantly reduces loneliness and depression.', citation: 'Hunt et al. 2018', category: 'screen_time', emoji: '📵' },
  { id: 'sb7', fact: 'Chronic sleep under 6 hours impairs cognition equivalent to 2 days without sleep.', citation: 'Walker meta-analyses', category: 'sleep', emoji: '😴' },
  { id: 'sb8', fact: '8 weeks of mindfulness practice reliably reduces anxiety (d=0.55-0.65).', citation: 'Hofmann et al. 2010', category: 'mindfulness', emoji: '🧘' },
  { id: 'sb9', fact: 'Strong social ties reduce all-cause mortality risk by 50%.', citation: 'Holt-Lunstad et al. 2010', category: 'social', emoji: '🤝' },
  { id: 'sb10', fact: 'Cold exposure increases norepinephrine 300-500%, improving mood and alertness.', citation: 'Souza 2018', category: 'exercise', emoji: '🧊' },
  { id: 'sb11', fact: '4 hours of focused work equals 8 hours of fragmented, distracted work.', citation: 'Cal Newport', category: 'focus', emoji: '🧠' },
  { id: 'sb12', fact: 'Reading for just 6 minutes reduces stress by 68%.', citation: 'University of Sussex 2009', category: 'mindfulness', emoji: '📖' },
  { id: 'sb13', fact: 'Evening screen exposure delays sleep onset by 20-30 minutes and reduces REM quality.', citation: 'Chang et al. 2015', category: 'screen_time', emoji: '🌙' },
  { id: 'sb14', fact: 'People who regularly volunteer have a 22% lower mortality rate.', citation: 'Okun et al. 2013', category: 'social', emoji: '🤝' },
  { id: 'sb15', fact: 'Walking meetings increase creative output by 60% compared to sitting.', citation: 'Oppezzo & Schwartz, Stanford 2014', category: 'nature', emoji: '🚶' },
  { id: 'sb16', fact: 'Spending 2 hours/week in nature is associated with good health and wellbeing.', citation: 'White et al. 2019', category: 'nature', emoji: '🌳' },
  { id: 'sb17', fact: 'Public commitment to a goal makes you 65% more likely to achieve it.', citation: 'ASTD Research', category: 'social', emoji: '📣' },
  { id: 'sb18', fact: 'The average person touches their phone 2,617 times per day.', citation: 'Dscout 2016', category: 'screen_time', emoji: '📱' },
  { id: 'sb19', fact: 'Gratitude practice rewires the brain for positivity within just 21 days.', citation: 'Emmons & McCullough 2003', category: 'gratitude', emoji: '✨' },
  { id: 'sb20', fact: '10 minutes of meditation increases attention span and working memory.', citation: 'Zeidan et al. 2010', category: 'mindfulness', emoji: '🧘' },
  { id: 'sb21', fact: 'Having just 3 close friends at work makes you 96% more likely to be satisfied with life.', citation: 'Gallup research', category: 'social', emoji: '💛' },
] as const;

// Get today's bite based on day of year (deterministic, rotates daily)
export function getTodaysBite(): ScienceBite {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (86400000));
  return SCIENCE_BITES[dayOfYear % SCIENCE_BITES.length];
}
