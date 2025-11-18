/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.path} - ${statusCode}: ${message}`, {
    error: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}

export class HttpError extends Error implements ApiError {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'HttpError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = 'Validation Error') {
    super(message, 422, 'VALIDATION_ERROR');
  }
}
