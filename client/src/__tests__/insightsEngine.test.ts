import { describe, it, expect } from 'vitest';
import { generateHealthInsights } from '../utils/insightsEngine';

describe('AI Health Insights Unit Tests', () => {
  it('should generate sleep recovery opportunity warning when average sleep < 7h', () => {
    const activities = [{ type: 'sleep', duration_minutes: 360 }]; // 6 hours
    const nutrition: any[] = [];
    const metrics: any[] = [];
    const goals = { daily_step_goal: 10000, daily_calorie_burn_goal: 2000, daily_protein_goal: 120 };

    const insights = generateHealthInsights(activities, nutrition, metrics, goals);
    const sleepInsight = insights.find(i => i.id === 'sleep-low');

    expect(sleepInsight).toBeDefined();
    expect(sleepInsight?.type).toBe('warning');
    expect(sleepInsight?.title).toBe('Recovery Opportunity');
  });

  it('should generate calorie deficit insight when burned > consumed', () => {
    const activities = [{ type: 'running', calories_burned: 600 }];
    const nutrition = [{ meal_name: 'Salad', calories: 200 }];
    const metrics: any[] = [];
    const goals = { daily_step_goal: 10000, daily_calorie_burn_goal: 2000, daily_protein_goal: 120 };

    const insights = generateHealthInsights(activities, nutrition, metrics, goals);
    const deficitInsight = insights.find(i => i.id === 'energy-deficit');

    expect(deficitInsight).toBeDefined();
    expect(deficitInsight?.category).toBe('fitness');
  });

  it('should generate protein milestone hit insight when protein goal is met', () => {
    const activities: any[] = [];
    const nutrition = [{ meal_name: 'Chicken Breast', calories: 400, protein_g: 130 }];
    const metrics: any[] = [];
    const goals = { daily_step_goal: 10000, daily_calorie_burn_goal: 2000, daily_protein_goal: 120 };

    const insights = generateHealthInsights(activities, nutrition, metrics, goals);
    const proteinInsight = insights.find(i => i.id === 'protein-target-met');

    expect(proteinInsight).toBeDefined();
    expect(proteinInsight?.type).toBe('success');
  });
});
