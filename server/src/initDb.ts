import { pool } from './db';
import bcrypt from 'bcryptjs';

const initDb = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations for existing databases
    await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`).catch(() => {});

    // Create activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        calories_burned INTEGER,
        steps INTEGER,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create nutrition table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nutrition (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        meal_name VARCHAR(100) NOT NULL,
        calories INTEGER NOT NULL,
        protein_g DECIMAL(5,1) DEFAULT 0,
        carbs_g DECIMAL(5,1) DEFAULT 0,
        fat_g DECIMAL(5,1) DEFAULT 0,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        daily_step_goal INTEGER DEFAULT 10000,
        daily_calorie_burn_goal INTEGER DEFAULT 2000,
        daily_calorie_intake_goal INTEGER DEFAULT 2200,
        daily_protein_goal INTEGER DEFAULT 120,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default test user if not existing
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', ['testuser']);
    if (existingUser.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userRes = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['testuser', 'test@example.com', hashedPassword]
      );
      const userId = userRes.rows[0].id;
      await pool.query(
        'INSERT INTO user_goals (user_id, daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal) VALUES ($1, 10000, 2000, 2200, 120) ON CONFLICT DO NOTHING',
        [userId]
      );
    }

    console.log('Database tables and initial user created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
};

initDb();

