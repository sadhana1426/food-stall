import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';
import { config } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    return res.status(statusCode).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: err.errors,
      },
    });
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    return res.status(statusCode).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message,
      },
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
      message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
