import { db } from '../config/database';
import type {
  LearningPost,
  LearningPostWithAuthor,
  LearningPostDetail,
  LearningPostComment,
  LearningPostType,
  Skill,
  UserProfile,
  ReactionSummary,
} from '@disconnect/shared';
import { analyzeTextPatterns } from '../services/aiDetection';

interface LearningPostRow {
  id: string;
  author_id: string;
  post_type: LearningPostType;
  title: string;
  content: string | null;
  resource_url: string | null;
  resource_title: string | null;
  is_ai_assisted: boolean;
  ai_detection_score: number | null;
  ai_detection_flags: string[];
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PostSkillRow {
  post_id: string;
  skill_id: string;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_ai_assisted: boolean;
  created_at: Date;
}

export async function createLearningPost(params: {
  authorId: string;
  postType: LearningPostType;
  title: string;
  content?: string;
  skillIds: string[];
  resourceUrl?: string;
  resourceTitle?: string;
  isAiAssisted: boolean;
  isPublic: boolean;
  circleIds?: string[];
}): Promise<LearningPost> {
  const {
    authorId,
    postType,
    title,
    content,
    skillIds,
    resourceUrl,
    resourceTitle,
    isAiAssisted,
    isPublic,
    circleIds,
  } = params;

  // Run AI detection on content
  const detection = content ? analyzeTextPatterns(content) : null;
  const aiDetectionScore = detection?.confidence ?? null;
  const aiDetectionFlags = detection?.flags ?? [];

  const [row] = await db('learning_posts')
    .insert({
      id: db.raw('gen_random_uuid()'),
      author_id: authorId,
      post_type: postType,
      title,
      content: content ?? null,
      resource_url: resourceUrl ?? null,
      resource_title: resourceTitle ?? null,
      is_ai_assisted: isAiAssisted,
      ai_detection_score: aiDetectionScore,
      ai_detection_flags: JSON.stringify(aiDetectionFlags),
      is_public: isPublic,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  // Insert skill associations
  if (skillIds.length > 0) {
    await db('learning_post_skills').insert(
      skillIds.map((skillId) => ({
        post_id: row.id,
        skill_id: skillId,
      })),
    );
  }

  // Insert circle associations
  if (circleIds && circleIds.length > 0) {
    await db('learning_post_circles').insert(
      circleIds.map((circleId) => ({
        post_id: row.id,
        circle_id: circleId,
      })),
    );
  }

  return mapRowToPost(row);
}

export async function getLearningPosts(params: {
  userId: string;
  postType?: LearningPostType;
  skillId?: string;
  circleId?: string;
  limit?: number;
  offset?: number;
}): Promise<LearningPostWithAuthor[]> {
  const { userId, postType, skillId, circleId, limit = 20, offset = 0 } = params;

  let query = db('learning_posts as lp')
    .select(
      'lp.*',
      'u.first_name as author_first_name',
      'u.photo_url as author_photo_url',
      'u.is_minor as author_is_minor',
      db.raw('COUNT(DISTINCT lpc.id) as comment_count'),
    )
    .join('users as u', 'u.id', 'lp.author_id')
    .leftJoin('learning_post_comments as lpc', 'lpc.post_id', 'lp.id')
    .groupBy('lp.id', 'u.first_name', 'u.photo_url', 'u.is_minor');

  // Filter by visibility
  query = query.where((qb) => {
    qb.where('lp.is_public', true).orWhereIn('lp.id', function (this: any) {
      this.select('lpc_circle.post_id')
        .from('learning_post_circles as lpc_circle')
        .join('circle_members as cm', 'cm.circle_id', 'lpc_circle.circle_id')
        .where('cm.user_id', userId);
    });
  });

  if (postType) {
    query = query.where('lp.post_type', postType);
  }

  if (skillId) {
    query = query.whereIn('lp.id', function (this: any) {
      this.select('post_id').from('learning_post_skills').where('skill_id', skillId);
    });
  }

  if (circleId) {
    query = query.whereIn('lp.id', function (this: any) {
      this.select('post_id').from('learning_post_circles').where('circle_id', circleId);
    });
  }

  // Block filter - don't show posts from blocked users
  query = query.whereNotIn('lp.author_id', function (this: any) {
    this.select('blocked_id').from('blocks').where('blocker_id', userId);
  });

  const rows = await query.orderBy('lp.created_at', 'desc').limit(limit).offset(offset);

  const posts = rows.map(mapRowToPostWithAuthor);

  // Fetch skills for each post
  const postIds = posts.map((p) => p.id);
  const skillRows = await db('learning_post_skills as lps')
    .join('skills as s', 's.id', 'lps.skill_id')
    .select('lps.post_id', 's.id as skill_id', 's.name', 's.category', 's.description')
    .whereIn('lps.post_id', postIds);

  const skillsByPost = new Map<string, Skill[]>();
  for (const row of skillRows) {
    const postId = row.post_id;
    if (!skillsByPost.has(postId)) skillsByPost.set(postId, []);
    skillsByPost.get(postId)!.push({
      id: row.skill_id,
      name: row.name,
      category: row.category,
      description: row.description,
      aliases: [],
      relatedSkillIds: [],
    });
  }

  // Fetch reactions
  const reactions = await db('reactions')
    .select('target_id', 'emoji')
    .whereIn('target_id', postIds)
    .where('target_type', 'learning_post');

  const reactionsByPost = new Map<string, Map<string, { count: number; userReacted: boolean }>>();
  for (const r of reactions) {
    if (!reactionsByPost.has(r.target_id)) {
      reactionsByPost.set(r.target_id, new Map());
    }
    const postReactions = reactionsByPost.get(r.target_id)!;
    const current = postReactions.get(r.emoji) ?? { count: 0, userReacted: false };
    if (r.user_id === userId) {
      current.userReacted = true;
    }
    current.count++;
    postReactions.set(r.emoji, current);
  }

  // Assemble final results
  return posts.map((post) => ({
    ...post,
    skills: skillsByPost.get(post.id) ?? [],
    reactionSummary: assembleReactionSummary(reactionsByPost.get(post.id)),
    commentCount: Number(post.commentCount ?? 0),
  }));
}

export async function getLearningPostById(params: {
  postId: string;
  userId: string;
}): Promise<LearningPostDetail | null> {
  const { postId, userId } = params;

  const row = await db('learning_posts as lp')
    .select(
      'lp.*',
      'u.first_name as author_first_name',
      'u.photo_url as author_photo_url',
      'u.is_minor as author_is_minor',
    )
    .join('users as u', 'u.id', 'lp.author_id')
    .where('lp.id', postId)
    .first();

  if (!row) return null;

  // Check visibility
  if (!row.is_public) {
    const hasAccess = await db('learning_post_circles as lpc')
      .join('circle_members as cm', 'cm.circle_id', 'lpc.circle_id')
      .where('lpc.post_id', postId)
      .where('cm.user_id', userId)
      .first();

    if (!hasAccess) return null;
  }

  const post = mapRowToPostWithAuthor(row);

  // Fetch skills
  const skillRows = await db('learning_post_skills as lps')
    .join('skills as s', 's.id', 'lps.skill_id')
    .select('s.id', 's.name', 's.category', 's.description')
    .where('lps.post_id', postId);

  post.skills = skillRows.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    aliases: [],
    relatedSkillIds: [],
  }));

  // Fetch comments
  const commentRows = await db('learning_post_comments as lpc')
    .select(
      'lpc.*',
      'u.first_name as author_first_name',
      'u.photo_url as author_photo_url',
      'u.is_minor as author_is_minor',
    )
    .join('users as u', 'u.id', 'lpc.author_id')
    .where('lpc.post_id', postId)
    .orderBy('lpc.created_at', 'asc');

  const comments: LearningPostComment[] = commentRows.map((c) => ({
    id: c.id,
    postId: c.post_id,
    authorId: c.author_id,
    author: {
      id: c.author_id,
      firstName: c.author_first_name,
      photoUrl: c.author_photo_url,
      isMinor: c.author_is_minor,
      bio: null,
      interests: [],
    },
    content: c.content,
    isAiAssisted: c.is_ai_assisted,
    createdAt: c.created_at.toISOString(),
  }));

  // Fetch reaction summary
  const reactionRows = await db('reactions')
    .where({ target_type: 'learning_post', target_id: postId })
    .select('emoji', 'user_id');

  const reactionMap = new Map<string, { count: number; userReacted: boolean }>();
  for (const r of reactionRows) {
    const cur = reactionMap.get(r.emoji) ?? { count: 0, userReacted: false };
    cur.count += 1;
    if (r.user_id === userId) cur.userReacted = true;
    reactionMap.set(r.emoji, cur);
  }
  const reactionSummary = Array.from(reactionMap.entries()).map(([emoji, v]) => ({
    emoji,
    count: v.count,
    userReacted: v.userReacted,
  }));

  return {
    ...post,
    commentCount: comments.length,
    reactionSummary,
    comments,
  };
}

export async function createComment(params: {
  postId: string;
  authorId: string;
  content: string;
  isAiAssisted: boolean;
}): Promise<LearningPostComment> {
  const { postId, authorId, content, isAiAssisted } = params;

  const [row] = await db('learning_post_comments')
    .insert({
      id: db.raw('gen_random_uuid()'),
      post_id: postId,
      author_id: authorId,
      content,
      is_ai_assisted: isAiAssisted,
      created_at: db.fn.now(),
    })
    .returning('*');

  // Fetch author info
  const user = await db('users').where('id', authorId).first();

  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    author: {
      id: user.id,
      firstName: user.first_name,
      photoUrl: user.photo_url,
      isMinor: user.is_minor,
      bio: null,
      interests: [],
    },
    content: row.content,
    isAiAssisted: row.is_ai_assisted,
    createdAt: row.created_at.toISOString(),
  };
}

export async function deletePost(params: { postId: string; userId: string }): Promise<boolean> {
  const { postId, userId } = params;

  const deleted = await db('learning_posts')
    .where('id', postId)
    .where('author_id', userId)
    .delete();

  return deleted > 0;
}

// ─── Helpers ──────────────────────────────────────────────────

function mapRowToPost(row: LearningPostRow): LearningPost {
  return {
    id: row.id,
    authorId: row.author_id,
    postType: row.post_type,
    title: row.title,
    content: row.content,
    skillIds: [], // populated separately
    resourceUrl: row.resource_url,
    resourceTitle: row.resource_title,
    isAiAssisted: row.is_ai_assisted,
    aiDetectionScore: row.ai_detection_score,
    aiDetectionFlags: Array.isArray(row.ai_detection_flags)
      ? row.ai_detection_flags
      : JSON.parse(row.ai_detection_flags || '[]'),
    isPublic: row.is_public,
    circleIds: [], // populated separately
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapRowToPostWithAuthor(row: any): LearningPostWithAuthor {
  return {
    id: row.id,
    authorId: row.author_id,
    postType: row.post_type,
    title: row.title,
    content: row.content,
    skillIds: [],
    resourceUrl: row.resource_url,
    resourceTitle: row.resource_title,
    isAiAssisted: row.is_ai_assisted,
    aiDetectionScore: row.ai_detection_score,
    aiDetectionFlags: Array.isArray(row.ai_detection_flags)
      ? row.ai_detection_flags
      : JSON.parse(row.ai_detection_flags || '[]'),
    isPublic: row.is_public,
    circleIds: [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    author: {
      id: row.author_id,
      firstName: row.author_first_name,
      photoUrl: row.author_photo_url,
      isMinor: row.author_is_minor,
      bio: null,
      interests: [],
    },
    skills: [], // populated separately
    reactionSummary: [], // populated separately
    commentCount: 0, // from query
  };
}

function assembleReactionSummary(
  reactions?: Map<string, { count: number; userReacted: boolean }>,
): ReactionSummary[] {
  if (!reactions) return [];
  const summary: ReactionSummary[] = [];
  for (const [emoji, data] of reactions) {
    summary.push({
      emoji,
      count: data.count,
      userReacted: data.userReacted,
    });
  }
  return summary.sort((a, b) => b.count - a.count);
}
