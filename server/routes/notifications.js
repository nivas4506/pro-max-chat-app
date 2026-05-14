const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const [notifs] = await db.query(`
      SELECT n.*, u.name as actor_name, u.username as actor_username, u.avatar as actor_avatar
      FROM notifications n JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);
    res.json(notifs);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const [count] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE', [req.user.id]);
    res.json({ count: count[0].count });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
