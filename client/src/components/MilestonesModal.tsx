import React from 'react';
import { X, Trophy, Flame, Zap, Award, Target, Heart } from 'lucide-react';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: any[];
  nutrition: any[];
  streakDays: number;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  isOpen,
  onClose,
  activities,
  nutrition,
  streakDays
}) => {
  if (!isOpen) return null;

  const totalSteps = activities.reduce((sum, a) => sum + Number(a.steps || 0), 0);
  const totalWorkouts = activities.filter(a => a.type !== 'sleep').length;
  const totalMeals = nutrition.length;

  const badges = [
    {
      id: 'streak-3',
      title: '3-Day Momentum',
      description: 'Logged health metrics for 3 consecutive days',
      icon: <Flame size={24} />,
      unlocked: streakDays >= 3,
      color: '#f59e0b'
    },
    {
      id: 'streak-7',
      title: '7-Day Warrior',
      description: 'Maintained a 7-day daily activity streak',
      icon: <Trophy size={24} />,
      unlocked: streakDays >= 7,
      color: '#10b981'
    },
    {
      id: 'steps-10k',
      title: '10K Step Club',
      description: 'Accumulated over 10,000 total steps',
      icon: <Zap size={24} />,
      unlocked: totalSteps >= 10000,
      color: '#06b6d4'
    },
    {
      id: 'workout-5',
      title: 'Fitness Enthusiast',
      description: 'Completed 5 logged workout sessions',
      icon: <Award size={24} />,
      unlocked: totalWorkouts >= 5,
      color: '#8b5cf6'
    },
    {
      id: 'nutrition-master',
      title: 'Nutrition Master',
      description: 'Logged 10 or more balanced meals',
      icon: <Target size={24} />,
      unlocked: totalMeals >= 10,
      color: '#ec4899'
    },
    {
      id: 'heart-pumper',
      title: 'Cardio Crusher',
      description: 'Logged over 1,000 total calories burned',
      icon: <Heart size={24} />,
      unlocked: activities.reduce((s, a) => s + Number(a.calories_burned || 0), 0) >= 1000,
      color: '#ef4444'
    }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={28} style={{ color: '#f59e0b' }} />
            <h2>Milestones & Badges</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
          {badges.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: b.unlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${b.unlocked ? b.color : 'rgba(255,255,255,0.08)'}`,
                opacity: b.unlocked ? 1 : 0.45,
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: b.unlocked ? `${b.color}22` : 'rgba(255,255,255,0.05)',
                  color: b.unlocked ? b.color : 'var(--text-muted)'
                }}
              >
                {b.icon}
              </div>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.25rem' }}>
                  {b.title} {b.unlocked && <span style={{ fontSize: '0.75rem', color: b.color, marginLeft: '0.25rem' }}>✓ Unlocked</span>}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
