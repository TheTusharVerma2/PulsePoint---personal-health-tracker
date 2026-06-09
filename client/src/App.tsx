import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Flame, 
  Moon, 
  Home, 
  Calendar, 
  PieChart, 
  Settings, 
  Plus,
  ArrowUpRight,
  X,
  Utensils
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const API_URL = 'http://localhost:5001/api';

function App() {
  const [activities, setActivities] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [nutrition, setNutrition] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  // Form State
  const [formData, setFormData] = useState({
    type: 'running',
    duration_minutes: '',
    calories_burned: '',
    steps: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [nutritionFormData, setNutritionFormData] = useState({
    meal_name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, metricsRes, nutritionRes] = await Promise.all([
        fetch(`${API_URL}/activities`),
        fetch(`${API_URL}/metrics`),
        fetch(`${API_URL}/nutrition`)
      ]);
      
      const activitiesData = await activitiesRes.json();
      const metricsData = await metricsRes.json();
      const nutritionData = await nutritionRes.json();
      
      setActivities(activitiesData);
      setMetrics(metricsData);
      setNutrition(nutritionData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNutritionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNutritionFormData({ ...nutritionFormData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes) || 0,
          calories_burned: parseInt(formData.calories_burned) || 0,
          steps: parseInt(formData.steps) || 0,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          type: 'running',
          duration_minutes: '',
          calories_burned: '',
          steps: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchData(); // Refresh dashboard data instantly
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleNutritionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nutritionFormData,
          calories: parseInt(nutritionFormData.calories) || 0,
          protein_g: parseFloat(nutritionFormData.protein_g) || 0,
          carbs_g: parseFloat(nutritionFormData.carbs_g) || 0,
          fat_g: parseFloat(nutritionFormData.fat_g) || 0,
        }),
      });

      if (response.ok) {
        setIsNutritionModalOpen(false);
        setNutritionFormData({
          meal_name: '',
          calories: '',
          protein_g: '',
          carbs_g: '',
          fat_g: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchData(); // Refresh dashboard and nutrition data instantly
      }
    } catch (error) {
      console.error('Error saving meal log:', error);
    }
  };

  // Calculate totals from recent activities for stat cards
  const totalCalories = activities.reduce((sum, act) => sum + (act.calories_burned || 0), 0);
  const totalSteps = activities.reduce((sum, act) => sum + (act.steps || 0), 0);
  const totalCaloriesConsumed = nutrition.reduce((sum, nut) => sum + (nut.calories || 0), 0);


  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <Activity size={28} />
          <span>PulsePoint</span>
        </div>
        
        <nav className="nav-menu">
          <a href="#" className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}>
            <Home size={20} />
            Dashboard
          </a>
          <a href="#" className={`nav-item ${currentView === 'schedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('schedule'); }}>
            <Calendar size={20} />
            Schedule
          </a>
          <a href="#" className={`nav-item ${currentView === 'nutrition' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('nutrition'); }}>
            <Utensils size={20} />
            Nutrition
          </a>
          <a href="#" className={`nav-item ${currentView === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('reports'); }}>
            <PieChart size={20} />
            Reports
          </a>
          <a href="#" className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('settings'); }}>
            <Settings size={20} />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <>
            <header className="header">
              <div>
            <h1>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Welcome back, User. Here is your health summary.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} />
              Log Activity
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Heart Rate</h3>
              <div className="stat-value">
                72 <span className="stat-unit">bpm</span>
              </div>
            </div>
            <div className="stat-icon icon-red">
              <Heart size={24} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Calories Logged</h3>
              <div className="stat-value">
                {totalCalories} <span className="stat-unit">kcal</span>
              </div>
            </div>
            <div className="stat-icon icon-green">
              <Flame size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Calories Consumed</h3>
              <div className="stat-value">
                {totalCaloriesConsumed} <span className="stat-unit">kcal</span>
              </div>
            </div>
            <div className="stat-icon icon-orange">
              <Utensils size={24} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Steps Logged</h3>
              <div className="stat-value">
                {totalSteps} <span className="stat-unit">steps</span>
              </div>
            </div>
            <div className="stat-icon icon-blue">
              <Activity size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <h3>Sleep Duration</h3>
              <div className="stat-value">
                7.5 <span className="stat-unit">hrs</span>
              </div>
            </div>
            <div className="stat-icon icon-blue" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Moon size={24} />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">Activity & Nutrition Overview (Last 7 Days)</h2>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></div>
                  Steps
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--secondary-color)' }}></div>
                  Calories Burned
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--protein-color)' }}></div>
                  Calories Consumed
                </span>
              </div>
            </div>
            <div style={{ height: 300 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading chart data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--secondary-color)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--secondary-color)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCaloriesConsumed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--protein-color)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--protein-color)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="steps" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" />
                    <Area yAxisId="right" type="monotone" dataKey="calories" stroke="var(--secondary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorCalories)" />
                    <Area yAxisId="right" type="monotone" dataKey="calories_consumed" stroke="var(--protein-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorCaloriesConsumed)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-title" style={{ marginBottom: '1.5rem' }}>Recent Activity</h2>
            <ul className="recent-activity">
              {activities.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No activities logged yet.</div>
              ) : (
                activities.map((activity, index) => (
                  <li className="activity-item" key={index}>
                    <div className="activity-icon" style={{ color: activity.type === 'sleep' ? '#8b5cf6' : 'var(--primary-color)' }}>
                      {activity.type === 'sleep' ? <Moon size={20} /> : <Flame size={20} />}
                    </div>
                    <div className="activity-details">
                      <h4>{activity.type}</h4>
                      <p>{activity.duration_minutes} mins {activity.calories_burned > 0 && `• ${activity.calories_burned} kcal`}</p>
                    </div>
                    <div className="activity-time">
                      {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </li>
                ))
              )}
            </ul>
            <button 
              className="btn" 
              style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
              onClick={() => setCurrentView('history')}
            >
              View All History <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        </>
      )}

        {currentView === 'schedule' && (
          <div className="view-wrapper">
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Your Schedule</h1>
              <button className="btn btn-primary" onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFormData({ ...formData, date: tomorrow.toISOString().split('T')[0] });
                setIsModalOpen(true);
              }}>
                <Plus size={20} />
                Plan Workout
              </button>
            </header>
            
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
              {activities.filter(a => new Date(a.date) > new Date()).length > 0 ? (
                activities.filter(a => new Date(a.date) > new Date()).map((activity, index) => (
                  <div key={index} className="activity-item" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                    <div className="activity-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary-color)' }}>
                      <Calendar size={20} />
                    </div>
                    <div className="activity-details">
                      <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{activity.type.toUpperCase()}</h4>
                      <p>Planned for {activity.duration_minutes} minutes</p>
                    </div>
                    <div className="activity-time" style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--primary-color)' }} />
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Your schedule is clear!</h3>
                  <p>You have no upcoming activities planned. Click "Plan Workout" to schedule your next session.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'reports' && (
          <div className="view-wrapper">
            <header className="header">
              <h1>Detailed Reports</h1>
            </header>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <PieChart size={64} style={{ marginBottom: '1.5rem', opacity: 0.5, color: 'var(--secondary-color)' }} />
              <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Advanced analytics are locked.</h2>
              <p>We need more data to generate long-term health reports. Keep logging!</p>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="view-wrapper">
            <header className="header">
              <h1>Account Settings</h1>
            </header>
            <div className="stat-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Profile Preferences</h3>
              <div className="form-group">
                <label>Display Name</label>
                <input type="text" defaultValue="User" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" defaultValue="user@example.com" />
              </div>
              <div className="form-group">
                <label>Daily Step Goal</label>
                <input type="number" defaultValue={10000} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Save Changes</button>
            </div>
          </div>
        )}
        {currentView === 'history' && (
          <div className="view-wrapper">
            <header className="header">
              <h1>Activity History</h1>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={20} />
                New Entry
              </button>
            </header>
            <div className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Duration</th>
                    <th style={{ padding: '1rem' }}>Calories</th>
                    <th style={{ padding: '1rem' }}>Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{activity.type}</td>
                      <td style={{ padding: '1rem' }}>{new Date(activity.date).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>{activity.duration_minutes} min</td>
                      <td style={{ padding: '1rem' }}>{activity.calories_burned} kcal</td>
                      <td style={{ padding: '1rem' }}>{activity.steps || '-'}</td>
                    </tr>
                  ))}
                  {activities.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No history found. Start logging!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'nutrition' && (
          <div className="view-wrapper">
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>Nutrition Tracker</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Monitor your daily calorie intake and macronutrient balance.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsNutritionModalOpen(true)}>
                <Plus size={20} />
                Log Meal
              </button>
            </header>

            <div style={{ marginTop: '1.5rem' }}>
              {/* Meal Log List */}
              <div className="chart-card">
                <h2 className="chart-title" style={{ marginBottom: '1.5rem' }}>Logged Meals</h2>
                <div className="meal-items-container" style={{ overflowY: 'auto', maxHeight: '500px' }}>
                  {nutrition.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                      No meals logged yet. Click "Log Meal" to add your first entry.
                    </div>
                  ) : (
                    nutrition.map((meal, index) => (
                      <div className="meal-item" key={index}>
                        <div className="meal-info">
                          <h4>{meal.meal_name}</h4>
                          <p>
                            <span className="meal-macro-badge" style={{ color: 'var(--protein-color)' }}>P: {meal.protein_g}g</span>
                            <span className="meal-macro-badge" style={{ color: 'var(--carbs-color)' }}>C: {meal.carbs_g}g</span>
                            <span className="meal-macro-badge" style={{ color: 'var(--fat-color)' }}>F: {meal.fat_g}g</span>
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span className="meal-calories">{meal.calories} kcal</span>
                          <span className="meal-date">{new Date(meal.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Log Activity Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Log New Activity</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Activity Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="yoga">Yoga</option>
                  <option value="swimming">Swimming</option>
                  <option value="weightlifting">Weightlifting</option>
                  <option value="sleep">Sleep</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} placeholder="e.g. 45" required />
              </div>
              <div className="form-group">
                <label>Calories Burned</label>
                <input type="number" name="calories_burned" value={formData.calories_burned} onChange={handleInputChange} placeholder="e.g. 350" />
              </div>
              <div className="form-group">
                <label>Steps (Optional)</label>
                <input type="number" name="steps" value={formData.steps} onChange={handleInputChange} placeholder="e.g. 5000" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Meal Modal */}
      {isNutritionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Log New Meal</h2>
              <button className="close-btn" onClick={() => setIsNutritionModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleNutritionSubmit}>
              <div className="form-group">
                <label>Meal / Food Name</label>
                <input 
                  type="text" 
                  name="meal_name" 
                  value={nutritionFormData.meal_name} 
                  onChange={handleNutritionInputChange} 
                  placeholder="e.g. Avocado Toast with Eggs" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  name="date" 
                  value={nutritionFormData.date} 
                  onChange={handleNutritionInputChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Calories (kcal)</label>
                <input 
                  type="number" 
                  name="calories" 
                  value={nutritionFormData.calories} 
                  onChange={handleNutritionInputChange} 
                  placeholder="e.g. 450" 
                  required 
                />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label>Protein (g)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    name="protein_g" 
                    value={nutritionFormData.protein_g} 
                    onChange={handleNutritionInputChange} 
                    placeholder="e.g. 20" 
                  />
                </div>
                <div>
                  <label>Carbs (g)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    name="carbs_g" 
                    value={nutritionFormData.carbs_g} 
                    onChange={handleNutritionInputChange} 
                    placeholder="e.g. 45" 
                  />
                </div>
                <div>
                  <label>Fat (g)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    name="fat_g" 
                    value={nutritionFormData.fat_g} 
                    onChange={handleNutritionInputChange} 
                    placeholder="e.g. 15" 
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsNutritionModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Meal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
