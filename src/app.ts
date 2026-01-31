import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import router from './routes';
import errorHandler from './middlewares/errorHandler';

import requestLogger from './middlewares/requestLogger';
import { apiLimiter } from './middlewares/rateLimit';

const app: Application = express();

app.use(express.json());
app.use(requestLogger);
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    // Deployed frontends
    'https://foodhub-virid.vercel.app',
    'https://foodhubzone.vercel.app',
    'https://foodhub-frontend.vercel.app',
    'https://foodhub.vercel.app',
    // Deployed backends (for tools / debugging if ever called from a browser)
    'https://foodhub-backend-api.vercel.app',
    // Environment-based overrides
    process.env.FRONTEND_URL as string,
    process.env.APP_URL as string,
  ].filter(Boolean),
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
