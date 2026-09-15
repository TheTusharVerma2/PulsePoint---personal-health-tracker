import { useEffect, useState, type FormEvent } from 'react';
import {
  Bike,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Waves,
  X,
} from 'lucide-react';

type ActivityPayload = {
  type: string;
  duration_minutes: number;
  calories_burned: number;
  steps: number;
  date: string;
};

interface LogActivityModalProps {
  isOpen: boolean;
  initialDate?: string;
  onClose: () => void;
  onSave: (data: ActivityPayload) => Promise<boolean>;
}

const activityOptions = [
  { id: 'running', name: 'Running', icon: <Flame />, color: '#D85C4A' },
  { id: 'cycling', name: 'Cycling', icon: <Bike />, color: '#287A52' },
  {
    id: 'weightlifting',
    name: 'Strength',
    icon: <Dumbbell />,
    color: '#5E67B1',
  },
  { id: 'swimming', name: 'Swimming', icon: <Waves />, color: '#387EA8' },
  { id: 'yoga', name: 'Yoga', icon: <Heart />, color: '#B56A15' },
  { id: 'sleep', name: 'Sleep', icon: <Moon />, color: '#5E67B1' },
];

export const LogActivityModal = ({
  isOpen,
  initialDate,
  onClose,
  onSave,
}: LogActivityModalProps) => {
  const [type, setType] = useState('running');
  const [duration, setDuration] = useState('45');
  const [calories, setCalories] = useState('350');
  const [steps, setSteps] = useState('5000');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setFormError('');
    }
  }, [isOpen, initialDate]);

  if (!isOpen) {
    return null;
  }

  const isSleep = type === 'sleep';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = await onSave({
        type,
        duration_minutes: Number(duration) || 0,
        calories_burned: isSleep ? 0 : Number(calories) || 0,
        steps: isSleep ? 0 : Number(steps) || 0,
        date,
      });

      if (saved) {
        onClose();
      } else {
        setFormError('Could not save activity. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation">
      <section
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Activity</p>
            <h2 id="activity-modal-title">Log your activity</h2>
            <p style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Add a workout, a walk, or a sleep session.
            </p>
          </div>

          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-group">
            <label>What did you do?</label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '8px',
              }}
            >
              {activityOptions.map((option) => {
                const selected = type === option.id;

                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setType(option.id)}
                    style={{
                      display: 'grid',
                      gap: '6px',
                      padding: '12px 6px',
                      color: selected ? option.color : 'var(--text-muted)',
                      background: selected ? `${option.color}18` : '#fff',
                      border: `1px solid ${
                        selected ? option.color : 'var(--border)'
                      }`,
                      borderRadius: '10px',
                      placeItems: 'center',
                    }}
                  >
                    {option.icon}
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {option.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div className="form-group">
              <label htmlFor="activity-date">Date</label>
              <input
                id="activity-date"
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="activity-duration">Duration in minutes</label>
              <input
                id="activity-duration"
                type="number"
                min="1"
                inputMode="numeric"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                required
              />
            </div>
          </div>

          {!isSleep && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div className="form-group">
                <label htmlFor="activity-calories">Calories burned</label>
                <input
                  id="activity-calories"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={calories}
                  onChange={(event) => setCalories(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="activity-steps">Steps</label>
                <input
                  id="activity-steps"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={steps}
                  onChange={(event) => setSteps(event.target.value)}
                />
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '24px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save activity'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
