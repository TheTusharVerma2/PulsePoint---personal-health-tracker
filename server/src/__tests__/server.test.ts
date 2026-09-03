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

  it('GET /api/metrics - should return 7-day metrics, macros, and monthly summaries', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('last7Days');
    expect(res.body).toHaveProperty('macros');
    expect(res.body).toHaveProperty('monthlySummary');
    expect(Array.isArray(res.body.last7Days)).toBe(true);
  });
});
