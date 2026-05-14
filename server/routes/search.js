const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/users', authenticateToken, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [users] = await db.query(`
      SELECT id, name, username, avatar, is_verified, bio,
        (SELECT COUNT(*) FROM follows WHERE following_id = users.id AND status = 'accepted') as follower_count,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = users.id) as is_following
      FROM users WHERE (name LIKE ? OR username LIKE ?) AND id != ? LIMIT 20
    `, [req.user.id, q, q, req.user.id]);
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/hashtags', authenticateToken, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [tags] = await db.query('SELECT * FROM hashtags WHERE name LIKE ? ORDER BY post_count DESC LIMIT 20', [q]);
    res.json(tags);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [posts] = await db.query(`
      SELECT p.*, u.name as user_name, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.caption LIKE ? ORDER BY like_count DESC LIMIT 20
    `, [q]);
    for (let post of posts) {
      const [media] = await db.query('SELECT * FROM post_media WHERE post_id = ? LIMIT 1', [post.id]);
      post.thumbnail = media[0] || null;
    }
    res.json(posts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
