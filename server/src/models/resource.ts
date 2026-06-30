import { db } from '../config/database';
import type {
  Resource,
  ResourceWithUploader,
  ResourceComment,
  ResourceType,
  Skill,
  UserProfile,
} from '@disconnect/shared';

interface ResourceRow {
  id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: ResourceType;
  cost: 'free' | 'paid' | 'freemium';
  upvotes: number;
  downvotes: number;
  created_at: Date;
}

export async function createResource(params: {
  uploaderId: string;
  title: string;
  description?: string;
  url: string;
  resourceType: ResourceType;
  skillIds: string[];
  cost?: 'free' | 'paid' | 'freemium';
}): Promise<Resource> {
  const { uploaderId, title, description, url, resourceType, skillIds, cost = 'free' } = params;

  const [row] = await db('resources')
    .insert({
      id: db.raw('gen_random_uuid()'),
      uploader_id: uploaderId,
      title,
      description: description ?? null,
      url,
      resource_type: resourceType,
      cost,
      upvotes: 0,
      downvotes: 0,
      created_at: db.fn.now(),
    })
    .returning('*');

  // Add skill associations
  if (skillIds.length > 0) {
    await db('resource_skills').insert(
      skillIds.map((skillId) => ({
        resource_id: row.id,
        skill_id: skillId,
      })),
    );
  }

  return mapRowToResource(row);
}

export async function getResourceById(params: {
  resourceId: string;
  userId: string;
}): Promise<ResourceWithUploader | null> {
  const { resourceId, userId } = params;

  const row = await db('resources as r')
    .join('users as u', 'u.id', 'r.uploader_id')
    .select(
      'r.*',
      'u.id as uploader_id',
      'u.first_name as uploader_name',
      'u.photo_url as uploader_photo',
    )
    .where('r.id', resourceId)
    .first();

  if (!row) return null;

  const resource = mapRowToResourceWithUploader(row);

  // Fetch skills
  const skillRows = await db('resource_skills as rs')
    .join('skills as s', 's.id', 'rs.skill_id')
    .select('s.id', 's.name', 's.category', 's.description')
    .where('rs.resource_id', resourceId);

  resource.skills = skillRows.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    aliases: [],
    relatedSkillIds: [],
  }));

  // Check user vote
  const vote = await db('resource_votes')
    .where({ user_id: userId, resource_id: resourceId })
    .first();

  resource.userVote = vote?.vote ?? null;

  return resource;
}

export async function getResources(params: {
  skillId?: string;
  resourceType?: ResourceType;
  uploaderId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'votes' | 'recent';
}): Promise<ResourceWithUploader[]> {
  const { skillId, resourceType, uploaderId, limit = 20, offset = 0, sortBy = 'votes' } = params;

  let query = db('resources as r')
    .join('users as u', 'u.id', 'r.uploader_id')
    .select(
      'r.*',
      'u.id as uploader_id_col',
      'u.first_name as uploader_name',
      'u.photo_url as uploader_photo',
    );

  if (skillId) {
    query = query.whereIn('r.id', function (this: any) {
      this.select('resource_id').from('resource_skills').where('skill_id', skillId);
    });
  }

  if (resourceType) {
    query = query.where('r.resource_type', resourceType);
  }

  if (uploaderId) {
    query = query.where('r.uploader_id', uploaderId);
  }

  // Sort
  if (sortBy === 'votes') {
    query = query.orderByRaw('(upvotes - downvotes) DESC');
  } else {
    query = query.orderBy('r.created_at', 'desc');
  }

  const rows = await query.limit(limit).offset(offset);

  // Fetch skills for all resources
  const resourceIds = rows.map((r) => r.id);
  const skillRows = await db('resource_skills as rs')
    .join('skills as s', 's.id', 'rs.skill_id')
    .select('rs.resource_id', 's.id', 's.name', 's.category', 's.description')
    .whereIn('rs.resource_id', resourceIds);

  const skillsByResource = new Map<string, Skill[]>();
  for (const row of skillRows) {
    if (!skillsByResource.has(row.resource_id)) {
      skillsByResource.set(row.resource_id, []);
    }
    skillsByResource.get(row.resource_id)!.push({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      aliases: [],
      relatedSkillIds: [],
    });
  }

  return rows.map((row) => ({
    ...mapRowToResourceWithUploader(row),
    skills: skillsByResource.get(row.id) ?? [],
    userVote: null, // Not fetched in list view
  }));
}

export async function voteResource(params: {
  resourceId: string;
  userId: string;
  vote: 'up' | 'down';
}): Promise<{ success: boolean; upvotes: number; downvotes: number }> {
  const { resourceId, userId, vote } = params;

  // Check existing vote
  const existing = await db('resource_votes')
    .where({ user_id: userId, resource_id: resourceId })
    .first();

  if (existing) {
    // If same vote, remove it (toggle off)
    if (existing.vote === vote) {
      await db('resource_votes').where({ user_id: userId, resource_id: resourceId }).delete();

      // Decrement counter
      const field = vote === 'up' ? 'upvotes' : 'downvotes';
      await db('resources').where('id', resourceId).decrement(field, 1);
    } else {
      // Change vote
      await db('resource_votes')
        .where({ user_id: userId, resource_id: resourceId })
        .update({ vote });

      // Swap counters
      await db('resources')
        .where('id', resourceId)
        .update({
          upvotes: db.raw(`upvotes ${vote === 'up' ? '+ 1' : '- 1'}`),
          downvotes: db.raw(`downvotes ${vote === 'down' ? '+ 1' : '- 1'}`),
        });
    }
  } else {
    // New vote
    await db('resource_votes').insert({
      user_id: userId,
      resource_id: resourceId,
      vote,
      voted_at: db.fn.now(),
    });

    // Increment counter
    const field = vote === 'up' ? 'upvotes' : 'downvotes';
    await db('resources').where('id', resourceId).increment(field, 1);
  }

  // Get updated counts
  const resource = await db('resources')
    .where('id', resourceId)
    .select('upvotes', 'downvotes')
    .first();

  return {
    success: true,
    upvotes: resource?.upvotes ?? 0,
    downvotes: resource?.downvotes ?? 0,
  };
}

export async function createResourceComment(params: {
  resourceId: string;
  authorId: string;
  content: string;
}): Promise<ResourceComment> {
  const { resourceId, authorId, content } = params;

  const [row] = await db('resource_comments')
    .insert({
      id: db.raw('gen_random_uuid()'),
      resource_id: resourceId,
      author_id: authorId,
      content,
      created_at: db.fn.now(),
    })
    .returning('*');

  const user = await db('users').where('id', authorId).first();

  return {
    id: row.id,
    resourceId: row.resource_id,
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
    createdAt: row.created_at.toISOString(),
  };
}

export async function getResourceComments(params: {
  resourceId: string;
  limit?: number;
  offset?: number;
}): Promise<ResourceComment[]> {
  const { resourceId, limit = 20, offset = 0 } = params;

  const rows = await db('resource_comments as rc')
    .join('users as u', 'u.id', 'rc.author_id')
    .select('rc.*', 'u.first_name', 'u.photo_url', 'u.is_minor')
    .where('rc.resource_id', resourceId)
    .orderBy('rc.created_at', 'asc')
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    resourceId: row.resource_id,
    authorId: row.author_id,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      photoUrl: row.photo_url,
      isMinor: row.is_minor,
      bio: null,
      interests: [],
    },
    content: row.content,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function deleteResource(params: {
  resourceId: string;
  userId: string;
}): Promise<boolean> {
  const { resourceId, userId } = params;

  const deleted = await db('resources')
    .where('id', resourceId)
    .where('uploader_id', userId)
    .delete();

  return deleted > 0;
}

// ─── Helpers ──────────────────────────────────────────────────

function mapRowToResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    uploaderId: row.uploader_id,
    title: row.title,
    description: row.description,
    url: row.url,
    resourceType: row.resource_type,
    skillIds: [], // populated separately
    cost: row.cost,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    createdAt: row.created_at.toISOString(),
  };
}

function mapRowToResourceWithUploader(row: any): ResourceWithUploader {
  return {
    id: row.id,
    uploaderId: row.uploader_id,
    title: row.title,
    description: row.description,
    url: row.url,
    resourceType: row.resource_type,
    skillIds: [],
    cost: row.cost,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    createdAt: row.created_at.toISOString(),
    uploader: {
      id: row.uploader_id_col || row.uploader_id,
      firstName: row.uploader_name,
      photoUrl: row.uploader_photo,
      isMinor: false, // not needed for uploader
      bio: null,
      interests: [],
    },
    skills: [], // populated separately
    userVote: null,
  };
}
