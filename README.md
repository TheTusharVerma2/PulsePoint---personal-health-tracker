# 🩺 PulsePoint — Personal Health & Fitness Tracker

**PulsePoint** is a modern, full-stack personal health and wellness application. Designed with a sleek dark-mode glassmorphism UI, PulsePoint enables users to track daily activities, monitor nutritional intake and macronutrients, calculate real-time readiness scores, view Apple-Health-style activity rings, receive AI-driven health insights, earn gamified achievement badges, and export health progress reports to PDF/CSV.

---

## ✨ Features

- 📊 **Dynamic Health Dashboard**: Real-time summary cards for Heart Rate, Calories Burned, Calories Consumed, Daily Steps, Sleep Duration, Resting Heart Rate, and HRV.
- ⭕ **Apple Health Style Activity Rings**: Interactive activity rings tracking progress towards daily Move (Calories), Exercise (Minutes), and Stand/Step goals.
- ⚡ **Daily Readiness Score**: Calculates a daily recovery score (0–100%) based on sleep, resting heart rate, HRV, and recent workout intensity.
- 💡 **Smart AI Insights Engine**: Generates personalized health recommendations, recovery warnings, macro balance analysis, and streak tracking.
- 🏃 **Activity Logging**: Log workouts (Running, Cycling, Yoga, Swimming, Weightlifting, Sleep) with duration, calories burned, and step count.
- 🥗 **Nutrition & Macro Tracking**: Log meals with calorie counts and macro distribution (Protein, Carbs, Fat) to maintain balanced nutrition.
- 🎯 **Custom Goals & Targets**: Define and customize daily step, calorie burn, calorie intake, and protein targets.
- 🏆 **Gamified Achievements**: Track streaks and unlock milestone badges for workout counts, step records, and consistent logging.
- 📄 **Data Export & PDF Reports**: Generate and export health performance summaries to PDF reports or raw CSV files.
- 🔐 **Authentication & Demo Mode**: Full JWT-backed user sign-up and login, alongside an instant 1-click **Demo Mode** for zero-friction exploration.
- 🎨 **Premium Glassmorphism Dark UI**: Custom CSS design system featuring smooth gradients, responsive layout cards, micro-animations, and modal dialogs.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (TypeScript, Vite)
- **Recharts** (Multi-series area charts, macro pie charts, progress bars)
- **Lucide React** (Modern iconography)
- **html2canvas** & **jsPDF** (Client-side PDF report generation)
- **Vitest** & **React Testing Library** (Frontend unit testing)
- **Vanilla CSS** (Custom design tokens, glassmorphic layout system, responsive grid)

### Backend
- **Node.js** & **Express** (TypeScript, `tsx` hot reloading)
- **PostgreSQL** (`pg` pool connector with parameterized queries)
- **Authentication**: **JSON Web Tokens (JWT)** & **bcryptjs** password hashing
- **Testing**: **Jest** & **Supertest** (Integration testing)

---

## 🗄️ Database Schema

The database consists of four relational tables managed in PostgreSQL:

### 1. `users`
User credentials and account metadata.
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR(50) UNIQUE)
- `email` (VARCHAR(255) UNIQUE)
- `password_hash` (VARCHAR(255))
- `created_at` (TIMESTAMP WITH TIME ZONE)

### 2. `user_goals`
Custom daily targets per user.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users.id)
- `daily_step_goal` (INTEGER DEFAULT 10000)
- `daily_calorie_burn_goal` (INTEGER DEFAULT 2000)
- `daily_calorie_intake_goal` (INTEGER DEFAULT 2200)
- `daily_protein_goal` (INTEGER DEFAULT 120)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### 3. `activities`
Workout logs and sleep entries.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users.id)
- `type` (VARCHAR(50)) — *e.g., running, cycling, yoga, swimming, sleep*
- `duration_minutes` (INTEGER)
- `calories_burned` (INTEGER)
- `steps` (INTEGER)
- `date` (DATE)
- `created_at` (TIMESTAMP WITH TIME ZONE)

### 4. `nutrition`
Meal entries and macronutrient distributions.
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users.id)
- `meal_name` (VARCHAR(100))
- `calories` (INTEGER)
- `protein_g` (DECIMAL(5,1))
- `carbs_g` (DECIMAL(5,1))
- `fat_g` (DECIMAL(5,1))
- `date` (DATE)
- `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database server running locally or remotely

---

### Local Installation & Environment Setup

#### 1. Clone Repository & Navigate to Directory
```bash
git clone https://github.com/TheTusharVerma2/PulsePoint---personal-health-tracker.git
cd "personal health tracker"
```

#### 2. Configure Server Environment Variables
Create a `.env` file in the `server/` folder (or copy from `.env.example` if available):
```env
PORT=5001
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=health_tracker
JWT_SECRET=your_jwt_secret_key
```

#### 3. Database Initialization
Ensure PostgreSQL is running and create the `health_tracker` database:
```sql
CREATE DATABASE health_tracker;
```

Initialize database tables and seed the default demo user:
```bash
cd server
npm install
npx tsx src/initDb.ts
```

---

## 💻 Running the Application

### Start Backend API Server
From the `server/` directory:
```bash
cd server
npm run dev
# Server listening on http://localhost:5001
```

### Start Frontend Client
From the `client/` directory:
```bash
cd client
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser! Click **Demo Mode** on the login modal to quickly explore without registering an account.

---

## 🧪 Running Tests

### Backend Tests (Jest)
From the `server/` directory:
```bash
npm run test
```

### Frontend Tests (Vitest)
From the `client/` directory:
```bash
npm run test
```

---

## 📡 API Reference

### 🔐 Authentication
- `POST /api/auth/register` — Create a new user account.
- `POST /api/auth/login` — Authenticate and receive a JWT.
- `POST /api/auth/demo` — Quick single-click authentication for demo user.
- `GET /api/auth/me` — Fetch current user profile and target goals (Requires Auth Token).

### 🎯 Goals & Targets
- `GET /api/goals` — Retrieve user's daily goals.
- `PUT /api/goals` — Update daily step, calorie, and protein targets.

### 🏃 Activity Tracking
- `GET /api/activities` — Fetch logged workout and sleep activities.
- `POST /api/activities` — Log a new workout or sleep session.
- `DELETE /api/activities/:id` — Delete an activity entry.

### 🥗 Nutrition & Meals
- `GET /api/nutrition` — Fetch logged meals and nutrition data.
- `POST /api/nutrition` — Log a meal with calorie and macro counts.
- `DELETE /api/nutrition/:id` — Delete a nutrition entry.

### 📊 Analytics & Metrics
- `GET /api/metrics` — Retrieve 7-day trend aggregations, 30-day macronutrient breakdown, and monthly totals.
- `GET /api/health` — API server health check endpoint.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
