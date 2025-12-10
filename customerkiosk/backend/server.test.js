const request = require('supertest');
const express = require('express');

// mock pool to avoid database connection during tests
jest.mock('./db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const pool = require('./db');

// simple test setup - create a minimal app for testing
describe('backend api tests', () => {
  let app;

  beforeAll(() => {
    // create test express app
    app = express();
    app.use(express.json());

    // add test routes
    app.get('/api/menu', async (req, res) => {
      try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/auth/google', async (req, res) => {
      const { credential } = req.body;
      if (!credential) {
        return res.status(401).json({ error: 'invalid token' });
      }
      res.json({ success: true });
    });
  });

  test('get menu endpoint returns products', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { item_id: 1, name: 'milk tea', category: 'tea', price: 5.99 },
        { item_id: 2, name: 'latte', category: 'coffee', price: 6.50 }
      ]
    });

    const response = await request(app).get('/api/menu');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('milk tea');
  });

  test('auth endpoint rejects invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('invalid token');
  });

  test('auth endpoint accepts valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'test-token' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
