const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'chatapp_db',
    multipleStatements: true
  });

  console.log('Connected to database. Running migrations...\n');

  // 1. Alter users table — MySQL doesn't support IF NOT EXISTS for columns
  const alterUsers = [
    "ALTER TABLE users ADD COLUMN bio TEXT",
    "ALTER TABLE users ADD COLUMN website VARCHAR(255) DEFAULT ''",
    "ALTER TABLE users ADD COLUMN is_private BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN username VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL",
  ];

  for (const sql of alterUsers) {
    try {
      await connection.query(sql);
    } catch (e) {
      // ER_DUP_FIELDNAME means column already exists — safe to skip
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.warn('  Warning:', e.message);
      }
    }
  }
  console.log('[OK] users table updated');

  // 2. Posts
  await connection.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      caption TEXT,
      location VARCHAR(255),
      post_type ENUM('image', 'video', 'carousel') DEFAULT 'image',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] posts table');

  // 3. Post media
  await connection.query(`
    CREATE TABLE IF NOT EXISTS post_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      media_url VARCHAR(500) NOT NULL,
      media_type ENUM('image', 'video') DEFAULT 'image',
      display_order INT DEFAULT 0,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] post_media table');

  // 4. Likes
  await connection.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      post_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_like (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] likes table');

  // 5. Comments
  await connection.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      post_id INT NOT NULL,
      parent_id INT DEFAULT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] comments table');

  // 6. Follows
  await connection.query(`
    CREATE TABLE IF NOT EXISTS follows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      follower_id INT NOT NULL,
      following_id INT NOT NULL,
      status ENUM('accepted', 'pending') DEFAULT 'accepted',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_follow (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] follows table');

  // 7. Bookmarks
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      post_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_bookmark (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] bookmarks table');

  // 8. Stories
  await connection.query(`
    CREATE TABLE IF NOT EXISTS stories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      media_url VARCHAR(500) NOT NULL,
      media_type ENUM('image', 'video') DEFAULT 'image',
      caption TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] stories table');

  // 9. Story views
  await connection.query(`
    CREATE TABLE IF NOT EXISTS story_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      story_id INT NOT NULL,
      viewer_id INT NOT NULL,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_view (story_id, viewer_id),
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] story_views table');

  // 10. Notifications
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      actor_id INT NOT NULL,
      type ENUM('like', 'comment', 'follow', 'mention', 'story_reply', 'follow_request') NOT NULL,
      reference_id INT,
      reference_type ENUM('post', 'comment', 'story', 'user'),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] notifications table');

  // 11. Hashtags
  await connection.query(`
    CREATE TABLE IF NOT EXISTS hashtags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      post_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[OK] hashtags table');

  // 12. Post-Hashtag junction
  await connection.query(`
    CREATE TABLE IF NOT EXISTS post_hashtags (
      post_id INT NOT NULL,
      hashtag_id INT NOT NULL,
      PRIMARY KEY (post_id, hashtag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] post_hashtags table');

  // 13. Reels
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      video_url VARCHAR(500) NOT NULL,
      thumbnail_url VARCHAR(500),
      caption TEXT,
      audio_name VARCHAR(255),
      view_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] reels table');

  // 14. Reel likes
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reel_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      reel_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_reel_like (user_id, reel_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] reel_likes table');

  // 15. Reel comments
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reel_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      reel_id INT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE
    )
  `);
  console.log('[OK] reel_comments table');

  console.log('\n All migrations completed successfully!');
  await connection.end();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
