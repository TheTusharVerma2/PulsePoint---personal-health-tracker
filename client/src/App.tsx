import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Moon, 
  Plus, 
  Utensils,
  Trash2,
  FileSpreadsheet,
  Download,
  Sparkles,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { Navbar } from './components/Navbar';
import { ActivityRings } from './components/ActivityRings';
import { ReadinessGauge } from './components/ReadinessGauge';
import { LogActivityModal } from './components/LogActivityModal';
import { LogMealModal } from './components/LogMealModal';
import { AuthModal } from './components/AuthModal';
import { MilestonesModal } from './components/MilestonesModal';
import { generateHealthInsights, HealthInsight } from './utils/insightsEngine';
import { exportActivitiesCSV, exportNutritionCSV, exportReportToPDF } from './utils/exportUtils';

const API_URL = 'http://localhost:5001/api';

const ActivityItemCard: React.FC<{ act: any; onDelete: (id: number) => void }> = ({ act, onDelete }) => {
  const iconBg = act.type === 'sleep' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  const iconCol = act.type === 'sleep' ? '#8b5cf6' : '#10b981';
  const burnStr = act.calories_burned > 0 ? ' • ' + act.calories_burned + ' kcal' : '';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        borderRadius: '0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-glass)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: iconBg,
            color: iconCol,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {act.type === 'sleep' ? <Moon size={18} /> : <Flame size={18} />}
        </div>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>{act.type}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {act.duration_minutes + ' min' + burnStr}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <button className="btn-delete" onClick={() => onDelete(act.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const MealItemCard: React.FC<{ meal: any; onDelete: (id: number) => void }> = ({ meal, onDelete }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.15rem 1.5rem',
        borderRadius: '0.85rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-glass)'
      }}
    >
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{meal.meal_name}</h4>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--neon-amber)', fontWeight: 600 }}>P: {meal.protein_g}g</span>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>C: {meal.carbs_g}g</span>
          <span style={{ color: 'var(--neon-coral)', fontWeight: 600 }}>F: {meal.fat_g}g</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{meal.calories} kcal</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {new Date(meal.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <button className="btn-delete" onClick={() => onDelete(meal.id)}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

function App() {
  const [activities, setActivities] = useState<any[]>([]);
  const [metricsData, setMetricsData] = useState<any>({ last7Days: [], macros: {}, monthlySummary: {} });
  const [nutrition, setNutrition] = useState<any[]>([]);
  const [goals, setGoals] = useState<any>({
    daily_step_goal: 10000,
    daily_calorie_burn_goal: 2000,
    daily_calorie_intake_goal: 2200,
    daily_protein_goal: 120
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem('pulsepoint_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('pulsepoint_user') || 'null'));

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  const [goalsFormData, setGoalsFormData] = useState({
    daily_step_goal: 10000,
    daily_calorie_burn_goal: 2000,
    daily_calorie_intake_goal: 2200,
    daily_protein_goal: 120
  });

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }
    return headers;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const [activitiesRes, metricsRes, nutritionRes, goalsRes] = await Promise.all([
        fetch(API_URL + '/activities', { headers }),
        fetch(API_URL + '/metrics', { headers }),
        fetch(API_URL + '/nutrition', { headers }),
        fetch(API_URL + '/goals', { headers })
      ]);

      const activitiesData = await activitiesRes.json();
      const metricsResp = await metricsRes.json();
      const nutritionData = await nutritionRes.json();
      const goalsData = await goalsRes.json();

      if (Array.isArray(activitiesData)) setActivities(activitiesData);
      if (metricsResp && metricsResp.last7Days) setMetricsData(metricsResp);
      if (Array.isArray(nutritionData)) setNutrition(nutritionData);
      if (goalsData && !goalsData.error) {
        setGoals(goalsData);
        setGoalsFormData({
          daily_step_goal: goalsData.daily_step_goal || 10000,
          daily_calorie_burn_goal: goalsData.daily_calorie_burn_goal || 2000,
          daily_calorie_intake_goal: goalsData.daily_calorie_intake_goal || 2200,
          daily_protein_goal: goalsData.daily_protein_goal || 120
        });
      }
    } catch (error) {
      console.error('Error fetching biometrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('pulsepoint_token');
    localStorage.removeItem('pulsepoint_user');
    setToken(null);
    setUser(null);
    fetchData();
  };

  const handleSaveActivity = async (activityPayload: any) => {
    try {
      const response = await fetch(API_URL + '/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(activityPayload)
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const handleSaveMeal = async (mealPayload: any) => {
    try {
      const response = await fetch(API_URL + '/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(mealPayload)
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to log meal:', error);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    try {
      const response = await fetch(API_URL + '/activities/' + id, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setActivities(activities.filter(a => a.id !== id));
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleDeleteNutrition = async (id: number) => {
    try {
      const response = await fetch(API_URL + '/nutrition/' + id, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setNutrition(nutrition.filter(n => n.id !== id));
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete meal log:', error);
    }
  };

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL + '/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(goalsFormData)
      });
      if (response.ok) {
        const updated = await response.json();
        setGoals(updated);
        alert('Goals & targets updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update goals:', error);
    }
  };

  const totalCaloriesBurned = activities.reduce((sum, a) => sum + Number(a.calories_burned || 0), 0);
  const totalSteps = activities.reduce((sum, a) => sum + Number(a.steps || 0), 0);
  const totalCaloriesConsumed = nutrition.reduce((sum, n) => sum + Number(n.calories || 0), 0);
  const totalProteinConsumed = nutrition.reduce((sum, n) => sum + Number(n.protein_g || 0), 0);
  const totalCarbsConsumed = nutrition.reduce((sum, n) => sum + Number(n.carbs_g || 0), 0);
  const totalFatConsumed = nutrition.reduce((sum, n) => sum + Number(n.fat_g || 0), 0);

  const sleepEntries = activities.filter(a => a.type === 'sleep');
  const avgSleep = sleepEntries.length > 0
    ? (sleepEntries.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0) / (sleepEntries.length * 60)).toFixed(1)
    : '7.5';

  const workoutMinutesTotal = activities.filter(a => a.type !== 'sleep').reduce((sum, a) => sum + Number(a.duration_minutes || 0), 0);
  const stepPct = Math.round((totalSteps / (goals.daily_step_goal || 10000)) * 100);

  const uniqueDates = Array.from(new Set([...activities.map(a => a.date), ...nutrition.map(n => n.date)]));
  const streakDays = Math.max(1, uniqueDates.length);

  const insights: HealthInsight[] = generateHealthInsights(
    activities,
    nutrition,
    metricsData.last7Days || [],
    goals
  );

  const macroChartData = [
    { name: 'Protein', value: Number(metricsData.macros?.total_protein || totalProteinConsumed || 120), color: '#f59e0b' },
    { name: 'Carbohydrates', value: Number(metricsData.macros?.total_carbs || totalCarbsConsumed || 180), color: '#06b6d4' },
    { name: 'Fats', value: Number(metricsData.macros?.total_fat || totalFatConsumed || 65), color: '#f43f5e' }
  ];

  const renderDashboard = () => (
    <div>
      <header className="top-bar">
        <div className="header-title">
          <h1>
            Welcome back, <span className="text-gradient-emerald">{user ? user.username : 'Telemetry User'}</span>
          </h1>
          <p>Real-time physical strain, metabolic balance & biometric recovery</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setIsMealModalOpen(true)}>
            <Utensils size={18} /> Log Meal
          </button>
          <button className="btn btn-primary" onClick={() => setIsActivityModalOpen(true)}>
            <Plus size={18} /> Log Activity
          </button>
        </div>
      </header>

      <div className="hero-telemetry-grid">
        <ReadinessGauge
          sleepHours={Number(avgSleep)}
          workoutMinutes={workoutMinutesTotal}
          stepPct={stepPct}
        />

        <ActivityRings
          caloriesBurned={totalCaloriesBurned}
          calorieGoal={goals.daily_calorie_burn_goal || 2000}
          steps={totalSteps}
          stepGoal={goals.daily_step_goal || 10000}
          sleepHours={Number(avgSleep)}
          sleepGoal={8}
        />
      </div>

      {insights.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--neon-emerald)', fontWeight: 700 }}>
            <Sparkles size={18} /> AI Physiological Diagnostic Engine
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {insights.map((insight) => {
              const borderCol = insight.type === 'success' ? 'var(--neon-emerald)' : insight.type === 'warning' ? 'var(--neon-amber)' : 'var(--neon-cyan)';
              return (
                <div
                  key={insight.id}
                  className="glass-card"
                  style={{ borderLeft: '4px solid ' + borderCol }}
                >
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {insight.title}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{insight.message}</p>
                  {insight.actionHint && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--neon-emerald)', fontWeight: 600 }}>
                      ⚡ {insight.actionHint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>7-Day Biometric Telemetry</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workouts, Calorie Burn vs. Intake Correlation</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--neon-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Steps</span>
              <span style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Burned</span>
              <span style={{ color: 'var(--neon-amber)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Intake</span>
            </div>
          </div>

          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsData.last7Days || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientSteps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradientBurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradientIntake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-subtle)" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-subtle)" tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-subtle)" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'var(--border-glass)', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#gradientSteps)" />
                <Area yAxisId="right" type="monotone" dataKey="calories" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#gradientBurn)" />
                <Area yAxisId="right" type="monotone" dataKey="calories_consumed" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#gradientIntake)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Recent Telemetry</h3>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setCurrentView('schedule')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', maxHeight: '300px' }}>
            {activities.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>No telemetry logs recorded.</div>
            ) : (
              activities.slice(0, 5).map((act) => (
                <ActivityItemCard key={act.id} act={act} onDelete={handleDeleteActivity} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNutrition = () => (
    <div>
      <header className="top-bar">
        <div className="header-title">
          <h1>
            Macronutrient <span className="text-gradient-amber">Nutrition Lab</span>
          </h1>
          <p>Caloric intake, macro distribution dials, and meal tracking</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => exportNutritionCSV(nutrition)}>
            <FileSpreadsheet size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsMealModalOpen(true)}>
            <Plus size={18} /> Log Meal
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ENERGY</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
            {totalCaloriesConsumed} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {goals.daily_calorie_intake_goal || 2200} kcal</span>
          </h2>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: Math.min(100, Math.round((totalCaloriesConsumed / (goals.daily_calorie_intake_goal || 2200)) * 100)) + '%', height: '100%', background: 'var(--neon-emerald)' }}></div>
          </div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--neon-amber)', fontWeight: 600 }}>PROTEIN TARGET</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--neon-amber)', margin: '0.25rem 0' }}>
            {totalProteinConsumed}g <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {goals.daily_protein_goal || 120}g</span>
          </h2>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: Math.min(100, Math.round((totalProteinConsumed / (goals.daily_protein_goal || 120)) * 100)) + '%', height: '100%', background: 'var(--neon-amber)' }}></div>
          </div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>CARBOHYDRATES</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--neon-cyan)', margin: '0.25rem 0' }}>
            {totalCarbsConsumed}g
          </h2>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '65%', height: '100%', background: 'var(--neon-cyan)' }}></div>
          </div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--neon-coral)', fontWeight: 600 }}>FATS BALANCE</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--neon-coral)', margin: '0.25rem 0' }}>
            {totalFatConsumed}g
          </h2>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '45%', height: '100%', background: 'var(--neon-coral)' }}></div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Recorded Meal Entries</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
          {nutrition.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
              No meals logged yet. Click "Log Meal" to add your first nutrition entry.
            </div>
          ) : (
            nutrition.map((meal) => (
              <MealItemCard key={meal.id} meal={meal} onDelete={handleDeleteNutrition} />
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div>
      <header className="top-bar">
        <div className="header-title">
          <h1>
            Workout <span className="text-gradient-cyan">Schedule & Planner</span>
          </h1>
          <p>Schedule future workouts and monitor planned session activity</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsActivityModalOpen(true)}>
            <Plus size={18} /> Plan Workout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        {activities.length > 0 ? (
          activities.map((act) => (
            <div key={act.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '0.85rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>{act.type} SESSION</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Planned for {act.duration_minutes} minutes</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {new Date(act.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <button className="btn-delete" onClick={() => handleDeleteActivity(act.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
            <Calendar size={64} style={{ color: 'var(--neon-cyan)', opacity: 0.5, marginBottom: '1rem' }} />
            <h3>No Scheduled Activities</h3>
            <p style={{ color: 'var(--text-muted)' }}>Click "Plan Workout" to add upcoming training sessions.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div id="pdf-report-container">
      <header className="top-bar">
        <div className="header-title">
          <h1>
            Biometric <span className="text-gradient-coral">Analytics Reports</span>
          </h1>
          <p>30-day macro distribution pie breakdown and export tools</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => exportActivitiesCSV(activities)}>
            <FileSpreadsheet size={18} /> Workouts CSV
          </button>
          <button className="btn btn-secondary" onClick={() => exportNutritionCSV(nutrition)}>
            <FileSpreadsheet size={18} /> Meals CSV
          </button>
          <button className="btn btn-primary" onClick={() => exportReportToPDF('pdf-report-container')}>
            <Download size={18} /> Export PDF Report
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Macronutrient Balance Ratio</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Distribution of Protein, Carbohydrates, and Fats</p>

          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroChartData.map((entry, index) => (
                    <Cell key={'cell-' + index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'var(--border-glass)', borderRadius: '0.75rem' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>30-Day Aggregated Matrix</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '2rem 0' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Monthly Calorie Burn</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neon-emerald)' }}>
                {(metricsData.monthlySummary?.total_calories_burned || totalCaloriesBurned) + ' kcal'}
              </h2>
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Monthly Step Volume</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                {Number(metricsData.monthlySummary?.total_steps || totalSteps).toLocaleString() + ' steps'}
              </h2>
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average Session Duration</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neon-amber)' }}>
                {Math.round(metricsData.monthlySummary?.avg_workout_duration || 45) + ' mins'}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <header className="top-bar">
        <div className="header-title">
          <h1>
            Biometric <span className="text-gradient-emerald">Target Settings</span>
          </h1>
          <p>Customize daily activity ring goals and macronutrient targets</p>
        </div>
      </header>

      <form onSubmit={handleSaveGoals} className="glass-card" style={{ maxWidth: '640px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Personal Biometric Targets</h3>

        <div className="form-group">
          <label>Daily Step Target (Exercise Ring)</label>
          <input
            type="number"
            value={goalsFormData.daily_step_goal}
            onChange={(e) => setGoalsFormData({ ...goalsFormData, daily_step_goal: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label>Daily Calorie Burn Target (Move Ring)</label>
          <input
            type="number"
            value={goalsFormData.daily_calorie_burn_goal}
            onChange={(e) => setGoalsFormData({ ...goalsFormData, daily_calorie_burn_goal: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label>Daily Calorie Intake Limit (kcal)</label>
          <input
            type="number"
            value={goalsFormData.daily_calorie_intake_goal}
            onChange={(e) => setGoalsFormData({ ...goalsFormData, daily_calorie_intake_goal: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label>Daily Protein Target (g)</label>
          <input
            type="number"
            value={goalsFormData.daily_protein_goal}
            onChange={(e) => setGoalsFormData({ ...goalsFormData, daily_protein_goal: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Save Biometric Targets
        </button>
      </form>
    </div>
  );

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        streakDays={streakDays}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenMilestones={() => setIsMilestonesModalOpen(true)}
        onOpenLogModal={() => setIsActivityModalOpen(true)}
      />

      <main className="main-content">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'nutrition' && renderNutrition()}
        {currentView === 'schedule' && renderSchedule()}
        {currentView === 'reports' && renderReports()}
        {currentView === 'settings' && renderSettings()}
      </main>

      <LogActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
      />

      <LogMealModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onSave={handleSaveMeal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        API_URL={API_URL}
      />

      <MilestonesModal
        isOpen={isMilestonesModalOpen}
        onClose={() => setIsMilestonesModalOpen(false)}
        activities={activities}
        nutrition={nutrition}
        streakDays={streakDays}
      />
    </div>
  );
}

export default App;
