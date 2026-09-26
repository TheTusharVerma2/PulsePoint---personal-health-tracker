import request from 'supertest';
import app from '../index';

describe('PulsePoint Backend API Integration Tests', () => {
  it('GET /api/health - should return 200 OK with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/demo - should generate JWT token for demo user', async () => {
    const res = await request(app).post('/api/auth/demo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username');
  });

  it('POST /api/auth/google - should authenticate and auto-register Google user', async () => {
    const testGoogleEmail = `googletest${Date.now().toString().slice(-8)}@gmail.com`;
    const res = await request(app).post('/api/auth/google').send({
      email: testGoogleEmail,
      googleId: `gid_${Date.now()}`,
      name: 'Google Test User'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username');
    expect(res.body.user.email).toBe(testGoogleEmail);
  });

  it('GET /api/metrics - should return 7-day metrics, macros, and monthly summaries', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('last7Days');
    expect(res.body).toHaveProperty('macros');
    expect(res.body).toHaveProperty('monthlySummary');
    expect(Array.isArray(res.body.last7Days)).toBe(true);
  });

  it('should isolate data between different users and logged out state', async () => {
    const randomSuffix = Date.now();

    // Register User A
    const regA = await request(app).post('/api/auth/register').send({
      username: `usera_${randomSuffix}`,
      email: `usera_${randomSuffix}@test.com`,
      password: 'password123',
    });
    expect(regA.status).toBe(201);
    const tokenA = regA.body.token;

    // Create activity for User A
    const actA = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'Running',
        duration_minutes: 45,
        calories_burned: 450,
        steps: 5000,
        date: '2026-09-19',
      });
    expect(actA.status).toBe(200);
    const activityIdA = actA.body.id;

    // Register User B
    const regB = await request(app).post('/api/auth/register').send({
      username: `userb_${randomSuffix}`,
      email: `userb_${randomSuffix}@test.com`,
      password: 'password123',
    });
    expect(regB.status).toBe(201);
    const tokenB = regB.body.token;

    // Fetch activities for User B
    const actB = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(actB.status).toBe(200);
    const hasUserAActivityInB = actB.body.some((item: any) => item.id === activityIdA);
    expect(hasUserAActivityInB).toBe(false);

    // Fetch activities for User A - should have user A's activity
    const actAFetch = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(actAFetch.status).toBe(200);
    const hasUserAActivityInA = actAFetch.body.some((item: any) => item.id === activityIdA);
    expect(hasUserAActivityInA).toBe(true);
  });
});
