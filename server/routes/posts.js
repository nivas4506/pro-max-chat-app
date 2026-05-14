const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const processMedia = require('../middleware/processMedia');

// Get feed posts (from followed users + own posts)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let [posts] = await db.query(`
      SELECT 
        p.*,
        u.name as user_name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) > 0 FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? 
        OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted')
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, req.user.id, req.user.id, limit, offset]);

    // FALLBACK: If feed is empty and it's the first page, suggest global trending posts
    if (posts.length === 0 && page === 1) {
      [posts] = await db.query(`
        SELECT 
          p.*,
          u.name as user_name, u.username, u.avatar, u.is_verified,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
          (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
          (SELECT COUNT(*) > 0 FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id != ?
        ORDER BY like_count DESC, p.created_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.id, req.user.id, req.user.id, limit, offset]);
      
      // Mark as suggested
      posts = posts.map(p => ({ ...p, is_suggested: true }));
    }

    // Fetch media for each post
    for (let post of posts) {
      const [media] = await db.query(
        'SELECT * FROM post_media WHERE post_id = ? ORDER BY display_order',
        [post.id]
      );
      post.media = media;
    }

    res.json({ posts, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT 
        p.*,
        u.name as user_name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) > 0 FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.user.id, req.user.id, req.params.id]);

    if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

    const [media] = await db.query('SELECT * FROM post_media WHERE post_id = ? ORDER BY display_order', [req.params.id]);
    posts[0].media = media;

    res.json(posts[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/', authenticateToken, upload.array('media', 10), processMedia, async (req, res) => {
  try {
    const { caption, location } = req.body;
    const postType = req.files && req.files.length > 1 ? 'carousel' : 'image';

    const [result] = await db.query(
      'INSERT INTO posts (user_id, caption, location, post_type) VALUES (?, ?, ?, ?)',
      [req.user.id, caption || '', location || '', postType]
    );

    const postId = result.insertId;

    // Save media files
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
        await db.query(
          'INSERT INTO post_media (post_id, media_url, media_type, display_order) VALUES (?, ?, ?, ?)',
          [postId, `/uploads/${file.filename}`, mediaType, i]
        );
      }
    }

    // Extract and save hashtags
    if (caption) {
      const hashtags = caption.match(/#\w+/g) || [];
      for (const tag of hashtags) {
        const tagName = tag.toLowerCase().slice(1);
        await db.query(
          'INSERT INTO hashtags (name, post_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE post_count = post_count + 1',
          [tagName]
        );
        const [htRows] = await db.query('SELECT id FROM hashtags WHERE name = ?', [tagName]);
        if (htRows.length > 0) {
          await db.query(
            'INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)',
            [postId, htRows[0].id]
          );
        }
      }
    }

    // Fetch the created post
    const [newPost] = await db.query(`
      SELECT p.*, u.name as user_name, u.username, u.avatar, u.is_verified
      FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [postId]);

    const [media] = await db.query('SELECT * FROM post_media WHERE post_id = ?', [postId]);
    newPost[0].media = media;

    res.status(201).json(newPost[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [post] = await db.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (post.length === 0) return res.status(403).json({ error: 'Unauthorized' });

    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    await db.query('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    
    // Create notification
    const [post] = await db.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
    if (post.length > 0 && post[0].user_id !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, actor_id, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?)',
        [post[0].user_id, req.user.id, 'like', req.params.id, 'post']
      );
    }

    const [count] = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [req.params.id]);
    res.json({ liked: true, count: count[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlike post
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, req.params.id]);
    const [count] = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [req.params.id]);
    res.json({ liked: false, count: count[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT c.*, u.name as user_name, u.username, u.avatar, u.is_verified
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text, parent_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO comments (user_id, post_id, parent_id, text) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.id, parent_id || null, text]
    );

    // Create notification
    const [post] = await db.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
    if (post.length > 0 && post[0].user_id !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, actor_id, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?)',
        [post[0].user_id, req.user.id, 'comment', req.params.id, 'post']
      );
    }

    const [comment] = await db.query(`
      SELECT c.*, u.name as user_name, u.username, u.avatar
      FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json(comment[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookmark post
router.post('/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    await db.query('INSERT IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    res.json({ bookmarked: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove bookmark
router.delete('/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [req.user.id, req.params.id]);
    res.json({ bookmarked: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Explore - get trending/recommended posts
router.get('/explore/trending', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [posts] = await db.query(`
      SELECT 
        p.*,
        u.name as user_name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) > 0 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY like_count DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    for (let post of posts) {
      const [media] = await db.query('SELECT * FROM post_media WHERE post_id = ? ORDER BY display_order', [post.id]);
      post.media = media;
    }

    res.json({ posts, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
