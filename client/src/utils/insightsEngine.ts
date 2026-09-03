export interface HealthInsight {
  id: string;
  title: string;
  category: 'recovery' | 'nutrition' | 'fitness' | 'streak';
  type: 'success' | 'warning' | 'info';
  message: string;
  actionHint?: string;
}

export function generateHealthInsights(
  activities: any[],
  nutrition: any[],
  _metrics: any[],
  goals: any
): HealthInsight[] {
  const insights: HealthInsight[] = [];

  const stepGoal = goals?.daily_step_goal || 10000;
  const proteinGoal = goals?.daily_protein_goal || 120;

  // 1. Sleep & Recovery Analysis
  const sleepEntries = activities.filter(a => a.type === 'sleep');
  if (sleepEntries.length > 0) {
    const avgSleep = sleepEntries.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0) / (sleepEntries.length * 60);
    if (avgSleep < 7.0) {
      insights.push({
        id: 'sleep-low',
        title: 'Recovery Opportunity',
        category: 'recovery',
        type: 'warning',
        message: `Your recent sleep averaged ${avgSleep.toFixed(1)} hrs. Target 7.5–8.0 hrs to optimize muscle recovery & endurance.`,
        actionHint: 'Prioritize a 30-min earlier bedtime tonight.'
      });
    } else {
      insights.push({
        id: 'sleep-optimal',
        title: 'Optimal Sleep & Recovery',
        category: 'recovery',
        type: 'success',
        message: `Great recovery pace! You're averaging ${avgSleep.toFixed(1)} hrs of rest, supporting optimal metabolic health.`,
      });
    }
  }

  // 2. Calorie Deficit / Energy Expenditure Correlation
  const totalBurned = activities.reduce((sum, a) => sum + Number(a.calories_burned || 0), 0);
  const totalConsumed = nutrition.reduce((sum, n) => sum + Number(n.calories || 0), 0);
  const netEnergy = totalConsumed - totalBurned;

  if (totalBurned > 0 || totalConsumed > 0) {
    if (netEnergy < -300) {
      insights.push({
        id: 'energy-deficit',
        title: 'Active Calorie Deficit',
        category: 'fitness',
        type: 'info',
        message: `You're currently in a ${Math.abs(netEnergy)} kcal deficit. Ideal for body re-composition and fat loss!`,
      });
    } else if (netEnergy > 500) {
      insights.push({
        id: 'energy-surplus',
        title: 'Calorie Surplus Alert',
        category: 'nutrition',
        type: 'warning',
        message: `Current logged intake exceeds expenditure by ${netEnergy} kcal. Consider adding a light cardio session.`,
      });
    }
  }

  // 3. Protein & Macro Ratio Check
  const totalProtein = nutrition.reduce((sum, n) => sum + Number(n.protein_g || 0), 0);
  if (totalProtein > 0) {
    if (totalProtein >= proteinGoal) {
      insights.push({
        id: 'protein-target-met',
        title: 'Protein Milestone Hit',
        category: 'nutrition',
        type: 'success',
        message: `Outstanding macronutrient intake! You hit ${totalProtein}g protein, surpassing your daily ${proteinGoal}g target.`,
      });
    } else {
      const remaining = proteinGoal - totalProtein;
      insights.push({
        id: 'protein-deficit',
        title: 'Protein Target Focus',
        category: 'nutrition',
        type: 'info',
        message: `Logged ${totalProtein}g of protein (${remaining}g remaining to reach ${proteinGoal}g target).`,
        actionHint: 'Add lean protein sources like eggs, chicken, or Greek yogurt.'
      });
    }
  }

  // 4. Activity & Step Consistency
  const totalSteps = activities.reduce((sum, a) => sum + Number(a.steps || 0), 0);
  if (totalSteps >= stepGoal) {
    insights.push({
      id: 'step-goal-achieved',
      title: 'Daily Step Target Shattered',
      category: 'fitness',
      type: 'success',
      message: `You've accumulated ${totalSteps.toLocaleString()} steps! Exceptional daily physical mobility.`,
    });
  }

  return insights;
}
