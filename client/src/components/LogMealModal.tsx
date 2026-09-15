import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

type MealPayload = {
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  date: string;
};

interface LogMealModalProps {
  isOpen: boolean;
  initialDate?: string;
  onClose: () => void;
  onSave: (data: MealPayload) => Promise<boolean>;
}

export const LogMealModal = ({
  isOpen,
  initialDate,
  onClose,
  onSave,
}: LogMealModalProps) => {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = await onSave({
        meal_name: mealName.trim(),
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
        date,
      });

      if (saved) {
        setMealName('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        onClose();
      } else {
        setFormError('Could not save meal. Please try again.');
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
        aria-labelledby="meal-modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Nutrition</p>
            <h2 id="meal-modal-title">Log a meal</h2>
            <p style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Add what you ate and its estimated nutrition.
            </p>
          </div>

          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="form-group">
            <label htmlFor="meal-name">Meal name</label>
            <input
              id="meal-name"
              type="text"
              placeholder="For example, chicken rice bowl"
              value={mealName}
              onChange={(event) => setMealName(event.target.value)}
              required
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div className="form-group">
              <label htmlFor="meal-date">Date</label>
              <input
                id="meal-date"
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meal-calories">Calories</label>
              <input
                id="meal-calories"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="550"
                value={calories}
                onChange={(event) => setCalories(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Macros in grams</label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label
                  htmlFor="meal-protein"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#B56A15',
                    fontSize: '12px',
                  }}
                >
                  Protein
                </label>
                <input
                  id="meal-protein"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="35"
                  value={protein}
                  onChange={(event) => setProtein(event.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="meal-carbs"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#387EA8',
                    fontSize: '12px',
                  }}
                >
                  Carbs
                </label>
                <input
                  id="meal-carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="50"
                  value={carbs}
                  onChange={(event) => setCarbs(event.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="meal-fat"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#D85C4A',
                    fontSize: '12px',
                  }}
                >
                  Fat
                </label>
                <input
                  id="meal-fat"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="18"
                  value={fat}
                  onChange={(event) => setFat(event.target.value)}
                />
              </div>
            </div>
          </div>

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
              {saving ? 'Saving…' : 'Save meal'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
