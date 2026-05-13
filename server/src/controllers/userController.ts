import { Request, Response } from 'express';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getPaginationParams, paginationMeta } from '../utils/paginate';
import { logAction } from '../services/auditService';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = { organization: orgId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) filter.fullName = { $regex: req.query.search, $options: 'i' };

  const [users, total] = await Promise.all([
    User.find(filter).populate('project', 'name').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: users, pagination: paginationMeta(total, page, limit) });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const user = await User.findOne({ _id: req.params.id, organization: orgId }).populate('project', 'name');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const user = await User.create({ ...req.body, organization: orgId });
  await logAction({ userId: req.user?.userId, action: 'create', entityType: 'user', entityId: user._id, req });
  res.status(201).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const { password, ...rest } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    rest,
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);
  await logAction({ userId: req.user?.userId, action: 'update', entityType: 'user', entityId: req.params.id, req });
  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.organizationId as string;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, organization: orgId },
    { status: 'inactive' },
    { new: true }
  );
  if (!user) throw new AppError('User not found', 404);
  await logAction({ userId: req.user?.userId, action: 'delete', entityType: 'user', entityId: req.params.id, req });
  res.json({ success: true, data: user });
});
