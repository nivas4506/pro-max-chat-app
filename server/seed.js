const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Seeding data...');
    
    // Check if users already exist
    const [existingUsers] = await db.query('SELECT count(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    const password = await bcrypt.hash('password123', 10);
    const users = [
      ['Sarah Connor', 'sarah@example.com', '1234567890', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'],
      ['Alex Mercer', 'alex@example.com', '1234567891', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop'],
      ['Elena Rodriguez', 'elena@example.com', '1234567892', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop'],
      ['Marcus Johnson', 'marcus@example.com', '1234567893', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop']
    ];

    for (const [name, email, phone, avatar] of users) {
      await db.query(
        'INSERT INTO users (name, email, password, phone, avatar, status) VALUES (?, ?, ?, ?, ?, ?)', 
        [name, email, password, phone, avatar, 'online']
      );
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

// Wait a bit for db initialization
setTimeout(seed, 2000);
