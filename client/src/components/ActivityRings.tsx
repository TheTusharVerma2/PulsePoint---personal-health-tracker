import React from 'react';
import { Flame, Activity, Moon } from 'lucide-react';

interface ActivityRingsProps {
  caloriesBurned: number;
  calorieGoal: number;
  steps: number;
  stepGoal: number;
  sleepHours: number;
  sleepGoal: number;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
  caloriesBurned,
  calorieGoal,
  steps,
  stepGoal,
  sleepHours,
  sleepGoal
}) => {
  const movePct = Math.min(100, Math.max(0, Math.round((caloriesBurned / (calorieGoal || 2000)) * 100)));
  const exercisePct = Math.min(100, Math.max(0, Math.round((steps / (stepGoal || 10000)) * 100)));
  const sleepPct = Math.min(100, Math.max(0, Math.round((sleepHours / (sleepGoal || 8)) * 100)));

  // SVG parameters
  const center = 110;
  const strokeWidth = 14;

  const rMove = 90;
  const cMove = 2 * Math.PI * rMove;
  const strokeMove = cMove - (movePct / 100) * cMove;

  const rExercise = 70;
  const cExercise = 2 * Math.PI * rExercise;
  const strokeExercise = cExercise - (exercisePct / 100) * cExercise;

  const rSleep = 50;
  const cSleep = 2 * Math.PI * rSleep;
  const strokeSleep = cSleep - (sleepPct / 100) * cSleep;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Biometric Activity Rings</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily Move, Exercise & Recovery Progress</p>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          Apple Fitness+ Mode
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
        {/* SVG Concentric Rings */}
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <filter id="glow-move" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.6" />
              </filter>
              <filter id="glow-exercise" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.6" />
              </filter>
              <filter id="glow-sleep" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Background Track Rings */}
            <circle cx={center} cy={center} r={rMove} stroke="rgba(244, 63, 94, 0.15)" strokeWidth={strokeWidth} fill="none" />
            <circle cx={center} cy={center} r={rExercise} stroke="rgba(16, 185, 129, 0.15)" strokeWidth={strokeWidth} fill="none" />
            <circle cx={center} cy={center} r={rSleep} stroke="rgba(6, 182, 212, 0.15)" strokeWidth={strokeWidth} fill="none" />

            {/* Progress Rings */}
            <circle
              cx={center}
              cy={center}
              r={rMove}
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={cMove}
              strokeDashoffset={strokeMove}
              strokeLinecap="round"
              filter="url(#glow-move)"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
            <circle
              cx={center}
              cy={center}
              r={rExercise}
              stroke="#10b981"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={cExercise}
              strokeDashoffset={strokeExercise}
              strokeLinecap="round"
              filter="url(#glow-exercise)"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
            <circle
              cx={center}
              cy={center}
              r={rSleep}
              stroke="#06b6d4"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={cSleep}
              strokeDashoffset={strokeSleep}
              strokeLinecap="round"
              filter="url(#glow-sleep)"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
        </div>

        {/* Ring Metrics Legend Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '180px' }}>
          {/* Move */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MOVE (CALORIES)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {caloriesBurned} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {calorieGoal} kcal</span>
              </div>
            </div>
          </div>

          {/* Exercise */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXERCISE (STEPS)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {steps.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {stepGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sleep */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Moon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECOVERY (SLEEP)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {sleepHours}h <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {sleepGoal}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
