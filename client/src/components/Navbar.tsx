import React from 'react';
import { Activity, Home, Calendar, Utensils, PieChart, Settings, Flame, LogIn, LogOut, Plus } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: any;
  streakDays: number;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenMilestones: () => void;
  onOpenLogModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  streakDays,
  onOpenAuth,
  onLogout,
  onOpenMilestones,
  onOpenLogModal
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'nutrition', label: 'Nutrition Lab', icon: <Utensils size={20} /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={20} /> },
    { id: 'reports', label: 'Analytics Reports', icon: <PieChart size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Brand Logo */}
        <div className="brand-logo">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>PulsePoint</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--neon-emerald)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '-2px' }}>
              Telemetry OS
            </span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="nav-menu">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`nav-link ${currentView === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentView(item.id);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Footer User Profile & Streak Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
        {/* Streak Pill */}
        <div className="streak-badge" onClick={onOpenMilestones} title="View Milestones & Badges">
          <Flame size={18} />
          <span>{streakDays} Day Streak</span>
        </div>

        {/* Quick Log Floating Button */}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onOpenLogModal}>
          <Plus size={18} /> Log Telemetry
        </button>

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
              {user ? user.username.charAt(0).toUpperCase() : 'D'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user ? user.username : 'Demo User'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user ? user.email : 'demo@pulsepoint.app'}
              </span>
            </div>
          </div>

          {user ? (
            <button className="btn-delete" onClick={onLogout} title="Sign Out">
              <LogOut size={18} />
            </button>
          ) : (
            <button className="btn-delete" onClick={onOpenAuth} title="Sign In">
              <LogIn size={18} style={{ color: 'var(--neon-emerald)' }} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
