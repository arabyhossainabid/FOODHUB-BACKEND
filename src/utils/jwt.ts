import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/env';

export const generateToken = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: config.jwt_expires_in as any,
  };

  return jwt.sign(payload, config.jwt_secret as string, options);
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwt_secret as string);
  } catch (error) {
    return null;
  }
};
