import { Request, Response } from 'express';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { generateToken } from '../utils/generateToken';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { logAction } from '../services/auditService';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status === 'inactive') throw new AppError('Account is disabled', 403);

  user.lastLoginAt = new Date();
  await user.save();

  await logAction({ userId: user._id.toString(), action: 'login', entityType: 'user', entityId: user._id, req });

  // Resolve organization info for JWT
  const orgId = user.organization ? user.organization.toString() : null;
  let orgName = '';
  let plan = 'trial';
  if (orgId) {
    const org = await Organization.findById(orgId).select('name plan status').lean();
    if (org) {
      orgName = org.name;
      plan = org.plan;
      if (org.status === 'suspended') throw new AppError('Organization is suspended', 403);
    }
  }

  const token = generateToken({
    userId:         user._id.toString(),
    role:           user.role,
    email:          user.email,
    organizationId: orgId,
    plan,
  });

  res.json({
    success: true,
    token,
    user: {
      _id:            user._id,
      fullName:       user.fullName,
      email:          user.email,
      role:           user.role,
      project:        user.project,
      organizationId: orgId,
      orgName,
      plan,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await logAction({ userId: req.user?.userId, action: 'logout', entityType: 'user', req });
  res.json({ success: true });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).populate('project', 'name');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});
