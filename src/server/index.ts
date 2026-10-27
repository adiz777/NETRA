import { Hono } from 'hono';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import casesRoutes from './routes/cases.js';
import dossiersRoutes from './routes/dossiers.js';
import evidenceRoutes from './routes/evidence.js';
import notesRoutes from './routes/notes.js';
import timelinesRoutes from './routes/timelines.js';

type AppEnv = {
  Variables: {
    requestId: string;
  };
};

const app = new Hono<AppEnv>();

// Global Request ID & Timestamp middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || `req_${crypto.randomUUID().replace(/-/g, '')}`;
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  await next();
});

// Centralized API router
const api = new Hono();

// System Health (Public)
api.route('/', healthRoutes);
app.route('/', healthRoutes); // Also mount at /health for root health checks

// Authentication routes (/api/auth/*)
api.route('/auth', authRoutes);

// Child entity routes mounted before cases sub-router to ensure specific routes resolve
api.route('/', dossiersRoutes);
api.route('/', evidenceRoutes);
api.route('/', notesRoutes);
api.route('/', timelinesRoutes);

// Case management routes (/api/cases/*)
api.route('/cases', casesRoutes);

// Mount API router at /api
app.route('/api', api);

// Not Found Handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `Cannot ${c.req.method} ${c.req.path}`,
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      },
    },
    404
  );
});

// Global Error Handler
app.onError((err, c) => {
  console.error('[NETRA Server Error]', err);
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      },
    },
    500
  );
});

export { app };
export default app;
