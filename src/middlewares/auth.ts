import { NextFunction, Request, Response } from 'express';
import passport from '../config/passport';
import { Role, User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const auth = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: User | false, info: any) => {
      if (err || !user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'You are not authorized',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: 'Your account has been suspended',
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: 'Forbidden: You do not have permission to access this resource',
        });
      }

      req.user = user;
      next();
    })(req, res, next);
  };
};

export default auth;
