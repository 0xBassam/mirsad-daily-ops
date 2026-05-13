import { Request } from 'express';
import { AuditLog, AuditAction } from '../models/AuditLog';
import mongoose from 'mongoose';

interface LogOptions {
  userId?: string;
  organizationId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string | mongoose.Types.ObjectId;
  oldValue?: unknown;
  newValue?: unknown;
  req?: Request;
}

export async function logAction(opts: LogOptions): Promise<void> {
  try {
    const orgId = opts.organizationId ?? opts.req?.organizationId ?? null;
    await AuditLog.create({
      organization: orgId ? new mongoose.Types.ObjectId(orgId) : undefined,
      user: opts.userId ? new mongoose.Types.ObjectId(opts.userId) : undefined,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ? new mongoose.Types.ObjectId(opts.entityId.toString()) : undefined,
      oldValue: opts.oldValue,
      newValue: opts.newValue,
      ipAddress: opts.req?.ip,
      userAgent: opts.req?.headers['user-agent'],
    });
  } catch {
    // audit log failures should never crash the main operation
  }
}
