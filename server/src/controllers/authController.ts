import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Project } from '../models/Project';
import { Otp } from '../models/Otp';
import { generateToken } from '../utils/generateToken';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { logAction } from '../services/auditService';
import { sendPlatformOtpEmail } from '../services/emailService';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status === 'inactive') throw new AppError('Account is disabled', 403);

  // Block unverified users (superadmin is exempt)
  if (user.role !== 'superadmin' && user.emailVerified !== true) {
    throw new AppError('Please verify your email address before logging in. Check your inbox for the verification code.', 403);
  }

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
    siteName,
    logoUrl, primaryColor, contactPhone,
  } = req.body;

  // Plan is ALWAYS trial — ignore any submitted plan value
  const plan = 'trial';

  // ── Validation ────────────────────────────────────────────────────────────
  if (!orgName?.trim())       throw new AppError('Organization name is required', 400);
  if (!slug?.trim())          throw new AppError('Organization slug is required', 400);
  if (!SLUG_RE.test(slug))    throw new AppError('Slug may only contain lowercase letters, numbers, and hyphens', 400);
  if (!adminFullName?.trim()) throw new AppError('Admin full name is required', 400);
  if (!adminEmail?.trim())    throw new AppError('Admin email is required', 400);
  if (!EMAIL_RE.test(adminEmail)) throw new AppError('Invalid email address', 400);
  if (!adminPassword || adminPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);
  if (!siteName?.trim())      throw new AppError('First site/location name is required', 400);

  const [slugTaken, emailTaken] = await Promise.all([
    Organization.exists({ slug }),
    User.exists({ email: adminEmail.toLowerCase() }),
  ]);
  if (slugTaken)  throw new AppError('Organization slug is already taken — please choose another', 409);
  if (emailTaken) throw new AppError('Email is already registered', 409);

  // ── Create Organization (pending verification) ─────────────────────────────
  const trialEndsAt = new Date(Date.now() + 14 * 86_400_000);
  const org = await Organization.create({
    name: orgName.trim(),
    slug: slug.trim(),
    plan,
    status: 'pending_verification',
    trialEndsAt,
    contactPhone: contactPhone?.trim(),
    settings: {
      logoUrl:      logoUrl?.trim()      || '',
      primaryColor: primaryColor?.trim() || '',
    },
  });

  // ── Create Admin User (inactive, unverified) ───────────────────────────────
  const admin = await User.create({
    fullName:      adminFullName.trim(),
    email:         adminEmail.toLowerCase().trim(),
    password:      adminPassword,
    role:          'admin',
    organization:  org._id,
    status:        'inactive',
    emailVerified: false,
  });

  // ── Create First Site/Project ──────────────────────────────────────────────
  await Project.create({
    name:         siteName.trim(),
    organization: org._id,
    status:       'active',
    createdBy:    admin._id,
  });

  // ── Generate and store OTP ─────────────────────────────────────────────────
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 8);
  const email = admin.email;

  await Otp.findOneAndUpdate(
    { email },
    {
      otpHash,
      expiresAt:    new Date(Date.now() + 10 * 60 * 1000),
      attempts:     0,
      resendCount:  0,
      lastResendAt: undefined,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // ── Send OTP email ─────────────────────────────────────────────────────────
  await sendPlatformOtpEmail(admin.email, otp, orgName.trim());

  res.status(201).json({
    success:              true,
    requiresVerification: true,
    email:                admin.email,
  });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError('Email and OTP are required', 400);

  const record = await Otp.findOne({ email: email.toLowerCase().trim() });
  if (!record) throw new AppError('No pending verification found for this email. Please sign up or request a new code.', 404);
  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ email: record.email });
    throw new AppError('Verification code has expired. Please request a new one.', 410);
  }
  if (record.attempts >= 5) throw new AppError('Too many failed attempts. Please request a new verification code.', 429);

  const valid = await bcrypt.compare(String(otp), record.otpHash);
  if (!valid) {
    await Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    const remaining = 4 - record.attempts;
    throw new AppError(`Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts remaining — please request a new code.'}`, 400);
  }

  // Valid OTP — activate
  await Otp.deleteOne({ _id: record._id });

  const user = await User.findOneAndUpdate(
    { email: record.email },
    { $set: { status: 'active', emailVerified: true } },
    { new: true }
  );
  if (!user) throw new AppError('User not found', 404);

  const orgId = user.organization?.toString() ?? null;
  if (orgId) {
    await Organization.findByIdAndUpdate(orgId, { $set: { status: 'trial' } });
  }
  await logAction({ userId: user._id.toString(), action: 'create', entityType: 'user', entityId: user._id, req });

  const token = generateToken({
    userId:         user._id.toString(),
    role:           user.role,
    email:          user.email,
    organizationId: orgId,
    plan:           'trial',
  });

  res.json({
    success: true,
    token,
    user: {
      _id:            user._id,
      fullName:       user.fullName,
      email:          user.email,
      role:           user.role,
      organizationId: orgId,
      orgName:        '',
      plan:           'trial',
    },
  });
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required', 400);
  const emailNorm = email.toLowerCase().trim();

  const record = await Otp.findOne({ email: emailNorm });
  if (!record) throw new AppError('No pending verification found for this email.', 404);

  // Rate limit: max 5 resends, min 60 seconds between resends
  if (record.resendCount >= 5) throw new AppError('Maximum resend limit reached. Please contact support.', 429);
  if (record.lastResendAt && (Date.now() - record.lastResendAt.getTime()) < 60_000) {
    throw new AppError('Please wait at least 60 seconds before requesting a new code.', 429);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 8);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.updateOne(
    { _id: record._id },
    { $set: { otpHash, expiresAt, attempts: 0, lastResendAt: new Date() }, $inc: { resendCount: 1 } }
  );

  // Get org name for the email
  const user = await User.findOne({ email: emailNorm }).select('organization').lean();
  let orgName = 'Mirsad';
  if (user?.organization) {
    const org = await Organization.findById(user.organization).select('name').lean();
    if (org) orgName = org.name;
  }

  await sendPlatformOtpEmail(emailNorm, otp, orgName);
  res.json({ success: true, message: 'A new verification code has been sent to your email.' });
});
