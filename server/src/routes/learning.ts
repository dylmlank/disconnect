import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLearningPost,
  getLearningPosts,
  getLearningPostById,
  createComment,
  deletePost,
} from '../models/learningPost';
import {
  createResource,
  getResourceById,
  getResources,
  voteResource,
  createResourceComment,
  getResourceComments,
  deleteResource,
} from '../models/resource';
import type { LearningPostType, ResourceType } from '@disconnect/shared';

const router = Router();

/**
 * GET /api/learning/posts
 * Fetch learning posts feed
 */
router.get('/posts', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postType = req.query.type as LearningPostType | undefined;
    const skillId = req.query.skillId as string | undefined;
    const circleId = req.query.circleId as string | undefined;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = parseInt(req.query.offset as string) || 0;

    const posts = await getLearningPosts({
      userId,
      postType,
      skillId,
      circleId,
      limit,
      offset,
    });

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching learning posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/learning/posts/:postId
 * Fetch a single learning post with details
 */
router.get('/posts/:postId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.postId as string;

    const post = await getLearningPostById({ postId, userId });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Error fetching learning post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * POST /api/learning/posts
 * Create a new learning post
 */
router.post('/posts', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const {
      postType,
      title,
      content,
      skillIds,
      resourceUrl,
      resourceTitle,
      isAiAssisted,
      isPublic,
      circleIds,
    } = req.body;

    // Validate required fields
    if (!postType || !title) {
      return res.status(400).json({ error: 'postType and title are required' });
    }

    if (!['learned', 'practicing', 'question', 'building'].includes(postType)) {
      return res.status(400).json({ error: 'Invalid post type' });
    }

    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' });
    }

    const post = await createLearningPost({
      authorId: userId,
      postType,
      title,
      content,
      skillIds,
      resourceUrl,
      resourceTitle,
      isAiAssisted: isAiAssisted ?? false,
      isPublic: isPublic ?? true,
      circleIds,
    });

    res.status(201).json({ post });
  } catch (error) {
    console.error('Error creating learning post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

/**
 * DELETE /api/learning/posts/:postId
 * Delete a learning post (author only)
 */
router.delete('/posts/:postId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.postId as string;

    const deleted = await deletePost({ postId, userId });

    if (!deleted) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting learning post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

/**
 * POST /api/learning/posts/:postId/comments
 * Add a comment to a learning post
 */
router.post('/posts/:postId/comments', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.postId as string;
    const { content, isAiAssisted } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check post exists and user has access
    const post = await getLearningPostById({ postId, userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await createComment({
      postId,
      authorId: userId,
      content: content.trim(),
      isAiAssisted: isAiAssisted ?? false,
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * POST /api/learning/posts/:postId/react
 * Add a reaction to a learning post
 */
router.post('/posts/:postId/react', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.postId as string;
    const { emoji } = req.body;

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Check if already reacted with this emoji
    const existing = await req.app.locals
      .db('reactions')
      .where({
        user_id: userId,
        target_type: 'learning_post',
        target_id: postId,
        emoji,
      })
      .first();

    if (existing) {
      // Remove reaction (toggle off)
      await req.app.locals
        .db('reactions')
        .where({
          user_id: userId,
          target_type: 'learning_post',
          target_id: postId,
          emoji,
        })
        .delete();

      return res.json({ reacted: false });
    }

    // Add reaction
    await req.app.locals.db('reactions').insert({
      id: req.app.locals.db.raw('gen_random_uuid()'),
      user_id: userId,
      target_type: 'learning_post',
      target_id: postId,
      emoji,
      created_at: req.app.locals.db.fn.now(),
    });

    res.json({ reacted: true });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

/**
 * POST /api/learning/detect
 * Check content for AI generation patterns (preview before posting)
 */
router.post('/detect', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const { analyzeTextPatterns, formatDetectionSummary } = await import('../services/aiDetection');
    const result = analyzeTextPatterns(content);

    res.json({
      detection: result,
      summary: formatDetectionSummary(result),
    });
  } catch (error) {
    console.error('Error detecting AI content:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

// ─── Resources ────────────────────────────────────────────────

/**
 * GET /api/learning/resources
 * List resources with optional filters
 */
router.get('/resources', authenticate, async (req, res) => {
  try {
    const { skillId, type, uploaderId, sortBy, limit, offset } = req.query;

    const resources = await getResources({
      skillId: skillId as string | undefined,
      resourceType: type as ResourceType | undefined,
      uploaderId: uploaderId as string | undefined,
      sortBy: sortBy as 'votes' | 'recent' | undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });

    res.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

/**
 * GET /api/learning/resources/:resourceId
 * Get a single resource with details
 */
router.get('/resources/:resourceId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const resourceId = req.params.resourceId as string;

    const resource = await getResourceById({ resourceId, userId });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ resource });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

/**
 * POST /api/learning/resources
 * Create a new resource
 */
router.post('/resources', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { title, description, url, resourceType, skillIds, cost } = req.body;

    if (!title || !url || !resourceType) {
      return res.status(400).json({ error: 'title, url, and resourceType are required' });
    }

    if (!['article', 'book', 'course', 'video', 'tool', 'other'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' });
    }

    const resource = await createResource({
      uploaderId: userId,
      title,
      description,
      url,
      resourceType,
      skillIds,
      cost,
    });

    res.status(201).json({ resource });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

/**
 * POST /api/learning/resources/:resourceId/vote
 * Vote on a resource
 */
router.post('/resources/:resourceId/vote', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const resourceId = req.params.resourceId as string;
    const { vote } = req.body;

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be "up" or "down"' });
    }

    const result = await voteResource({
      resourceId,
      userId,
      vote,
    });

    res.json(result);
  } catch (error) {
    console.error('Error voting on resource:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

/**
 * GET /api/learning/resources/:resourceId/comments
 * Get comments for a resource
 */
router.get('/resources/:resourceId/comments', authenticate, async (req, res) => {
  try {
    const resourceId = req.params.resourceId as string;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const comments = await getResourceComments({ resourceId, limit, offset });
    res.json({ comments });
  } catch (error) {
    console.error('Error fetching resource comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/learning/resources/:resourceId/comments
 * Add a comment to a resource
 */
router.post('/resources/:resourceId/comments', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const resourceId = req.params.resourceId as string;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const comment = await createResourceComment({
      resourceId,
      authorId: userId,
      content: content.trim(),
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating resource comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * DELETE /api/learning/resources/:resourceId
 * Delete a resource (uploader only)
 */
router.delete('/resources/:resourceId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const resourceId = req.params.resourceId as string;

    const deleted = await deleteResource({ resourceId, userId });

    if (!deleted) {
      return res.status(404).json({ error: 'Resource not found or not authorized' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

export default router;
