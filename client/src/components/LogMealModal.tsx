import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const LogMealModal: React.FC<LogMealModalProps> = ({ isOpen, onClose, onSave }) => {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      meal_name: mealName,
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
      date
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Log Nutrition Entry</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Record meals and macronutrient ratios</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meal / Food Item Name</label>
            <input
              type="text"
              placeholder="e.g. Salmon Bowl with Avocado & Rice"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Energy (kcal)</label>
              <input type="number" placeholder="550" value={calories} onChange={(e) => setCalories(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Macronutrient Breakdown (g)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neon-amber)', fontWeight: 600 }}>Protein</span>
                <input type="number" step="0.1" placeholder="35" value={protein} onChange={(e) => setProtein(e.target.value)} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>Carbs</span>
                <input type="number" step="0.1" placeholder="50" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--neon-coral)', fontWeight: 600 }}>Fat</span>
                <input type="number" step="0.1" placeholder="18" value={fat} onChange={(e) => setFat(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Meal</button>
          </div>
        </form>
      </div>
    </div>
  );
};
