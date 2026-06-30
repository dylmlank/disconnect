import type { Skill, SkillCategory } from './types';

/**
 * Initial skill taxonomy for the learning platform.
 * Skills are organized by category with aliases for flexible matching.
 * Related skills enable discovery suggestions.
 */

export const SKILL_TAXONOMY: Skill[] = [
  // ─── Programming ────────────────────────────────────────────
  {
    id: 'skill_javascript',
    name: 'JavaScript',
    category: 'programming',
    description: 'Web programming language for frontend and backend development',
    aliases: ['js', 'node', 'nodejs', 'ecmascript'],
    relatedSkillIds: ['skill_typescript', 'skill_react', 'skill_nodejs'],
  },
  {
    id: 'skill_typescript',
    name: 'TypeScript',
    category: 'programming',
    description: 'Typed superset of JavaScript for scalable applications',
    aliases: ['ts'],
    relatedSkillIds: ['skill_javascript', 'skill_react', 'skill_nodejs'],
  },
  {
    id: 'skill_python',
    name: 'Python',
    category: 'programming',
    description: 'General-purpose language for scripting, data science, and web',
    aliases: ['py', 'python3'],
    relatedSkillIds: ['skill_machine_learning', 'skill_web_scraping', 'skill_django'],
  },
  {
    id: 'skill_react',
    name: 'React',
    category: 'programming',
    description: 'JavaScript library for building user interfaces',
    aliases: ['reactjs', 'react.js'],
    relatedSkillIds: ['skill_javascript', 'skill_typescript', 'skill_nextjs'],
  },
  {
    id: 'skill_nodejs',
    name: 'Node.js',
    category: 'programming',
    description: 'JavaScript runtime for server-side development',
    aliases: ['node', 'node js'],
    relatedSkillIds: ['skill_javascript', 'skill_typescript', 'skill_express'],
  },
  {
    id: 'skill_rust',
    name: 'Rust',
    category: 'programming',
    description: 'Systems programming language focused on safety and performance',
    aliases: ['rustlang'],
    relatedSkillIds: ['skill_c', 'skill_go'],
  },
  {
    id: 'skill_go',
    name: 'Go',
    category: 'programming',
    description: 'Compiled language designed for simplicity and concurrency',
    aliases: ['golang'],
    relatedSkillIds: ['skill_rust', 'skill_nodejs'],
  },
  {
    id: 'skill_sql',
    name: 'SQL',
    category: 'programming',
    description: 'Query language for relational databases',
    aliases: ['postgresql', 'mysql', 'sqlite', 'databases'],
    relatedSkillIds: ['skill_postgresql', 'skill_mongodb'],
  },
  {
    id: 'skill_git',
    name: 'Git',
    category: 'programming',
    description: 'Version control system for tracking code changes',
    aliases: ['github', 'gitlab', 'version control'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_nextjs',
    name: 'Next.js',
    category: 'programming',
    description: 'React framework for production web applications',
    aliases: ['next js', 'nextjs'],
    relatedSkillIds: ['skill_react', 'skill_typescript', 'skill_nodejs'],
  },
  {
    id: 'skill_mobile_dev',
    name: 'Mobile Development',
    category: 'programming',
    description: 'Building applications for iOS and Android platforms',
    aliases: ['ios', 'android', 'swift', 'kotlin', 'react native', 'flutter'],
    relatedSkillIds: ['skill_react', 'skill_swift'],
  },
  {
    id: 'skill_machine_learning',
    name: 'Machine Learning',
    category: 'programming',
    description: 'Building systems that learn from data',
    aliases: ['ml', 'ai', 'deep learning', 'neural networks'],
    relatedSkillIds: ['skill_python', 'skill_data_science'],
  },
  {
    id: 'skill_data_science',
    name: 'Data Science',
    category: 'programming',
    description: 'Extracting insights from data using statistics and programming',
    aliases: ['data analysis', 'analytics', 'statistics'],
    relatedSkillIds: ['skill_python', 'skill_sql', 'skill_machine_learning'],
  },

  // ─── Design ──────────────────────────────────────────────────
  {
    id: 'skill_ui_design',
    name: 'UI Design',
    category: 'design',
    description: 'Designing user interfaces for digital products',
    aliases: ['user interface', 'visual design', 'interface design'],
    relatedSkillIds: ['skill_ux_design', 'skill_figma'],
  },
  {
    id: 'skill_ux_design',
    name: 'UX Design',
    category: 'design',
    description: 'Designing user experiences and product flows',
    aliases: ['user experience', 'product design', 'interaction design'],
    relatedSkillIds: ['skill_ui_design', 'skill_user_research'],
  },
  {
    id: 'skill_figma',
    name: 'Figma',
    category: 'design',
    description: 'Collaborative interface design tool',
    aliases: ['figma design', 'prototyping'],
    relatedSkillIds: ['skill_ui_design', 'skill_ux_design'],
  },
  {
    id: 'skill_graphic_design',
    name: 'Graphic Design',
    category: 'design',
    description: 'Visual communication through typography, imagery, and layout',
    aliases: ['visual design', 'print design'],
    relatedSkillIds: ['skill_illustration', 'skill_typography'],
  },
  {
    id: 'skill_motion_design',
    name: 'Motion Design',
    category: 'design',
    description: 'Creating animated visual content',
    aliases: ['animation', 'motion graphics', 'after effects'],
    relatedSkillIds: ['skill_video_editing'],
  },
  {
    id: 'skill_3d_modeling',
    name: '3D Modeling',
    category: 'design',
    description: 'Creating three-dimensional digital objects',
    aliases: ['blender', '3d art', 'cad', '3d design'],
    relatedSkillIds: ['skill_game_dev'],
  },

  // ─── Music ───────────────────────────────────────────────────
  {
    id: 'skill_guitar',
    name: 'Guitar',
    category: 'music',
    description: 'Playing acoustic or electric guitar',
    aliases: ['acoustic guitar', 'electric guitar'],
    relatedSkillIds: ['skill_music_theory', 'skill_songwriting'],
  },
  {
    id: 'skill_piano',
    name: 'Piano',
    category: 'music',
    description: 'Playing piano or keyboard instruments',
    aliases: ['keyboard', 'keys'],
    relatedSkillIds: ['skill_music_theory', 'skill_music_production'],
  },
  {
    id: 'skill_music_production',
    name: 'Music Production',
    category: 'music',
    description: 'Creating and recording music digitally',
    aliases: ['beat making', 'ableton', 'fl studio', 'logic pro', 'daw'],
    relatedSkillIds: ['skill_audio_engineering', 'skill_songwriting'],
  },
  {
    id: 'skill_music_theory',
    name: 'Music Theory',
    category: 'music',
    description: 'Understanding the structure and language of music',
    aliases: ['music fundamentals', 'harmony', 'composition'],
    relatedSkillIds: ['skill_piano', 'skill_guitar', 'skill_songwriting'],
  },
  {
    id: 'skill_singing',
    name: 'Singing',
    category: 'music',
    description: 'Vocal performance and technique',
    aliases: ['vocals', 'voice'],
    relatedSkillIds: ['skill_music_theory', 'skill_songwriting'],
  },
  {
    id: 'skill_dj',
    name: 'DJing',
    category: 'music',
    description: 'Mixing and performing recorded music for audiences',
    aliases: ['dj', 'mixing', 'turntablism'],
    relatedSkillIds: ['skill_music_production'],
  },

  // ─── Languages ───────────────────────────────────────────────
  {
    id: 'skill_spanish',
    name: 'Spanish',
    category: 'languages',
    description: 'Learning to speak, read, and write Spanish',
    aliases: ['español'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_french',
    name: 'French',
    category: 'languages',
    description: 'Learning to speak, read, and write French',
    aliases: ['français'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_japanese',
    name: 'Japanese',
    category: 'languages',
    description: 'Learning to speak, read, and write Japanese',
    aliases: ['日本語', 'nihongo'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_mandarin',
    name: 'Mandarin Chinese',
    category: 'languages',
    description: 'Learning to speak, read, and write Mandarin',
    aliases: ['中文', 'chinese', 'putonghua'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_german',
    name: 'German',
    category: 'languages',
    description: 'Learning to speak, read, and write German',
    aliases: ['deutsch'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_korean',
    name: 'Korean',
    category: 'languages',
    description: 'Learning to speak, read, and write Korean',
    aliases: ['한국어', 'hangeul'],
    relatedSkillIds: [],
  },

  // ─── Crafts ──────────────────────────────────────────────────
  {
    id: 'skill_knitting',
    name: 'Knitting',
    category: 'crafts',
    description: 'Creating fabric from yarn using needles',
    aliases: ['yarn craft', 'hand knitting'],
    relatedSkillIds: ['skill_crochet'],
  },
  {
    id: 'skill_crochet',
    name: 'Crochet',
    category: 'crafts',
    description: 'Creating fabric from yarn using a hooked needle',
    aliases: ['crocheting'],
    relatedSkillIds: ['skill_knitting'],
  },
  {
    id: 'skill_woodworking',
    name: 'Woodworking',
    category: 'crafts',
    description: 'Creating objects from wood',
    aliases: ['carpentry', 'wood craft', 'wood working'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_leatherworking',
    name: 'Leatherworking',
    category: 'crafts',
    description: 'Crafting items from leather',
    aliases: ['leather craft', 'leather working'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_pottery',
    name: 'Pottery',
    category: 'crafts',
    description: 'Creating ceramics and clay objects',
    aliases: ['ceramics', 'clay', 'wheel throwing'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_sewing',
    name: 'Sewing',
    category: 'crafts',
    description: 'Creating and repairing fabric items with needle and thread',
    aliases: ['garment making', 'textile craft'],
    relatedSkillIds: ['skill_embroidery'],
  },
  {
    id: 'skill_embroidery',
    name: 'Embroidery',
    category: 'crafts',
    description: 'Decorating fabric with needlework',
    aliases: ['needlework'],
    relatedSkillIds: ['skill_sewing'],
  },

  // ─── Sports ──────────────────────────────────────────────────
  {
    id: 'skill_basketball',
    name: 'Basketball',
    category: 'sports',
    description: 'Team sport played with a ball and hoop',
    aliases: ['hoops'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_soccer',
    name: 'Soccer',
    category: 'sports',
    description: 'Team sport played with a spherical ball',
    aliases: ['football', 'fútbol'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_rock_climbing',
    name: 'Rock Climbing',
    category: 'sports',
    description: 'Climbing natural or artificial rock formations',
    aliases: ['bouldering', 'climbing'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_yoga',
    name: 'Yoga',
    category: 'sports',
    description: 'Physical, mental, and spiritual practice',
    aliases: ['asana', 'yoga practice'],
    relatedSkillIds: ['skill_meditation'],
  },
  {
    id: 'skill_running',
    name: 'Running',
    category: 'sports',
    description: 'Running for fitness or sport',
    aliases: ['jogging', 'marathon training'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_weightlifting',
    name: 'Weightlifting',
    category: 'sports',
    description: 'Lifting weights for strength and fitness',
    aliases: ['strength training', 'powerlifting', 'bodybuilding'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_swimming',
    name: 'Swimming',
    category: 'sports',
    description: 'Moving through water',
    aliases: ['aquatics'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_martial_arts',
    name: 'Martial Arts',
    category: 'sports',
    description: 'Combat practices and self-defense',
    aliases: ['bjj', 'jiu jitsu', 'karate', 'taekwondo', 'judo', 'mma'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_skateboarding',
    name: 'Skateboarding',
    category: 'sports',
    description: 'Riding and performing tricks on a skateboard',
    aliases: ['skating'],
    relatedSkillIds: [],
  },
  {
    id: 'skill_surfing',
    name: 'Surfing',
    category: 'sports',
    description: 'Riding ocean waves on a surfboard',
    aliases: ['surf'],
    relatedSkillIds: ['skill_swimming'],
  },

  // ─── Cooking ─────────────────────────────────────────────────
  {
    id: 'skill_cooking',
    name: 'Cooking',
    category: 'cooking',
    description: 'Preparing food for consumption',
    aliases: ['culinary', 'chef', 'home cooking'],
    relatedSkillIds: ['skill_baking'],
  },
  {
    id: 'skill_baking',
    name: 'Baking',
    category: 'cooking',
    description: 'Cooking food using dry heat in an oven',
    aliases: ['pastry', 'bread making'],
    relatedSkillIds: ['skill_cooking'],
  },
  {
    id: 'skill_bartending',
    name: 'Bartending',
    category: 'cooking',
    description: 'Mixing and serving drinks',
    aliases: ['mixology', 'cocktails'],
    relatedSkillIds: [],
  },

  // ─── Science ─────────────────────────────────────────────────
  {
    id: 'skill_photography',
    name: 'Photography',
    category: 'art',
    description: 'Capturing images using a camera',
    aliases: ['photo', 'digital photography', 'film photography'],
    relatedSkillIds: ['skill_video_production'],
  },
  {
    id: 'skill_video_production',
    name: 'Video Production',
    category: 'art',
    description: 'Creating video content',
    aliases: ['filmmaking', 'videography', 'video editing'],
    relatedSkillIds: ['skill_photography', 'skill_motion_design'],
  },
  {
    id: 'skill_writing',
    name: 'Writing',
    category: 'writing',
    description: 'Creating written content',
    aliases: ['creative writing', 'content writing', 'copywriting'],
    relatedSkillIds: ['skill_storytelling'],
  },
  {
    id: 'skill_storytelling',
    name: 'Storytelling',
    category: 'writing',
    description: 'Crafting and sharing narratives',
    aliases: ['narrative', 'story structure'],
    relatedSkillIds: ['skill_writing'],
  },
  {
    id: 'skill_illustration',
    name: 'Illustration',
    category: 'art',
    description: 'Creating drawings and visual art',
    aliases: ['drawing', 'digital art', 'digital illustration'],
    relatedSkillIds: ['skill_graphic_design'],
  },
  {
    id: 'skill_game_dev',
    name: 'Game Development',
    category: 'programming',
    description: 'Creating video games',
    aliases: ['game dev', 'unity', 'unreal', 'godot', 'indie game'],
    relatedSkillIds: ['skill_3d_modeling', 'skill_programming'],
  },

  // ─── Business ────────────────────────────────────────────────
  {
    id: 'skill_entrepreneurship',
    name: 'Entrepreneurship',
    category: 'business',
    description: 'Starting and running a business',
    aliases: ['startups', 'founder', 'business building'],
    relatedSkillIds: ['skill_marketing', 'skill_product_management'],
  },
  {
    id: 'skill_marketing',
    name: 'Marketing',
    category: 'business',
    description: 'Promoting and selling products or services',
    aliases: ['digital marketing', 'growth', 'content marketing'],
    relatedSkillIds: ['skill_entrepreneurship'],
  },
  {
    id: 'skill_product_management',
    name: 'Product Management',
    category: 'business',
    description: 'Guiding the development and success of products',
    aliases: ['pm', 'product'],
    relatedSkillIds: ['skill_ux_design', 'skill_entrepreneurship'],
  },
  {
    id: 'skill_public_speaking',
    name: 'Public Speaking',
    category: 'business',
    description: 'Speaking to an audience effectively',
    aliases: ['presentation', 'speaking'],
    relatedSkillIds: ['skill_storytelling'],
  },
  {
    id: 'skill_investing',
    name: 'Investing',
    category: 'business',
    description: 'Allocating resources for future returns',
    aliases: ['stocks', 'investments', 'personal finance'],
    relatedSkillIds: [],
  },
];

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return SKILL_TAXONOMY.filter((s) => s.category === category);
}

/**
 * Find skill by name or alias (case-insensitive)
 */
export function findSkill(query: string): Skill | undefined {
  const normalized = query.toLowerCase().trim();
  return SKILL_TAXONOMY.find(
    (s) =>
      s.name.toLowerCase() === normalized || s.aliases.some((a) => a.toLowerCase() === normalized),
  );
}

/**
 * Get all skill categories with counts
 */
export function getSkillCategories(): { category: SkillCategory; count: number }[] {
  const counts = new Map<SkillCategory, number>();
  for (const skill of SKILL_TAXONOMY) {
    counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

/**
 * Search skills by name, alias, or description
 */
export function searchSkills(query: string): Skill[] {
  const normalized = query.toLowerCase().trim();
  return SKILL_TAXONOMY.filter(
    (s) =>
      s.name.toLowerCase().includes(normalized) ||
      s.aliases.some((a) => a.toLowerCase().includes(normalized)) ||
      (s.description && s.description.toLowerCase().includes(normalized)),
  );
}
