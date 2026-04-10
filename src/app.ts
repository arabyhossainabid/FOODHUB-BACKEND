import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import passport from './config/passport';
import router from './routes';
import errorHandler from './middlewares/errorHandler';

import requestLogger from './middlewares/requestLogger';
import { apiLimiter } from './middlewares/rateLimit';

const app: Application = express();
const allowedOrigins = new Set(
  [
    // Common local frontend ports
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    // Deployed frontends
    'https://foodhub-virid.vercel.app',
    'https://foodhubzone.vercel.app',
    'https://foodhub-frontend.vercel.app',
    'https://foodhub.vercel.app',
    // Deployed backend (debugging)
    'https://foodhub-backend-api.vercel.app',
    // Environment-based overrides
    process.env.FRONTEND_URL as string,
    process.env.APP_URL as string,
  ].filter(Boolean),
);

const isLocalOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(helmet());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(
  express.json({
    // Only parse JSON bodies. This prevents breaking multipart/form-data (uploads)
    // and other non-JSON requests.
    type: (req: any) => {
      if (req.originalUrl?.startsWith('/api/payments/webhook')) return false;
      const contentType = (req.headers['content-type'] || '').toString();
      return contentType.includes('application/json') || contentType.includes('+json');
    },
    limit: '2mb',
  }),
);
app.use(requestLogger);
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server and tools that don't send Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin) || isLocalOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
}));
app.use(cookieParser());
app.use(passport.initialize());

// Apply Rate Limiting to API routes
app.use('/api', apiLimiter);

// Application Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('FoodHub Backend Running!');
});

app.use(errorHandler);

export default app;
