import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getDashboardStats } from '../services/dashboardService';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getDashboardStats(req.organizationId as string);
  res.json({ success: true, data: stats });
});
