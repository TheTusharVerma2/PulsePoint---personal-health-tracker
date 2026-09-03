import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ReadinessGaugeProps {
  sleepHours: number;
  workoutMinutes: number;
  stepPct: number;
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({
  sleepHours,
  workoutMinutes,
  stepPct
}) => {
  // Calculate readiness score (0-100)
  let sleepScore = Math.min(40, (sleepHours / 8) * 40);
  let stepScore = Math.min(30, (stepPct / 100) * 30);
  let strainDeduction = workoutMinutes > 90 ? 10 : 0;
  
  let totalScore = Math.round(Math.min(100, Math.max(20, sleepScore + stepScore + 30 - strainDeduction)));

  let statusText = 'OPTIMAL READINESS';
  let statusColor = '#10b981';
  let adviceText = 'Body telemetry is primed for high-performance training & cardio load.';

  if (totalScore < 60) {
    statusText = 'RECOVERY MODE REQUIRED';
    statusColor = '#f43f5e';
    adviceText = 'Elevated physiological strain detected. Prioritize sleep & active recovery.';
  } else if (totalScore < 80) {
    statusText = 'MODERATE PHYSIOLOGICAL STRAIN';
    statusColor = '#f59e0b';
    adviceText = 'Balanced readiness. Ideal for steady-state workouts & strength training.';
  }

  // SVG Gauge Math
  const radius = 75;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Semi-circle arc length
  const progressOffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Bio-Readiness Score</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Oura & WHOOP Physiological Index</p>
        </div>
        <div style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', background: `${statusColor}20`, border: `1px solid ${statusColor}40`, color: statusColor, fontSize: '0.75rem', fontWeight: 700 }}>
          {statusText}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '1.5rem 0' }}>
        {/* Semi-Circle SVG Gauge */}
        <div style={{ position: 'relative', width: 180, height: 105, display: 'flex', justifyContent: 'center' }}>
          <svg width="180" height="110" viewBox="0 0 180 110">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor={statusColor} />
              </linearGradient>
            </defs>
            {/* Background Arc */}
            <path
              d="M 15 95 A 75 75 0 0 1 165 95"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <path
              d="M 15 95 A 75 75 0 0 1 165 95"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>

          {/* Center Score Counter */}
          <div style={{ position: 'absolute', bottom: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
              {totalScore}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}> / 100</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.85rem', border: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldCheck size={20} style={{ color: statusColor, flexShrink: 0 }} />
        <span>{adviceText}</span>
      </div>
    </div>
  );
};
