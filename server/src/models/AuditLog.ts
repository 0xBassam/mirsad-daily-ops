import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'submit'
  | 'review'
  | 'approve'
  | 'reject'
  | 'return'
  | 'export'
  | 'confirm'
  | 'cancel'
  | 'assign'
  | 'resolve'
  | 'deliver';

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  action: AuditAction;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      enum: ['login', 'logout', 'create', 'update', 'delete', 'submit', 'review', 'approve', 'reject', 'return', 'export'],
      required: true,
    },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
