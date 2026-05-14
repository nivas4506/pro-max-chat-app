const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [stories] = await db.query(`
      SELECT s.*, u.name as user_name, u.username, u.avatar, u.is_verified,
        (SELECT COUNT(*) > 0 FROM story_views WHERE story_id = s.id AND viewer_id = ?) as is_viewed
      FROM stories s JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > NOW()
        AND (s.user_id = ? OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'))
      ORDER BY s.user_id, s.created_at ASC
    `, [req.user.id, req.user.id, req.user.id]);

    const grouped = {};
    for (const story of stories) {
      if (!grouped[story.user_id]) {
        grouped[story.user_id] = {
          user_id: story.user_id, user_name: story.user_name, username: story.username,
          avatar: story.avatar, is_verified: story.is_verified, has_unviewed: false, stories: []
        };
      }
      if (!story.is_viewed) grouped[story.user_id].has_unviewed = true;
      grouped[story.user_id].stories.push(story);
    }
    const result = Object.values(grouped);
    result.sort((a, b) => {
      if (a.user_id === req.user.id) return -1;
      if (b.user_id === req.user.id) return 1;
      return (b.has_unviewed ? 1 : 0) - (a.has_unviewed ? 1 : 0);
    });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No media file' });
    const mediaUrl = `/uploads/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const [result] = await db.query(
      'INSERT INTO stories (user_id, media_url, media_type, caption, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [req.user.id, mediaUrl, mediaType, req.body.caption || '']
    );
    const [story] = await db.query('SELECT * FROM stories WHERE id = ?', [result.insertId]);
    res.status(201).json(story[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    await db.query('INSERT IGNORE INTO story_views (story_id, viewer_id) VALUES (?, ?)', [req.params.id, req.user.id]);
    res.json({ viewed: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id/viewers', authenticateToken, async (req, res) => {
  try {
    const [story] = await db.query('SELECT user_id FROM stories WHERE id = ?', [req.params.id]);
    if (story.length === 0 || story[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    const [viewers] = await db.query(`
      SELECT u.id, u.name, u.username, u.avatar, sv.viewed_at
      FROM story_views sv JOIN users u ON sv.viewer_id = u.id WHERE sv.story_id = ? ORDER BY sv.viewed_at DESC
    `, [req.params.id]);
    res.json(viewers);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM stories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ deleted: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
