import { Request, Response } from 'express';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Project } from '../models/Project';
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

// ─── Signup ───────────────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const {
    orgName, slug, adminFullName, adminEmail, adminPassword,
    plan = 'trial', siteName,
    logoUrl, primaryColor, contactPhone,
  } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!orgName?.trim())       throw new AppError('Organization name is required', 400);
  if (!slug?.trim())          throw new AppError('Organization slug is required', 400);
  if (!SLUG_RE.test(slug))    throw new AppError('Slug may only contain lowercase letters, numbers, and hyphens', 400);
  if (!adminFullName?.trim()) throw new AppError('Admin full name is required', 400);
  if (!adminEmail?.trim())    throw new AppError('Admin email is required', 400);
  if (!EMAIL_RE.test(adminEmail)) throw new AppError('Invalid email address', 400);
  if (!adminPassword || adminPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);
  if (!siteName?.trim())      throw new AppError('First site/location name is required', 400);
  if (!['trial', 'starter', 'professional', 'enterprise'].includes(plan))
    throw new AppError('Invalid plan selection', 400);

  const [slugTaken, emailTaken] = await Promise.all([
    Organization.exists({ slug }),
    User.exists({ email: adminEmail.toLowerCase() }),
  ]);
  if (slugTaken)  throw new AppError('Organization slug is already taken — please choose another', 409);
  if (emailTaken) throw new AppError('Email is already registered', 409);

  // ── Create Organization ────────────────────────────────────────────────────
  const trialEndsAt = plan === 'trial' ? new Date(Date.now() + 14 * 86_400_000) : undefined;
  const org = await Organization.create({
    name: orgName.trim(),
    slug: slug.trim(),
    plan,
    status: plan === 'trial' ? 'trial' : 'active',
    trialEndsAt,
    contactPhone: contactPhone?.trim(),
    settings: {
      logoUrl:      logoUrl?.trim()      || '',
      primaryColor: primaryColor?.trim() || '',
    },
  });

  // ── Create Admin User ──────────────────────────────────────────────────────
  const admin = await User.create({
    fullName:     adminFullName.trim(),
    email:        adminEmail.toLowerCase().trim(),
    password:     adminPassword,
    role:         'admin',
    organization: org._id,
    status:       'active',
  });

  // ── Create First Site/Project ──────────────────────────────────────────────
  await Project.create({
    name:         siteName.trim(),
    organization: org._id,
    status:       'active',
    createdBy:    admin._id,
  });

  await logAction({ userId: admin._id.toString(), action: 'create', entityType: 'organization', entityId: org._id, req });

  const token = generateToken({
    userId:         admin._id.toString(),
    role:           admin.role,
    email:          admin.email,
    organizationId: org._id.toString(),
    plan:           org.plan,
  });

  res.status(201).json({
    success: true,
    token,
    user: {
      _id:            admin._id,
      fullName:       admin.fullName,
      email:          admin.email,
      role:           admin.role,
      organizationId: org._id.toString(),
      orgName:        org.name,
      plan:           org.plan,
    },
  });
});
