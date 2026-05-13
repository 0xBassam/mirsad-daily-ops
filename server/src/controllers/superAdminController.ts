import { Request, Response } from 'express';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { ClientRequest } from '../models/ClientRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPaginationParams, paginationMeta } from '../utils/paginate';

// ─── Platform stats ───────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalOrgs, activeOrgs, trialOrgs, suspendedOrgs,
    totalUsers, totalRequests, recentOrgs,
  ] = await Promise.all([
    Organization.countDocuments({}),
    Organization.countDocuments({ status: 'active' }),
    Organization.countDocuments({ status: 'trial' }),
    Organization.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: { $ne: 'superadmin' } }),
    ClientRequest.countDocuments({}),
    Organization.find({}).sort({ createdAt: -1 }).limit(5).select('name slug plan status createdAt').lean(),
  ]);

  const planBreakdown = await Organization.aggregate([
    { $group: { _id: '$plan', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      totalOrgs, activeOrgs, trialOrgs, suspendedOrgs,
      totalUsers, totalRequests,
      recentOrgs,
      planBreakdown: Object.fromEntries(planBreakdown.map(p => [p._id, p.count])),
    },
  });
});

// ─── List organizations ───────────────────────────────────────────────────────

export const getOrganizations = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.plan)   filter.plan   = req.query.plan;
  if (req.query.q) {
    filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { slug: { $regex: req.query.q, $options: 'i' } },
    ];
  }

  const [orgs, total] = await Promise.all([
    Organization.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('name slug plan status trialEndsAt planExpiresAt maxUsers maxProjects createdAt').lean(),
    Organization.countDocuments(filter),
  ]);

  // Attach user counts
  const orgIds = orgs.map(o => o._id);
  const userCounts = await User.aggregate([
    { $match: { organization: { $in: orgIds }, role: { $ne: 'superadmin' } } },
    { $group: { _id: '$organization', count: { $sum: 1 } } },
  ]);
  const ucMap = Object.fromEntries(userCounts.map(u => [u._id.toString(), u.count]));

  const data = orgs.map(o => ({ ...o, userCount: ucMap[o._id.toString()] ?? 0 }));

  res.json({ success: true, data, pagination: paginationMeta(total, page, limit) });
});

// ─── Org detail ───────────────────────────────────────────────────────────────

export const getOrganization = asyncHandler(async (req: Request, res: Response) => {
  const org = await Organization.findById(req.params.id).lean();
  if (!org) throw new AppError('Organization not found', 404);

  const [users, projects] = await Promise.all([
    User.find({ organization: org._id, role: { $ne: 'superadmin' } })
      .select('fullName email role status lastLoginAt createdAt').lean(),
    (await import('../models/Project')).Project.find({ organization: org._id })
      .select('name status createdAt').lean(),
  ]);

  res.json({ success: true, data: { org, users, projects } });
});

// ─── Update plan ──────────────────────────────────────────────────────────────

export const updateOrgPlan = asyncHandler(async (req: Request, res: Response) => {
  const { plan, maxUsers, maxProjects, storageLimitMb } = req.body;
  const org = await Organization.findById(req.params.id);
  if (!org) throw new AppError('Organization not found', 404);

  if (plan) org.plan = plan;
  if (maxUsers !== undefined)      org.maxUsers       = maxUsers;
  if (maxProjects !== undefined)   org.maxProjects    = maxProjects;
  if (storageLimitMb !== undefined) org.storageLimitMb = storageLimitMb;
  if (plan && plan !== 'trial') org.status = 'active';

  await org.save();
  res.json({ success: true, data: org });
});

// ─── Suspend org ──────────────────────────────────────────────────────────────

export const suspendOrg = asyncHandler(async (req: Request, res: Response) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new AppError('Organization not found', 404);
  if (org.status === 'suspended') throw new AppError('Already suspended', 400);
  org.status = 'suspended';
  org.suspendedAt = new Date();
  org.suspendedReason = req.body.reason || '';
  await org.save();
  res.json({ success: true, data: org });
});

// ─── Reactivate org ───────────────────────────────────────────────────────────

export const reactivateOrg = asyncHandler(async (req: Request, res: Response) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new AppError('Organization not found', 404);
  org.status = org.plan === 'trial' ? 'trial' : 'active';
  org.suspendedAt = undefined;
  org.suspendedReason = undefined;
  await org.save();
  res.json({ success: true, data: org });
});

// ─── Update feature flags ─────────────────────────────────────────────────────

export const updateFeatureFlags = asyncHandler(async (req: Request, res: Response) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new AppError('Organization not found', 404);
  const flags = req.body.featureFlags as Record<string, boolean>;
  if (flags && typeof flags === 'object') {
    for (const [key, val] of Object.entries(flags)) {
      org.featureFlags.set(key, val);
    }
  }
  await org.save();
  res.json({ success: true, data: org });
});
