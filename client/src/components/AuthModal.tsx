import React, { useState, useEffect } from 'react';
import { X, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  API_URL: string;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onSuccess,
  API_URL
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError('');
      setShowGooglePrompt(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const validateEmailFormat = (emailStr: string): boolean => {
    const trimmed = emailStr.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;

    const [username, domain] = trimmed.split('@');
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      if (username.length < 3 || username.length > 64) return false;
      if (!/^[a-z0-9._%+-]+$/.test(username)) return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!validateEmailFormat(trimmedEmail)) {
      setError('Email ID does not exist');
      return;
    }

    if (activeTab === 'register' && (!username || username.trim().length < 2)) {
      setError('Please enter a valid username (at least 2 characters).');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);

    const endpoint = activeTab === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const payload = activeTab === 'login' ? { email: trimmedEmail, password } : { username: username.trim(), email: trimmedEmail, password };

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

  const handleGoogleOAuthRedirect = async () => {
    setError('');
    setLoading(true);
    try {
      const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      if (googleClientId && !googleClientId.includes('pulsepoint.apps')) {
        const res = await fetch(`${API_URL}/auth/google/url`);
        const data = await res.json();
        if (data.url) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        }
      }
      setShowGooglePrompt(true);
    } catch (err: any) {
      setShowGooglePrompt(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (emailOverride?: string) => {
    setError('');
    setLoading(true);
    try {
      const targetGoogleEmail = (emailOverride || googleEmail || '').trim().toLowerCase();
      if (!validateEmailFormat(targetGoogleEmail)) {
        setError('Email ID does not exist');
        setLoading(false);
        return;
      }
      const targetName = targetGoogleEmail.split('@')[0];
      const targetGoogleId = 'g_' + Math.abs(targetGoogleEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));

      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetGoogleEmail,
          googleId: targetGoogleId,
          name: targetName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Authentication failed');

      localStorage.setItem('pulsepoint_token', data.token);
      localStorage.setItem('pulsepoint_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
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
            onClick={() => { setActiveTab('login'); setError(''); setShowGooglePrompt(false); }}
          >
            <LogIn size={16} /> Login
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'register' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', backgroundColor: activeTab === 'register' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'register' ? '#fff' : 'var(--text-muted)' }}
            onClick={() => { setActiveTab('register'); setError(''); setShowGooglePrompt(false); }}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Google Authentication Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          {!showGooglePrompt ? (
            <button
              type="button"
              className="btn"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                backgroundColor: '#ffffff',
                color: '#3c4043',
                border: '1px solid #dadce0',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                boxShadow: '0 1px 3px rgba(60,64,67,0.15)',
                cursor: 'pointer'
              }}
              onClick={handleGoogleOAuthRedirect}
              disabled={loading}
            >
              <GoogleIcon />
              <span style={{ color: '#3c4043', fontWeight: 600 }}>Continue with Google</span>
            </button>
          ) : (
            <div style={{ backgroundColor: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(66, 133, 244, 0.4)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <GoogleIcon /> Confirm Google Account Email
              </div>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)', marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleGoogleAuth(googleEmail)}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Continue with Google'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                  onClick={() => setShowGooglePrompt(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative', margin: '1.25rem 0', textAlign: 'center' }}>
          <hr style={{ borderColor: 'var(--border-color)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--surface-color)', padding: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            OR WITH EMAIL
          </span>
        </div>

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

        <div style={{ position: 'relative', margin: '1.25rem 0', textAlign: 'center' }}>
          <hr style={{ borderColor: 'var(--border-color)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--surface-color)', padding: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            DEMO ACCESS
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

