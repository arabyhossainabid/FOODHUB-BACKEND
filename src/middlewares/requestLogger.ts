import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware for debugging and monitoring
 */
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};

export default requestLogger;
