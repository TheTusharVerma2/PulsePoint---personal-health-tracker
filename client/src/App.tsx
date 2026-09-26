import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  Apple,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Dumbbell,
  Flame,
  Footprints,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AuthModal } from './components/AuthModal';
import { LogActivityModal } from './components/LogActivityModal';
import { LogMealModal } from './components/LogMealModal';
import {
  exportActivitiesCSV,
  exportNutritionCSV,
  exportReportToPDF,
} from './utils/exportUtils';

const API_URL = 'http://localhost:5001/api';

type View = 'today' | 'activity' | 'meals' | 'trends' | 'profile';
type ActivityFilter = 'all' | 'workouts' | 'sleep';
type TrendMetric = 'calories' | 'steps';
type ThemePreference = 'system' | 'light' | 'dark';

type User = {
  username: string;
  email: string;
};

type ActivityLog = {
  id: number;
  type: string;
  duration_minutes: number;
  calories_burned: number;
  steps: number;
  date: string;
  created_at?: string;
};

type Meal = {
  id: number;
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  date: string;
  created_at?: string;
};

type Goals = {
  daily_step_goal: number;
  daily_calorie_burn_goal: number;
  daily_calorie_intake_goal: number;
  daily_protein_goal: number;
};

type Metrics = {
  last7Days: Array<{
    name: string;
    date: string;
    calories: number;
    calories_consumed: number;
    steps: number;
  }>;
  monthlySummary: {
    total_calories_burned: number;
    total_steps: number;
    avg_workout_duration: number;
  };
};

const defaultGoals: Goals = {
  daily_step_goal: 10000,
  daily_calorie_burn_goal: 2000,
  daily_calorie_intake_goal: 2200,
  daily_protein_goal: 120,
};

const emptyMetrics: Metrics = {
  last7Days: [],
  monthlySummary: {
    total_calories_burned: 0,
    total_steps: 0,
    avg_workout_duration: 0,
  },
};

const numberValue = (value: unknown) => Number(value || 0);

const dateKey = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const changeDate = (date: string, days: number) => {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
};

const longDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const shortDate = (value: string) =>
  new Date(`${dateKey(value)}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const activityIcon = (type: string) =>
  type === 'sleep' ? <Moon /> : <Dumbbell />;

function ProgressCard({
  label,
  value,
  goal,
  unit,
  color,
  icon,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  icon: ReactNode;
}) {
  const progress = Math.min(100, Math.round((value / Math.max(goal, 1)) * 100));

  return (
    <article className="progress-card">
      <div className="progress-card__top">
        <span
          className="metric-icon"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <strong>
        {value.toLocaleString()}
        <small>
          {' '}
          / {goal.toLocaleString()} {unit}
        </small>
      </strong>

      <div className="progress-track" aria-label={`${label}: ${progress}% complete`}>
        <span style={{ width: `${progress}%`, backgroundColor: color }} />
      </div>

      <p>
        {progress >= 100
          ? 'Goal reached'
          : `${Math.max(0, goal - value).toLocaleString()} ${unit} to go`}
      </p>
    </article>
  );
}

function App() {
  const [view, setView] = useState<View>('today');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('calories');
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('pulsepoint_token'),
  );

  const [user, setUser] = useState<User | null>(() =>
    JSON.parse(localStorage.getItem('pulsepoint_user') || 'null'),
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const savedTheme = localStorage.getItem('pulsepoint_theme');
    return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'system';
  });

  const handleLogout = () => {
    localStorage.removeItem('pulsepoint_token');
    localStorage.removeItem('pulsepoint_user');
    setActivities([]);
    setMeals([]);
    setGoals(defaultGoals);
    setMetrics(emptyMetrics);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      if (!hash && !search) return;

      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const searchParams = new URLSearchParams(search);

      const accessToken = params.get('access_token');
      const idToken = params.get('id_token') || searchParams.get('credential');

      if (accessToken || idToken) {
        try {
          const body: any = {};
          if (idToken) body.credential = idToken;
          if (accessToken) {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
              const profile = await res.json();
              body.email = profile.email;
              body.googleId = profile.sub;
              body.name = profile.name;
            }
          }

          const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();

          if (res.ok && data.token) {
            localStorage.setItem('pulsepoint_token', data.token);
            localStorage.setItem('pulsepoint_user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            setNotice(`Welcome back, ${data.user.username}! Signed in with Google.`);
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [activitiesResponse, mealsResponse, goalsResponse, metricsResponse] =
        await Promise.all(
          ['activities', 'nutrition', 'goals', 'metrics'].map((path) =>
            fetch(`${API_URL}/${path}`, { headers: authHeaders() }),
          ),
        );

      if (
        ![
          activitiesResponse,
          mealsResponse,
          goalsResponse,
          metricsResponse,
        ].every((response) => response.ok)
      ) {
        throw new Error('We could not refresh your health data.');
      }

      const [nextActivities, nextMeals, nextGoals, nextMetrics] =
        await Promise.all([
          activitiesResponse.json(),
          mealsResponse.json(),
          goalsResponse.json(),
          metricsResponse.json(),
        ]);

      setActivities(nextActivities);
      setMeals(nextMeals);
      setGoals({ ...defaultGoals, ...nextGoals });
      setMetrics(nextMetrics);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while loading your data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = themePreference === 'system'
      ? systemPrefersDark ? 'dark' : 'light'
      : themePreference;

    document.documentElement.dataset.theme = resolvedTheme;
    localStorage.setItem('pulsepoint_theme', themePreference);
  }, [themePreference]);

  const day = useMemo(() => {
    const dateActivities = activities.filter(
      (activity) => dateKey(activity.date) === selectedDate,
    );

    const dateMeals = meals.filter(
      (meal) => dateKey(meal.date) === selectedDate,
    );

    const workouts = dateActivities.filter(
      (activity) => activity.type !== 'sleep',
    );

    const sleepSessions = dateActivities.filter(
      (activity) => activity.type === 'sleep',
    );

    return {
      activities: dateActivities,
      meals: dateMeals,
      steps: dateActivities.reduce(
        (total, activity) => total + numberValue(activity.steps),
        0,
      ),
      caloriesBurned: workouts.reduce(
        (total, activity) => total + numberValue(activity.calories_burned),
        0,
      ),
      activeMinutes: workouts.reduce(
        (total, activity) => total + numberValue(activity.duration_minutes),
        0,
      ),
      sleepHours:
        sleepSessions.reduce(
          (total, activity) => total + numberValue(activity.duration_minutes),
          0,
        ) / 60,
      caloriesConsumed: dateMeals.reduce(
        (total, meal) => total + numberValue(meal.calories),
        0,
      ),
      protein: dateMeals.reduce(
        (total, meal) => total + numberValue(meal.protein_g),
        0,
      ),
      carbs: dateMeals.reduce(
        (total, meal) => total + numberValue(meal.carbs_g),
        0,
      ),
      fat: dateMeals.reduce(
        (total, meal) => total + numberValue(meal.fat_g),
        0,
      ),
    };
  }, [activities, meals, selectedDate]);

  const readiness = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        Math.min(40, (day.sleepHours / 8) * 40) +
          Math.min(
            30,
            (day.steps / Math.max(goals.daily_step_goal, 1)) * 30,
          ) +
          30 -
          (day.activeMinutes > 90 ? 10 : 0),
      ),
    ),
  );

  const recentEntries = [
    ...day.activities.map((activity) => ({
      ...activity,
      entryType: 'activity' as const,
      label: activity.type,
    })),
    ...day.meals.map((meal) => ({
      ...meal,
      entryType: 'meal' as const,
      label: meal.meal_name,
    })),
  ].sort((first, second) =>
    String(second.created_at || '').localeCompare(String(first.created_at || '')),
  );

  const loggedDates = new Set(
    [...activities, ...meals].map((entry) => dateKey(entry.date)),
  );

  let streakDays = 0;
  let streakDate = todayISO();

  while (loggedDates.has(streakDate)) {
    streakDays += 1;
    streakDate = changeDate(streakDate, -1);
  }

  const workoutCount = activities.filter(
    (activity) => activity.type !== 'sleep',
  ).length;

  const allTimeSteps = activities.reduce(
    (total, activity) => total + numberValue(activity.steps),
    0,
  );

  const milestones = [
    {
      title: '3 Day Momentum',
      description: 'Log health data for 3 consecutive days.',
      unlocked: streakDays >= 3,
    },
    {
      title: '7 Day Warrior',
      description: 'Log health data for 7 consecutive days.',
      unlocked: streakDays >= 7,
    },
    {
      title: '10K Step Club',
      description: 'Reach 10,000 total steps.',
      unlocked: allTimeSteps >= 10000,
    },
    {
      title: 'Fitness Enthusiast',
      description: 'Log 5 workout sessions.',
      unlocked: workoutCount >= 5,
    },
    {
      title: 'Nutrition Habit',
      description: 'Log 10 meals.',
      unlocked: meals.length >= 10,
    },
  ];

  const openLog = (type: 'activity' | 'meal') => {
    setQuickAddOpen(false);

    if (type === 'activity') {
      setActivityModalOpen(true);
      return;
    }

    setMealModalOpen(true);
  };

  const saveActivity = async (payload: Omit<ActivityLog, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setNotice('Could not save activity. Please try again.');
        return false;
      }

      const savedActivity: ActivityLog = await response.json();

      setActivities((currentActivities) => [
        savedActivity,
        ...currentActivities,
      ]);

      setNotice('Activity saved');
      void loadData();
      return true;
    } catch {
      setNotice('Could not save activity. Please try again.');
      return false;
    }
  };

  const saveMeal = async (payload: Omit<Meal, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setNotice('Could not save meal. Please try again.');
        return false;
      }

      const savedMeal: Meal = await response.json();

      setMeals((currentMeals) => [
        savedMeal,
        ...currentMeals,
      ]);

      setNotice('Meal saved');
      void loadData();
      return true;
    } catch {
      setNotice('Could not save meal. Please try again.');
      return false;
    }
  };

  const deleteEntry = async (
    endpoint: 'activities' | 'nutrition',
    id: number,
  ) => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) {
      return;
    }

    const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      setNotice('Could not delete this entry. Please try again.');
      return;
    }

    setNotice('Entry deleted');
    loadData();
  };

  const saveGoals = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await fetch(`${API_URL}/goals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(goals),
    });

    if (!response.ok) {
      setNotice('Could not save goals. Please try again.');
      return;
    }

    setGoals(await response.json());
    setNotice('Goals saved');
  };

  const DateControl = () => (
    <div className="date-control" aria-label="Selected date">
      <button
        aria-label="Previous day"
        onClick={() => setSelectedDate(changeDate(selectedDate, -1))}
      >
        <ChevronLeft />
      </button>

      <label className="date-control__input">
        <CalendarDays />
        <input
          type="date"
          value={selectedDate}
          max={todayISO()}
          aria-label="Choose date"
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </label>

      <button
        aria-label="Next day"
        disabled={selectedDate >= todayISO()}
        onClick={() => setSelectedDate(changeDate(selectedDate, 1))}
      >
        <ChevronRight />
      </button>
    </div>
  );

  const renderToday = () => (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">{longDate(selectedDate)}</p>
          <h1>
            {selectedDate === todayISO()
              ? `Good day${user ? `, ${user.username}` : ''}`
              : 'Your day at a glance'}
          </h1>
          <p>Small actions add up. Here is your progress for the day.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {!user && (
            <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem' }}>
              <button
                className="button button--secondary"
                onClick={() => openAuthModal('login')}
              >
                Log In
              </button>
              <button
                className="button button--primary"
                onClick={() => openAuthModal('register')}
              >
                Register
              </button>
            </div>
          )}
          <DateControl />
        </div>
      </section>

      <section className="progress-grid">
        <ProgressCard
          label="Movement"
          value={day.caloriesBurned}
          goal={goals.daily_calorie_burn_goal}
          unit="kcal"
          color="#D85C4A"
          icon={<Flame />}
        />

        <ProgressCard
          label="Steps"
          value={day.steps}
          goal={goals.daily_step_goal}
          unit="steps"
          color="#287A52"
          icon={<Footprints />}
        />

        <ProgressCard
          label="Sleep"
          value={Number(day.sleepHours.toFixed(1))}
          goal={8}
          unit="hrs"
          color="#5E67B1"
          icon={<Moon />}
        />
      </section>

      <section className="today-grid">
        <article className="surface readiness">
          <div>
            <p className="eyebrow">Daily readiness</p>

            <strong>
              {readiness}
              <small>/100</small>
            </strong>

            <p>
              {readiness >= 80
                ? 'You look ready for a normal training day.'
                : readiness >= 60
                  ? 'A balanced day and moderate activity may suit you.'
                  : 'Consider making room for rest and recovery.'}
            </p>
          </div>

          <div
            className="readiness-ring"
            style={{ '--score': `${readiness * 3.6}deg` } as CSSProperties}
          >
            <span>
              {readiness >= 80
                ? 'Ready'
                : readiness >= 60
                  ? 'Steady'
                  : 'Recover'}
            </span>
          </div>

          <small>
            Based on logged sleep, activity, and goal progress. Not medical advice.
          </small>
        </article>

        <article className="surface insight">
          <div className="section-title">
            <span>
              <Sparkles />
              Today’s focus
            </span>
          </div>

          <h2>
            {day.protein >= goals.daily_protein_goal
              ? 'Protein goal reached'
              : day.meals.length === 0
                ? 'Start with a meal'
                : 'Keep protein in mind'}
          </h2>

          <p>
            {day.protein >= goals.daily_protein_goal
              ? `You have logged ${Math.round(day.protein)}g of protein today.`
              : day.meals.length === 0
                ? 'Log your first meal to see your nutrition progress.'
                : `${Math.max(
                    0,
                    Math.round(goals.daily_protein_goal - day.protein),
                  )}g of protein remains in your daily goal.`}
          </p>

          <button className="text-button" onClick={() => setView('meals')}>
            View meals
          </button>
        </article>
      </section>

      <section className="surface entries">
        <div className="section-title">
          <h2>Today’s entries</h2>
          <button
            className="text-button"
            onClick={() => setView(day.activities.length ? 'activity' : 'meals')}
          >
            View all
          </button>
        </div>

        {recentEntries.length ? (
          <div className="entry-list">
            {recentEntries.slice(0, 4).map((entry) => (
              <div className="entry" key={`${entry.entryType}-${entry.id}`}>
                <span className={`entry-icon ${entry.entryType}`}>
                  {entry.entryType === 'meal'
                    ? <Apple />
                    : activityIcon(entry.type)}
                </span>

                <div>
                  <strong>{entry.label}</strong>
                  <p>
                    {entry.entryType === 'meal'
                      ? `${entry.calories} kcal · ${entry.protein_g}g protein`
                      : `${entry.duration_minutes} min${
                          entry.steps
                            ? ` · ${entry.steps.toLocaleString()} steps`
                            : ''
                        }`}
                  </p>
                </div>

                <span>
                  {entry.entryType === 'meal'
                    ? `${entry.calories} kcal`
                    : entry.type === 'sleep'
                      ? `${(entry.duration_minutes / 60).toFixed(1)} hrs`
                      : `${entry.calories_burned} kcal`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <CalendarDays />
            <p>Nothing logged for this day yet.</p>
            <button
              className="button button--secondary"
              onClick={() => setQuickAddOpen(true)}
            >
              <Plus />
              Add an entry
            </button>
          </div>
        )}
      </section>
    </>
  );

  const renderActivity = () => {
    const dailyActivities = activities.filter(
      (activity) => dateKey(activity.date) === selectedDate,
    );
    const visibleActivities = dailyActivities.filter((activity) => {
      if (activityFilter === 'workouts') {
        return activity.type !== 'sleep';
      }

      if (activityFilter === 'sleep') {
        return activity.type === 'sleep';
      }

      return true;
    });

    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Activity history</p>
            <h1>Move in your own way</h1>
            <p>{longDate(selectedDate)}</p>
          </div>

          <div className="page-actions">
            <DateControl />

            <button className="button" onClick={() => openLog('activity')}>
              <Plus />
              Add activity
            </button>
          </div>
        </section>

        <section className="summary-strip">
          <span>
            <Footprints />
            <b>{day.steps.toLocaleString()}</b> steps
          </span>
          <span>
            <Flame />
            <b>{day.caloriesBurned}</b> kcal burned
          </span>
          <span>
            <Activity />
            <b>{day.activeMinutes}</b> active min
          </span>
          <span>
            <Moon />
            <b>{day.sleepHours.toFixed(1)}</b> hours sleep
          </span>
        </section>

        <div className="filter-control" role="group" aria-label="Activity filter">
          {[
            ['all', 'All'],
            ['workouts', 'Workouts'],
            ['sleep', 'Sleep'],
          ].map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              className={activityFilter === filter ? 'active' : ''}
              onClick={() => setActivityFilter(filter as ActivityFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        <ActivityList
          items={visibleActivities}
          onDelete={(id) => deleteEntry('activities', id)}
          onAdd={() => openLog('activity')}
        />
      </>
    );
  };

  const renderMeals = () => {
    const dailyMeals = meals.filter(
      (meal) => dateKey(meal.date) === selectedDate,
    );

    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Nutrition</p>
            <h1>Food for your day</h1>
            <p>{longDate(selectedDate)}</p>
          </div>

          <div className="page-actions">
            <DateControl />

            <button className="button" onClick={() => openLog('meal')}>
              <Plus />
              Add meal
            </button>
          </div>
        </section>

        <section className="nutrition-summary surface">
          <div>
            <p className="eyebrow">Energy</p>
            <strong>
              {day.caloriesConsumed.toLocaleString()}
              <small>
                {' '}
                / {goals.daily_calorie_intake_goal.toLocaleString()} kcal
              </small>
            </strong>

            <div className="progress-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    (day.caloriesConsumed / goals.daily_calorie_intake_goal) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="macro-list">
            {[
              ['Protein', day.protein, 'protein'],
              ['Carbohydrates', day.carbs, 'carbs'],
              ['Fat', day.fat, 'fat'],
            ].map(([label, value, tone]) => {
              const totalMacros = Math.max(day.protein + day.carbs + day.fat, 1);
              const percentage = (Number(value) / totalMacros) * 100;

              return (
                <div className="macro" key={String(label)}>
                  <span>{String(label)}</span>
                  <b>{Math.round(Number(value))}g</b>
                  <i>
                    <span className={String(tone)} style={{ width: `${percentage}%` }} />
                  </i>
                </div>
              );
            })}
          </div>
        </section>

        <MealList
          items={dailyMeals}
          onDelete={(id) => deleteEntry('nutrition', id)}
          onAdd={() => openLog('meal')}
        />
      </>
    );
  };

  const hasTrendData = metrics.last7Days.some((trendDay) =>
    trendMetric === 'calories'
      ? Number(trendDay.calories) > 0 || Number(trendDay.calories_consumed) > 0
      : Number(trendDay.steps) > 0,
  );

  const renderTrends = () => (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Last 7 days</p>
          <h1>Notice your patterns</h1>
          <p>Your activity and nutrition summary over the past week.</p>
        </div>

        <div className="export-actions">
          <button
            className="button button--secondary"
            onClick={() => exportActivitiesCSV(activities)}
          >
            <Download />
            Activity CSV
          </button>

          <button
            className="button button--secondary"
            onClick={() => exportNutritionCSV(meals)}
          >
            <Download />
            Meals CSV
          </button>
        </div>
      </section>

      <div className="filter-control" role="group" aria-label="Trend metric">
        <button
          type="button"
          className={trendMetric === 'calories' ? 'active' : ''}
          onClick={() => setTrendMetric('calories')}
        >
          Calories
        </button>
        <button
          type="button"
          className={trendMetric === 'steps' ? 'active' : ''}
          onClick={() => setTrendMetric('steps')}
        >
          Steps
        </button>
      </div>

      <section id="pdf-report-container" className="surface chart-card">
        <div className="section-title">
          <div>
            <h2>
              {trendMetric === 'calories'
                ? 'Calories burned and consumed'
                : 'Daily steps'}
            </h2>
            <p>
              {trendMetric === 'calories'
                ? 'Compare activity calories with food calories for each day.'
                : 'Your logged steps for each day.'}
            </p>
          </div>

          <button
            className="text-button"
            onClick={() => exportReportToPDF('pdf-report-container')}
          >
            Create PDF
          </button>
        </div>

        {hasTrendData ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.last7Days}>
                <defs>
                  <linearGradient id="burn" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#D85C4A" stopOpacity=".3" />
                    <stop offset="1" stopColor="#D85C4A" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="steps" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#287A52" stopOpacity=".3" />
                    <stop offset="1" stopColor="#287A52" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="#E6EAE4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />

                {trendMetric === 'calories' ? (
                  <>
                    <Area type="monotone" dataKey="calories" name="Burned" stroke="#D85C4A" fill="url(#burn)" strokeWidth={2} />
                    <Area type="monotone" dataKey="calories_consumed" name="Consumed" stroke="#B56A15" fill="none" strokeWidth={2} />
                  </>
                ) : (
                  <Area type="monotone" dataKey="steps" name="Steps" stroke="#287A52" fill="url(#steps)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty">
            <BarChart3 />
            <p>No {trendMetric} data has been logged in the last seven days.</p>
          </div>
        )}
      </section>

      <section className="summary-grid">
        <article className="surface">
          <span>Movement</span>
          <strong>
            {numberValue(metrics.monthlySummary.total_calories_burned).toLocaleString()}
            <small> kcal / 30 days</small>
          </strong>
        </article>

        <article className="surface">
          <span>Steps</span>
          <strong>
            {numberValue(metrics.monthlySummary.total_steps).toLocaleString()}
            <small> / 30 days</small>
          </strong>
        </article>

        <article className="surface">
          <span>Typical session</span>
          <strong>
            {Math.round(
              numberValue(metrics.monthlySummary.avg_workout_duration),
            )}
            <small> minutes</small>
          </strong>
        </article>
      </section>
    </>
  );

  const renderProfile = () => (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Profile and preferences</p>
          <h1>Set your daily goals</h1>
          <p>Goals are personal. You can adjust them whenever you need.</p>
        </div>
      </section>

      <form className="surface goals-form" onSubmit={saveGoals}>
        <h2>Daily goals</h2>

        {[
          ['Steps', 'daily_step_goal', 'steps'],
          ['Activity calories', 'daily_calorie_burn_goal', 'kcal'],
          ['Food calories', 'daily_calorie_intake_goal', 'kcal'],
          ['Protein', 'daily_protein_goal', 'g'],
        ].map(([label, key, unit]) => (
          <label key={key}>
            <span>{label}</span>

            <div>
              <input
                type="number"
                min="0"
                value={goals[key as keyof Goals]}
                onChange={(event) =>
                  setGoals({
                    ...goals,
                    [key]: Number(event.target.value),
                  })
                }
              />
              <small>{unit}</small>
            </div>
          </label>
        ))}

        <button className="button" type="submit">
          Save goals
        </button>
      </form>

      <section className="summary-grid">
        <article className="surface">
          <span>Current streak</span>
          <strong>
            {streakDays}
            <small> day{streakDays === 1 ? '' : 's'}</small>
          </strong>
        </article>

        <article className="surface">
          <span>Workouts logged</span>
          <strong>
            {workoutCount}
            <small> all time</small>
          </strong>
        </article>

        <article className="surface">
          <span>Meals logged</span>
          <strong>
            {meals.length}
            <small> all time</small>
          </strong>
        </article>
      </section>

      <section className="surface entries">
        <div className="section-title">
          <h2>Milestones</h2>
          <span>{milestones.filter((milestone) => milestone.unlocked).length} unlocked</span>
        </div>

        <div className="entry-list">
          {milestones.map((milestone) => (
            <div className="entry" key={milestone.title}>
              <span
                className="entry-icon"
                style={{
                  color: milestone.unlocked ? '#B56A15' : 'var(--text-muted)',
                  background: milestone.unlocked ? '#FFF4E7' : 'var(--soft)',
                }}
              >
                ★
              </span>

              <div>
                <strong>{milestone.title}</strong>
                <p>{milestone.description}</p>
              </div>

              <span>{milestone.unlocked ? 'Unlocked' : 'In progress'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface preferences">
        <h2>Appearance</h2>
        <p>Choose the color mode that feels best for you.</p>

        <div className="theme-options" role="group" aria-label="Appearance preference">
          {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
            <button
              className={themePreference === option ? 'active' : ''}
              key={option}
              type="button"
              onClick={() => setThemePreference(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="surface account">
        <h2>Account</h2>

        <p>
          {user
            ? `${user.username} · ${user.email}`
            : 'You are using demo mode.'}
        </p>

        {user ? (
          <button
            className="button button--secondary"
            onClick={handleLogout}
          >
            <LogOut />
            Sign out
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="button button--secondary"
              onClick={() => openAuthModal('login')}
            >
              Log In
            </button>
            <button
              className="button button--primary"
              onClick={() => openAuthModal('register')}
            >
              Register
            </button>
          </div>
        )}
      </section>
    </>
  );

  const navigationItems: Array<{
    id: View;
    label: string;
    icon: ReactNode;
  }> = [
    { id: 'today', label: 'Today', icon: <Activity /> },
    { id: 'activity', label: 'Activity', icon: <Dumbbell /> },
    { id: 'meals', label: 'Meals', icon: <Utensils /> },
    { id: 'trends', label: 'Trends', icon: <BarChart3 /> },
  ];

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">
          <span>
            <Activity />
          </span>
          PulsePoint
        </div>

        <nav>
          {navigationItems.map((item) => (
            <button
              className={view === item.id ? 'active' : ''}
              onClick={() => setView(item.id)}
              key={item.id}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {user ? (
          <button className="profile-nav" onClick={() => setView('profile')}>
            <span>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
            <small>{user.username}</small>
            <Settings />
          </button>
        ) : (
          <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demo Mode</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="button button--secondary" style={{ flex: 1, justifyContent: 'center', padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => openAuthModal('login')}>
                Log In
              </button>
              <button className="button button--primary" style={{ flex: 1, justifyContent: 'center', padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => openAuthModal('register')}>
                Register
              </button>
            </div>
          </div>
        )}
      </aside>

      <main>
        <header className="mobile-header">
          <div className="brand">
            <span>
              <Activity />
            </span>
            PulsePoint
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!user && (
              <>
                <button className="button button--secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openAuthModal('login')}>
                  Log In
                </button>
                <button className="button button--primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openAuthModal('register')}>
                  Register
                </button>
              </>
            )}
            <button aria-label="Open profile" onClick={() => setView('profile')}>
              {user?.username?.[0]?.toUpperCase() || 'D'}
            </button>
          </div>
        </header>

        {error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="button button--secondary" onClick={loadData}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="loading">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            {view === 'today' && renderToday()}
            {view === 'activity' && renderActivity()}
            {view === 'meals' && renderMeals()}
            {view === 'trends' && renderTrends()}
            {view === 'profile' && renderProfile()}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {navigationItems.slice(0, 2).map((item) => (
          <button
            className={view === item.id ? 'active' : ''}
            onClick={() => setView(item.id)}
            key={item.id}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <button
          className="add-button"
          aria-label="Add entry"
          onClick={() => setQuickAddOpen(true)}
        >
          <Plus />
        </button>

        {navigationItems.slice(2).map((item) => (
          <button
            className={view === item.id ? 'active' : ''}
            onClick={() => setView(item.id)}
            key={item.id}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {quickAddOpen && (
        <div
          className="sheet-backdrop"
          onMouseDown={() => setQuickAddOpen(false)}
        >
          <section
            className="quick-add"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close quick add"
              onClick={() => setQuickAddOpen(false)}
            >
              <X />
            </button>

            <p className="eyebrow">Quick add</p>
            <h2>What would you like to log?</h2>

            <button onClick={() => openLog('activity')}>
              <Dumbbell />
              <span>
                <b>Activity</b>
                <small>Workout, steps, or sleep</small>
              </span>
            </button>

            <button onClick={() => openLog('meal')}>
              <Utensils />
              <span>
                <b>Meal</b>
                <small>Food and nutrition</small>
              </span>
            </button>
          </section>
        </div>
      )}

      {notice && (
        <div className="toast" onAnimationEnd={() => setNotice('')}>
          {notice}
        </div>
      )}

      <LogActivityModal
        isOpen={activityModalOpen}
        initialDate={selectedDate}
        onClose={() => setActivityModalOpen(false)}
        onSave={saveActivity}
      />

      <LogMealModal
        isOpen={mealModalOpen}
        initialDate={selectedDate}
        onClose={() => setMealModalOpen(false)}
        onSave={saveMeal}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        API_URL={API_URL}
        onSuccess={(nextToken, nextUser) => {
          setActivities([]);
          setMeals([]);
          setGoals(defaultGoals);
          setMetrics(emptyMetrics);
          setToken(nextToken);
          setUser(nextUser);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}

function ActivityList({
  items,
  onDelete,
  onAdd,
}: {
  items: ActivityLog[];
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
  return (
    <section className="surface entries">
      <div className="section-title">
        <h2>Logged activity</h2>
      </div>

      {items.length ? (
        <div className="entry-list">
          {items.map((activity) => (
            <div className="entry" key={activity.id}>
              <span className="entry-icon activity">
                {activityIcon(activity.type)}
              </span>

              <div>
                <strong>
                  {activity.type[0].toUpperCase() + activity.type.slice(1)}
                </strong>
                <p>
                  {activity.duration_minutes} min · {shortDate(activity.date)}
                </p>
              </div>

              <span>
                {activity.type === 'sleep'
                  ? `${(activity.duration_minutes / 60).toFixed(1)} hrs`
                  : `${activity.calories_burned} kcal`}
              </span>

              <button
                className="icon-button"
                aria-label={`Delete ${activity.type}`}
                onClick={() => onDelete(activity.id)}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Dumbbell />
          <p>No activity logged for this day.</p>
          <button className="button button--secondary" onClick={onAdd}>
            <Plus />
            Add activity
          </button>
        </div>
      )}
    </section>
  );
}

function MealList({
  items,
  onDelete,
  onAdd,
}: {
  items: Meal[];
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
  return (
    <section className="surface entries">
      <div className="section-title">
        <h2>Meals logged</h2>
      </div>

      {items.length ? (
        <div className="entry-list">
          {items.map((meal) => (
            <div className="entry" key={meal.id}>
              <span className="entry-icon meal">
                <Apple />
              </span>

              <div>
                <strong>{meal.meal_name}</strong>
                <p>
                  {meal.protein_g}g protein · {meal.carbs_g}g carbs ·{' '}
                  {meal.fat_g}g fat
                </p>
              </div>

              <span>{meal.calories} kcal</span>

              <button
                className="icon-button"
                aria-label={`Delete ${meal.meal_name}`}
                onClick={() => onDelete(meal.id)}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Utensils />
          <p>No meals logged for this day.</p>
          <button className="button button--secondary" onClick={onAdd}>
            <Plus />
            Add meal
          </button>
        </div>
      )}
    </section>
  );
}

export default App;
