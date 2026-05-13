import mongoose, { Document, Schema } from 'mongoose';

export type ApprovalStep = 'supervisor' | 'assistant_supervisor' | 'project_manager' | 'client';
export type ApprovalAction = 'submit' | 'review' | 'approve' | 'return' | 'reject' | 'close';

export interface IApprovalRecord extends Document {
  organization?: mongoose.Types.ObjectId;
  entityType: 'floor_check' | 'daily_plan' | 'report';
  entityId: mongoose.Types.ObjectId;
  step: ApprovalStep;
  action: ApprovalAction;
  actor: mongoose.Types.ObjectId;
  comment?: string;
  signatureAttachment?: mongoose.Types.ObjectId;
  version: number;
  createdAt: Date;
}

const approvalRecordSchema = new Schema<IApprovalRecord>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    entityType: {
      type: String,
      enum: ['floor_check', 'daily_plan', 'report'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    step: {
      type: String,
      enum: ['supervisor', 'assistant_supervisor', 'project_manager', 'client'],
      required: true,
    },
    action: {
      type: String,
      enum: ['submit', 'review', 'approve', 'return', 'reject', 'close'],
      required: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String },
    signatureAttachment: { type: Schema.Types.ObjectId, ref: 'Attachment' },
    version: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

approvalRecordSchema.index({ organization: 1 });
approvalRecordSchema.index({ entityType: 1, entityId: 1 });

export const ApprovalRecord = mongoose.model<IApprovalRecord>('ApprovalRecord', approvalRecordSchema);
