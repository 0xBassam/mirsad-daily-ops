import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  if ((err as unknown as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate value — record already exists' });
    return;
  }

  console.error(`[500] ${err.name}: ${err.message}`, err.stack?.split('\n')[1]?.trim() ?? '');
  res.status(500).json({ success: false, message: 'Internal server error' });
}
