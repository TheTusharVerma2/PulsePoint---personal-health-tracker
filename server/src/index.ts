import express, { Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dns from 'dns';
import { pool } from './db';
import { authenticateToken, optionalAuth, AuthRequest, JWT_SECRET } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize testuser and DB schema if database is ready
const initDummyUser = async () => {
  try {
    // Migrations for existing databases
    await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`).catch(() => { });
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`).catch(() => { });

    const hashedPassword = await bcrypt.hash('password123', 10);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['testuser']);
    if (result.rows.length === 0) {
      const userRes = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['testuser', 'test@example.com', hashedPassword]
      );
      const userId = userRes.rows[0].id;
      await pool.query(
        `INSERT INTO user_goals (user_id, daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal)
         VALUES ($1, 10000, 2000, 2200, 120) ON CONFLICT DO NOTHING`,
        [userId]
      );
      console.log('Test user & default goals initialized successfully');
    }
  } catch (error) {
    console.error('Failed to check/create test user:', error);
  }
};
initDummyUser();

// Helper to get fallback user ID when unauthenticated request comes in (demo compatibility)
const getFallbackUserId = async (): Promise<number> => {
  const result = await pool.query('SELECT id FROM users LIMIT 1');
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  const hashedPassword = await bcrypt.hash('password123', 10);
  const newRes = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['testuser', 'test@example.com', hashedPassword]
  );
  return newRes.rows[0].id;
};

// Email verification helper (DNS MX lookup + strict Gmail ID format validation)
const verifyEmailExists = async (email: string): Promise<boolean> => {
  if (!email || !email.includes('@')) return false;
  const trimmed = email.trim().toLowerCase();
  const [username, domain] = trimmed.split('@');
  if (!username || !domain) return false;

  // Gmail account format validation (allows dots, underscores, hyphens, and plus signs)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    if (username.length < 3 || username.length > 64) return false;
    if (!/^[a-z0-9._%+-]+$/.test(username)) return false;
  }

  if (process.env.NODE_ENV === 'test' && (domain === 'example.com' || domain === 'test.com')) {
    return true;
  }

  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch (err) {
    return false;
  }
};

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// AUTH: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
  const trimmedUsername = username ? String(username).trim() : '';

  if (!trimmedUsername || !trimmedEmail || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@domain.com)' });
  }

  // Real Email Domain MX Record Check
  const emailExists = await verifyEmailExists(trimmedEmail);
  if (!emailExists) {
    return res.status(400).json({ error: 'Email ID does not exist' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  try {
    const existingEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [trimmedEmail]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in instead.' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [trimmedUsername]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'This username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [trimmedUsername, trimmedEmail, hashedPassword]
    );

    const user = userRes.rows[0];
    await pool.query(
      `INSERT INTO user_goals (user_id, daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal)
       VALUES ($1, 10000, 2000, 2200, 120) ON CONFLICT DO NOTHING`,
      [user.id]
    );

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const trimmedEmail = email ? String(email).trim().toLowerCase() : '';

  if (!trimmedEmail || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (trimmedEmail.includes('@')) {
    const emailExists = await verifyEmailExists(trimmedEmail);
    if (!emailExists) {
      return res.status(400).json({ error: 'Email ID does not exist' });
    }
  }

  try {
    const userRes = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)',
      [trimmedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email or username. Please check your credentials or register.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.json({ error: 'Login failed' });
  }
});

// AUTH: One-Click Demo Mode
app.post('/api/auth/demo', async (req, res) => {
  try {
    const userId = await getFallbackUserId();
    const userRes = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// AUTH: Google OAuth 2.0 Redirect URL Generator
app.get('/api/auth/google/url', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '1084920492014-pulsepoint.apps.googleusercontent.com';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173';
  const scope = encodeURIComponent('openid email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account%20consent`;

  res.json({ url: googleAuthUrl });
});

// AUTH: Google Sign-In / Registration
app.post('/api/auth/google', async (req, res) => {
  const { credential, googleId, email, name } = req.body;

  let targetEmail = email ? String(email).trim().toLowerCase() : '';
  let targetGoogleId = googleId ? String(googleId).trim() : '';
  let targetName = name ? String(name).trim() : '';

  // If a JWT token credential (ID token) from Google GIS was sent, verify or decode it
  if (credential && typeof credential === 'string') {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (response.ok) {
        const payload = await response.json();
        if (payload.email) targetEmail = payload.email.toLowerCase();
        if (payload.sub) targetGoogleId = payload.sub;
        if (payload.name) targetName = payload.name;
      } else {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) targetEmail = payload.email.toLowerCase();
          if (payload.sub) targetGoogleId = payload.sub;
          if (payload.name) targetName = payload.name;
        }
      }
    } catch (tokenErr) {
      console.warn('Google token verification fallback parsing used:', tokenErr);
    }
  }

  if (!targetEmail || !emailRegex.test(targetEmail)) {
    return res.status(400).json({ error: 'Valid Google email is required for authentication' });
  }

  // Real Email Domain MX Record Check
  const emailExists = await verifyEmailExists(targetEmail);
  if (!emailExists) {
    return res.status(400).json({ error: 'Email ID does not exist' });
  }

  try {
    // 1. Search for user by google_id or email
    let userRes = await pool.query(
      'SELECT id, username, email, google_id FROM users WHERE google_id = $1 OR LOWER(email) = LOWER($2)',
      [targetGoogleId || 'INVALID_GID', targetEmail]
    );

    let user;

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
      if (!user.google_id && targetGoogleId) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [targetGoogleId, user.id]);
      }
    } else {
      // 2. Auto-register new Google user
      let baseUsername = targetName
        ? targetName.replace(/[^a-zA-Z0-9]/g, '')
        : targetEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      if (!baseUsername || baseUsername.length < 2) baseUsername = 'GoogleUser';

      let finalUsername = baseUsername;
      let counter = 1;
      while (true) {
        const checkUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [finalUsername]);
        if (checkUser.rows.length === 0) break;
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      const newUserRes = await pool.query(
        'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) RETURNING id, username, email',
        [finalUsername, targetEmail, targetGoogleId || null]
      );
      user = newUserRes.rows[0];

      await pool.query(
        `INSERT INTO user_goals (user_id, daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal)
         VALUES ($1, 10000, 2000, 2200, 120) ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// AUTH: Get Current Profile
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRes = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [req.user?.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const goalsRes = await pool.query('SELECT * FROM user_goals WHERE user_id = $1', [req.user?.id]);
    res.json({ user: userRes.rows[0], goals: goalsRes.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GOALS: Read User Goals
app.get('/api/goals', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json({ daily_step_goal: 10000, daily_calorie_burn_goal: 2000, daily_calorie_intake_goal: 2200, daily_protein_goal: 120 });
    }
    const userId = req.user.id;
    let goalsRes = await pool.query('SELECT * FROM user_goals WHERE user_id = $1', [userId]);
    if (goalsRes.rows.length === 0) {
      goalsRes = await pool.query(
        `INSERT INTO user_goals (user_id, daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal)
         VALUES ($1, 10000, 2000, 2200, 120) RETURNING *`,
        [userId]
      );
    }
    res.json(goalsRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// GOALS: Update Goals
app.put('/api/goals', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to update goals' });
    }
    const userId = req.user.id;
    const { daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal } = req.body;

    const result = await pool.query(
      `INSERT INTO user_goals (user_id, daily_step_goal, daily_calorie_burn_goal, daily_calorie_intake_goal, daily_protein_goal, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         daily_step_goal = EXCLUDED.daily_step_goal,
         daily_calorie_burn_goal = EXCLUDED.daily_calorie_burn_goal,
         daily_calorie_intake_goal = EXCLUDED.daily_calorie_intake_goal,
         daily_protein_goal = EXCLUDED.daily_protein_goal,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, daily_step_goal || 10000, daily_calorie_burn_goal || 2000, daily_calorie_intake_goal || 2200, daily_protein_goal || 120]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

// ACTIVITIES: GET
app.get('/api/activities', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json([]);
    }
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ACTIVITIES: POST
app.post('/api/activities', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { type, duration_minutes, calories_burned, steps, date } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to log activities' });
    }
    const userId = req.user.id;
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

// ACTIVITIES: DELETE
app.delete('/api/activities/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to delete activity' });
    }
    const userId = req.user.id;
    const result = await pool.query('DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    }
    res.json({ message: 'Activity deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// NUTRITION: GET
app.get('/api/nutrition', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json([]);
    }
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM nutrition WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch nutrition logs' });
  }
});

// NUTRITION: POST
app.post('/api/nutrition', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { meal_name, calories, protein_g, carbs_g, fat_g, date } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to log nutrition' });
    }
    const userId = req.user.id;
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

// NUTRITION: DELETE
app.delete('/api/nutrition/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to delete nutrition' });
    }
    const userId = req.user.id;
    const result = await pool.query('DELETE FROM nutrition WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nutrition entry not found or unauthorized' });
    }
    res.json({ message: 'Nutrition entry deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete nutrition entry' });
  }
});

// METRICS: Aggregated stats, 7-day trend, 30-day trend, and Macronutrient Breakdown
app.get('/api/metrics', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json({
        last7Days: [],
        macros: { total_protein: 0, total_carbs: 0, total_fat: 0 },
        monthlySummary: { total_calories_burned: 0, total_calories_consumed: 0, total_steps: 0, avg_workout_duration: 0 }
      });
    }
    const userId = req.user.id;

    // 7-day trend
    const trend7Res = await pool.query(
      `
      WITH last_7_days AS (
        SELECT current_date - i AS date
        FROM generate_series(0, 6) i
      ),
      daily_activities AS (
        SELECT date, SUM(calories_burned) as calories_burned, SUM(steps) as steps
        FROM activities
        WHERE user_id = $1
        GROUP BY date
      ),
      daily_nutrition AS (
        SELECT date, SUM(calories) as calories_consumed, SUM(protein_g) as protein_g, SUM(carbs_g) as carbs_g, SUM(fat_g) as fat_g
        FROM nutrition
        WHERE user_id = $1
        GROUP BY date
      )
      SELECT 
        to_char(d.date, 'Dy') as name,
        d.date::text as date,
        COALESCE(da.calories_burned, 0) as calories,
        COALESCE(dn.calories_consumed, 0) as calories_consumed,
        COALESCE(da.steps, 0) as steps,
        COALESCE(dn.protein_g, 0) as protein,
        COALESCE(dn.carbs_g, 0) as carbs,
        COALESCE(dn.fat_g, 0) as fat
      FROM last_7_days d
      LEFT JOIN daily_activities da ON da.date = d.date
      LEFT JOIN daily_nutrition dn ON dn.date = d.date
      ORDER BY d.date ASC;
      `,
      [userId]
    );

    // Total Macronutrients summary for pie chart
    const macroRes = await pool.query(
      `
      SELECT 
        COALESCE(SUM(protein_g), 0) as total_protein,
        COALESCE(SUM(carbs_g), 0) as total_carbs,
        COALESCE(SUM(fat_g), 0) as total_fat
      FROM nutrition
      WHERE user_id = $1 AND date >= current_date - interval '30 days'
      `,
      [userId]
    );

    // 30-day breakdown summary
    const monthlyRes = await pool.query(
      `
      SELECT 
        COALESCE(SUM(da.calories_burned), 0) as total_calories_burned,
        COALESCE(SUM(dn.calories), 0) as total_calories_consumed,
        COALESCE(SUM(da.steps), 0) as total_steps,
        COALESCE(AVG(da.duration_minutes), 0) as avg_workout_duration
      FROM (SELECT * FROM activities WHERE user_id = $1 AND date >= current_date - interval '30 days') da
      FULL OUTER JOIN (SELECT * FROM nutrition WHERE user_id = $1 AND date >= current_date - interval '30 days') dn ON da.date = dn.date
      `,
      [userId]
    );

    res.json({
      last7Days: trend7Res.rows,
      macros: macroRes.rows[0] || { total_protein: 0, total_carbs: 0, total_fat: 0 },
      monthlySummary: monthlyRes.rows[0] || { total_calories_burned: 0, total_calories_consumed: 0, total_steps: 0, avg_workout_duration: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`PulsePoint API running on port ${port}`);
  });
}
