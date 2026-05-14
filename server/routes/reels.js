const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const [reels] = await db.query(`
      SELECT r.*, u.name as user_name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) as like_count,
        (SELECT COUNT(*) FROM reel_comments WHERE reel_id = r.id) as comment_count,
        (SELECT COUNT(*) > 0 FROM reel_likes WHERE reel_id = r.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ? AND following_id = r.user_id AND status = 'accepted') as is_following
      FROM reels r JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, limit, offset]);
    res.json({ reels, page, limit });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file' });
    const videoUrl = `/uploads/${req.file.filename}`;
    const { caption, audio_name } = req.body;
    const [result] = await db.query(
      'INSERT INTO reels (user_id, video_url, caption, audio_name) VALUES (?, ?, ?, ?)',
      [req.user.id, videoUrl, caption || '', audio_name || '']
    );
    const [reel] = await db.query('SELECT * FROM reels WHERE id = ?', [result.insertId]);
    res.status(201).json(reel[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    await db.query('INSERT IGNORE INTO reel_likes (user_id, reel_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    const [count] = await db.query('SELECT COUNT(*) as count FROM reel_likes WHERE reel_id = ?', [req.params.id]);
    res.json({ liked: true, count: count[0].count });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM reel_likes WHERE user_id = ? AND reel_id = ?', [req.user.id, req.params.id]);
    const [count] = await db.query('SELECT COUNT(*) as count FROM reel_likes WHERE reel_id = ?', [req.params.id]);
    res.json({ liked: false, count: count[0].count });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE reels SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ viewed: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT c.*, u.name as user_name, u.username, u.avatar
      FROM reel_comments c JOIN users u ON c.user_id = u.id
      WHERE c.reel_id = ? ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(comments);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'INSERT INTO reel_comments (user_id, reel_id, text) VALUES (?, ?, ?)',
      [req.user.id, req.params.id, req.body.text]
    );
    const [comment] = await db.query(`
      SELECT c.*, u.name as user_name, u.avatar FROM reel_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `, [result.insertId]);
    res.status(201).json(comment[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
