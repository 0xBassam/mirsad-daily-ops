import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getDashboardStats } from '../services/dashboardService';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getDashboardStats();
  res.json({ success: true, data: stats });
});
