import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      message = `A record with this ${target.join(', ')} already exists`;
    } else if (err.code === 'P2025') {
      message = 'Record not found or operation failed';
    } else if (err.code === 'P2003') {
      message = 'Related record not found. Please check your references';
    } else if (err.code === 'P2014') {
      message = 'Invalid ID provided';
    } else if (err.code === 'P2023') {
      message = 'Inconsistent column data';
    } else {
      message = `Database error: ${err.message}`;
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided to database';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
};

export default errorHandler;
