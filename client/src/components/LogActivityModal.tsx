import React, { useState } from 'react';
import { X, Flame, Moon, Dumbbell, Bike, Waves, Heart } from 'lucide-react';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState('running');
  const [duration, setDuration] = useState('45');
  const [calories, setCalories] = useState('350');
  const [steps, setSteps] = useState('5000');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      duration_minutes: parseInt(duration) || 0,
      calories_burned: parseInt(calories) || 0,
      steps: parseInt(steps) || 0,
      date
    });
    onClose();
  };

  const activityOptions = [
    { id: 'running', name: 'Running', icon: <Flame size={20} />, color: '#f43f5e' },
    { id: 'cycling', name: 'Cycling', icon: <Bike size={20} />, color: '#06b6d4' },
    { id: 'weightlifting', name: 'Weightlifting', icon: <Dumbbell size={20} />, color: '#8b5cf6' },
    { id: 'swimming', name: 'Swimming', icon: <Waves size={20} />, color: '#3b82f6' },
    { id: 'yoga', name: 'Yoga', icon: <Heart size={20} />, color: '#10b981' },
    { id: 'sleep', name: 'Sleep', icon: <Moon size={20} />, color: '#a855f7' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Log Biometric Session</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Record workouts, steps, or sleep telemetry</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category Selector Grid */}
          <div className="form-group">
            <label>Select Activity Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {activityOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${type === opt.id ? opt.color : 'var(--border-glass)'}`,
                    background: type === opt.id ? `${opt.color}20` : 'rgba(255,255,255,0.02)',
                    color: type === opt.id ? opt.color : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {opt.icon}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Duration (Minutes)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Calories Burned (kcal)</label>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Step Count</label>
              <input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Telemetry</button>
          </div>
        </form>
      </div>
    </div>
  );
};
