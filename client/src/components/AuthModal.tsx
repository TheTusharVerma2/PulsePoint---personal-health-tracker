import React, { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  API_URL: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, API_URL }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = activeTab === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const payload = activeTab === 'login' ? { email, password } : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('pulsepoint_token', data.token);
      localStorage.setItem('pulsepoint_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/demo`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');

      localStorage.setItem('pulsepoint_token', data.token);
      localStorage.setItem('pulsepoint_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'login' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', backgroundColor: activeTab === 'login' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'login' ? '#fff' : 'var(--text-muted)' }}
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            <LogIn size={16} /> Login
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'register' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', backgroundColor: activeTab === 'register' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'register' ? '#fff' : 'var(--text-muted)' }}
            onClick={() => { setActiveTab('register'); setError(''); }}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div className="form-group">
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
          <hr style={{ borderColor: 'var(--border-color)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--surface-color)', padding: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            OR
          </span>
        </div>

        {/* Instant One-Click Demo Mode Button */}
        <button
          type="button"
          className="btn"
          style={{ width: '100%', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary-color)', border: '1px dashed var(--primary-color)' }}
          onClick={handleDemoLogin}
          disabled={loading}
        >
          <Sparkles size={18} /> Quick One-Click Demo Mode
        </button>
      </div>
    </div>
  );
};
