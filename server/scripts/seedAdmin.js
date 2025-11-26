const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function seedAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD || undefined,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const email = '4rcd07@gmail.com';

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let v_user_id;
    if (existing.rows.length > 0) {
      v_user_id = existing.rows[0].id;
      console.log('Admin user already exists, refreshing related records. User ID:', v_user_id);
    } else {
      v_user_id = crypto.randomUUID();
      console.log('Creating new admin user with id:', v_user_id);

      // Insert into users
      await pool.query(
        'INSERT INTO users (id, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [v_user_id, email]
      );
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Clean up any existing related records for this user id
    await pool.query('DELETE FROM user_passwords WHERE user_id = $1', [v_user_id]);
    await pool.query('DELETE FROM profiles WHERE id = $1', [v_user_id]);
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [v_user_id]);
    await pool.query('DELETE FROM user_preferences WHERE user_id = $1', [v_user_id]);

    // Insert password hash
    await pool.query(
      'INSERT INTO user_passwords (user_id, password_hash, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
      [v_user_id, hashedPassword]
    );

    // Insert profile
    await pool.query(
      'INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [v_user_id, email, 'Anthony', 'Rodriguez']
    );

    // Insert admin role
    await pool.query(
      'INSERT INTO user_roles (user_id, role, created_at) VALUES ($1, $2, NOW())',
      [v_user_id, 'admin']
    );

    // Insert preferences
    await pool.query(
      'INSERT INTO user_preferences (user_id, bills_enabled, doordash_enabled, home_maintenance_enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [v_user_id, true, false, false]
    );

    console.log('✅ Admin user seeded successfully (idempotent).');
    console.log('Email: 4rcd07@gmail.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedAdmin();
