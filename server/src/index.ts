import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize a dummy user so we can test without authentication
const initDummyUser = async () => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['testuser']);
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        ['testuser', 'test@example.com', 'hashedpassword123']
      );
      console.log('Dummy user created!');
    }
  } catch (error) {
    console.error('Failed to create dummy user', error);
  }
};
initDummyUser();

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GET recent activities
app.get('/api/activities', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM activities 
      ORDER BY date DESC, created_at DESC 
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST new activity
app.post('/api/activities', async (req, res) => {
  const { type, duration_minutes, calories_burned, steps, date } = req.body;
  
  try {
    // We fetch the dummy user id
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'No user found' });
    const userId = userResult.rows[0].id;

    const newActivity = await pool.query(
      `INSERT INTO activities (user_id, type, duration_minutes, calories_burned, steps, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, duration_minutes, calories_burned, steps, date]
    );

    res.json(newActivity.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// GET recent meals/nutrition entries
app.get('/api/nutrition', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM nutrition 
      ORDER BY date DESC, created_at DESC 
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch nutrition logs' });
  }
});

// POST new nutrition entry
app.post('/api/nutrition', async (req, res) => {
  const { meal_name, calories, protein_g, carbs_g, fat_g, date } = req.body;
  
  try {
    // We fetch the dummy user id
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'No user found' });
    const userId = userResult.rows[0].id;

    const newNutrition = await pool.query(
      `INSERT INTO nutrition (user_id, meal_name, calories, protein_g, carbs_g, fat_g, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, meal_name, calories, protein_g || 0, carbs_g || 0, fat_g || 0, date]
    );

    res.json(newNutrition.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log nutrition entry' });
  }
});

// GET metrics for charts (Aggregated by day for the last 7 days)
app.get('/api/metrics', async (req, res) => {
  try {
    // Generate the last 7 days and join on aggregated daily activities and nutrition logs
    const result = await pool.query(`
      WITH last_7_days AS (
        SELECT current_date - i AS date
        FROM generate_series(0, 6) i
      ),
      daily_activities AS (
        SELECT date, SUM(calories_burned) as calories_burned, SUM(steps) as steps
        FROM activities
        GROUP BY date
      ),
      daily_nutrition AS (
        SELECT date, SUM(calories) as calories_consumed
        FROM nutrition
        GROUP BY date
      )
      SELECT 
        to_char(d.date, 'Dy') as name,
        COALESCE(da.calories_burned, 0) as calories,
        COALESCE(dn.calories_consumed, 0) as calories_consumed,
        COALESCE(da.steps, 0) as steps
      FROM last_7_days d
      LEFT JOIN daily_activities da ON da.date = d.date
      LEFT JOIN daily_nutrition dn ON dn.date = d.date
      ORDER BY d.date ASC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
