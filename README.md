# PulsePoint - Personal Health Tracker

PulsePoint is a modern, premium personal health tracker web application that helps users monitor their workouts, activities, sleep, meals, and macronutrient balance. It displays beautiful visual metrics and dynamic multi-series charts aggregating their progress over time.

---

## Features

- **Dynamic Health Dashboard**: Real-time summary cards for Heart Rate, Calories Burned, Calories Consumed, Steps, and Sleep.
- **Activity & Nutrition Charting**: Multi-series area chart visualizing steps, calories burned, and calories consumed over the last 7 days.
- **Activity Logging**: Log workouts (Running, Cycling, Yoga, Swimming, Weightlifting, Sleep) with duration, calories burned, and steps.
- **Meal & Nutrition Tracking**: Log meals with calorie count and macronutrient specifications (Protein, Carbs, Fat) to monitor energy intake.
- **Workout Planning**: Schedule future workouts and visualize planned activities.
- **Aesthetic Dark Mode Interface**: Premium dark-mode user interface built with customized modern CSS animations, card hover effects, and responsive layout structures.

---

## Tech Stack

### Frontend
- **React 18** (TypeScript, Vite)
- **Recharts** (Interactive charting library)
- **Lucide React** (Modern iconography)
- **Vanilla CSS** (Responsive custom dashboard styling)

### Backend
- **Node.js** & **Express** (TypeScript, `tsx` hot reloading)
- **PostgreSQL** (Relational database)
- **CORS**, **Dotenv**, `pg` pool connector

---

## Database Schema

The application uses three primary PostgreSQL tables:

### 1. `users`
Tracks user credentials (uses a default `testuser` for local development).
- `id` (SERIAL, Primary Key)
- `username` (VARCHAR, Unique)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### 2. `activities`
Logs user workouts and sleep details.
- `id` (SERIAL, Primary Key)
- `user_id` (FOREIGN KEY -> users.id)
- `type` (VARCHAR) - *e.g., running, cycling, sleep*
- `duration_minutes` (INTEGER)
- `calories_burned` (INTEGER)
- `steps` (INTEGER)
- `date` (DATE)

### 3. `nutrition`
Logs user meals and macronutrient distributions.
- `id` (SERIAL, Primary Key)
- `user_id` (FOREIGN KEY -> users.id)
- `meal_name` (VARCHAR)
- `calories` (INTEGER)
- `protein_g` (DECIMAL)
- `carbs_g` (DECIMAL)
- `fat_g` (DECIMAL)
- `date` (DATE)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Running on localhost:5432)

---

### Local Installation & Setup

#### 1. Clone the project and navigate to the directory
```bash
cd "personal health tracker"
```

#### 2. Database Setup
Ensure PostgreSQL is running on port `5432`. Create a database named `health_tracker`. 

To configure database credentials, you can set environmental variables or create a `.env` file in the `server` directory:
```env
PORT=5001
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=health_tracker
```

#### 3. Initialize database tables
Navigate to the server directory, install dependencies, and run the schema setup script:
```bash
cd server
npm install
npx tsx src/initDb.ts
```

---

### Running the Project

To run both the server and client dev environments:

#### Start the Backend Server (from the `server` directory)
```bash
npm run dev
# Server runs on http://localhost:5001
```

#### Start the Frontend Client (from the `client` directory)
Open a new terminal session, navigate to the `client` folder, install dependencies, and start Vite:
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Now, open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## API Documentation

### Activities Endpoints
- **GET** `/api/activities`: Fetch recent workout and sleep activity logs.
- **POST** `/api/activities`: Create a new activity entry.
  - Body: `{"type": "running", "duration_minutes": 30, "calories_burned": 250, "steps": 5000, "date": "YYYY-MM-DD"}`

### Nutrition Endpoints
- **GET** `/api/nutrition`: Fetch recent logged meals.
- **POST** `/api/nutrition`: Log a new meal/food entry.
  - Body: `{"meal_name": "Chicken Salad", "calories": 400, "protein_g": 30, "carbs_g": 10, "fat_g": 15, "date": "YYYY-MM-DD"}`

### Analytics Endpoints
- **GET** `/api/metrics`: Retrieve aggregated steps, calories burned, and calories consumed grouped by day for the last 7 days.
- **GET** `/api/health`: Basic API health status check.
