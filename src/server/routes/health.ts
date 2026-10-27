import { Hono } from 'hono';
import { getDb } from '../db/client.js';

const app = new Hono();
const startTime = Date.now();

app.get('/health', async (c) => {
  try {
    const db = getDb(c.env as any);
    // Probe D1 connection
    const stmt = db.prepare('SELECT 1 as alive');
    const result = await stmt.first<{ alive: number }>();

    if (!result || result.alive !== 1) {
      return c.json(
        {
          status: 'error',
          message: 'Database probe failed',
          code: 'D1_UNAVAILABLE',
          statusCode: 503,
          meta: { timestamp: new Date().toISOString() },
        },
        503
      );
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    return c.json(
      {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        d1: 'connected',
        uptimeSeconds,
      },
      200
    );
  } catch (err: any) {
    return c.json(
      {
        status: 'error',
        message: err?.message || 'Database connection failed',
        code: 'D1_UNAVAILABLE',
        statusCode: 503,
        meta: { timestamp: new Date().toISOString() },
      },
      503
    );
  }
});

export default app;
