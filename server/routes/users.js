const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const processMedia = require('../middleware/processMedia');

// Get user profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id === 'me' ? req.user.id : req.params.id;

    const [users] = await db.query(`
      SELECT 
        id, name, username, email, phone, avatar, bio, website, 
        is_private, is_verified, status, created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = users.id AND status = 'accepted') as follower_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = users.id AND status = 'accepted') as following_count,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = users.id AND status = 'accepted') as is_following,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = users.id AND status = 'pending') as is_requested
      FROM users WHERE id = ?
    `, [req.user.id, req.user.id, userId]);

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/me/profile', authenticateToken, async (req, res) => {
  try {
    const { name, username, bio, website, is_private } = req.body;
    
    // Check username uniqueness
    if (username) {
      const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
      if (existing.length > 0) return res.status(400).json({ error: 'Username already taken' });
    }

    await db.query(
      'UPDATE users SET name = COALESCE(?, name), username = COALESCE(?, username), bio = COALESCE(?, bio), website = COALESCE(?, website), is_private = COALESCE(?, is_private) WHERE id = ?',
      [name, username, bio, website, is_private, req.user.id]
    );

    const [updated] = await db.query('SELECT id, name, username, email, avatar, bio, website, is_private, is_verified FROM users WHERE id = ?', [req.user.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload avatar
router.post('/me/avatar', authenticateToken, upload.single('avatar'), processMedia, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
    
    res.json({ avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's posts
router.get('/:id/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id === 'me' ? req.user.id : req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const [posts] = await db.query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    for (let post of posts) {
      const [media] = await db.query('SELECT * FROM post_media WHERE post_id = ? ORDER BY display_order LIMIT 1', [post.id]);
      post.thumbnail = media[0] || null;
    }

    res.json({ posts, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's saved/bookmarked posts
router.get('/me/saved', authenticateToken, async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT 
        p.*, u.name as user_name, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    for (let post of posts) {
      const [media] = await db.query('SELECT * FROM post_media WHERE post_id = ? ORDER BY display_order LIMIT 1', [post.id]);
      post.thumbnail = media[0] || null;
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if target is private
    const [target] = await db.query('SELECT is_private FROM users WHERE id = ?', [req.params.id]);
    if (target.length === 0) return res.status(404).json({ error: 'User not found' });

    const status = target[0].is_private ? 'pending' : 'accepted';

    await db.query(
      'INSERT INTO follows (follower_id, following_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
      [req.user.id, req.params.id, status, status]
    );

    // Create notification
    const notifType = status === 'pending' ? 'follow_request' : 'follow';
    await db.query(
      'INSERT INTO notifications (user_id, actor_id, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, notifType, req.user.id, 'user']
    );

    res.json({ following: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow user
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, req.params.id]);
    res.json({ following: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followers
router.get('/:id/followers', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id === 'me' ? req.user.id : req.params.id;
    const [followers] = await db.query(`
      SELECT u.id, u.name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = u.id AND status = 'accepted') as is_following
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ? AND f.status = 'accepted'
    `, [req.user.id, userId]);
    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get following
router.get('/:id/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id === 'me' ? req.user.id : req.params.id;
    const [following] = await db.query(`
      SELECT u.id, u.name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = u.id AND status = 'accepted') as is_following
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ? AND f.status = 'accepted'
    `, [req.user.id, userId]);
    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search/find', authenticateToken, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [users] = await db.query(`
      SELECT id, name, username, avatar, is_verified,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = users.id AND status = 'accepted') as is_following
      FROM users
      WHERE (name LIKE ? OR username LIKE ? OR email LIKE ?) AND id != ?
      LIMIT 20
    `, [req.user.id, q, q, q, req.user.id]);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get suggested users
router.get('/suggestions/list', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, name, username, avatar, is_verified, bio
      FROM users
      WHERE id != ? 
        AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
      ORDER BY RAND()
      LIMIT 10
    `, [req.user.id, req.user.id]);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
