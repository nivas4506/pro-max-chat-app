const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

// Route imports
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const storiesRouter = require('./routes/stories');
const notificationsRouter = require('./routes/notifications');
const reelsRouter = require('./routes/reels');
const searchRouter = require('./routes/search');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- AUTH ROUTES ---

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length > 0) {
      user = users[0];
      await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    } else {
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const avatar = picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

      const [result] = await db.query(
        'INSERT INTO users (name, email, password, avatar, phone, username) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, avatar, '', username]
      );
      const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, username: user.username, bio: user.bio, is_verified: user.is_verified }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ error: 'Google authentication failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, avatar, username) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, avatar, username]
    );

    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET);
    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, phone, avatar, username, status: 'online' }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    await db.query('UPDATE users SET last_login = NOW(), status = "online" WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, username: user.username, bio: user.bio, is_verified: user.is_verified, status: 'online' }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- API ROUTES ---
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reels', reelsRouter);
app.use('/api/search', searchRouter);

// --- SOCKET.IO ---
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('user_online', { userId, online: true });
  });

  socket.on('send_message', async (data) => {
    const { text, sender_id, receiver_id } = data;
    try {
      const [result] = await db.query(
        'INSERT INTO messages (text, sender_id, receiver_id) VALUES (?, ?, ?)',
        [text, sender_id, receiver_id]
      );
      const message = { id: result.insertId, ...data, created_at: new Date() };
      const receiverSocketId = onlineUsers.get(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', message);
      }
      socket.emit('message_sent', message);
    } catch (error) { console.error('Error saving message:', error); }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit('user_typing', { userId: senderId });
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit('user_stop_typing', { userId: senderId });
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user_online', { userId, online: false });
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
