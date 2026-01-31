import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.validation';

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await AuthService.register(validatedData);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User logged in successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'User not authenticated' };
    }

    const { password, ...userWithoutPassword } = user as any;

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User profile retrieved successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

const googleAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw { statusCode: 401, message: 'Authentication failed' };
    }

    const result = await AuthService.googleAuthCallback(user as any);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.APP_URL || 'http://localhost:4000';
    res.redirect(`${frontendUrl}/auth/google/success?token=${result.token}`);
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  register,
  login,
  getMe,
  googleAuthCallback
};
