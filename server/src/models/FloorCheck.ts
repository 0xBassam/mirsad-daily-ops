import mongoose, { Document, Schema } from 'mongoose';

export type FloorCheckStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'returned'
  | 'approved'
  | 'rejected'
  | 'closed';

export interface IFloorCheck extends Document {
  dailyPlan?: mongoose.Types.ObjectId;
  date: Date;
  project: mongoose.Types.ObjectId;
  building: mongoose.Types.ObjectId;
  floor: mongoose.Types.ObjectId;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  supervisor: mongoose.Types.ObjectId;
  checkTime?: Date;
  status: FloorCheckStatus;
  notes?: string;
  signatureAttachment?: mongoose.Types.ObjectId;
  approvalRecords: mongoose.Types.ObjectId[];
  currentApprovalStep: 'supervisor' | 'assistant_supervisor' | 'project_manager' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

const floorCheckSchema = new Schema<IFloorCheck>(
  {
    dailyPlan: { type: Schema.Types.ObjectId, ref: 'DailyPlan' },
    date: { type: Date, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    floor: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'morning',
    },
    supervisor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkTime: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'returned', 'approved', 'rejected', 'closed'],
      default: 'draft',
    },
    notes: { type: String },
    signatureAttachment: { type: Schema.Types.ObjectId, ref: 'Attachment' },
    approvalRecords: [{ type: Schema.Types.ObjectId, ref: 'ApprovalRecord' }],
    currentApprovalStep: {
      type: String,
      enum: ['supervisor', 'assistant_supervisor', 'project_manager', 'client'],
      default: 'supervisor',
    },
  },
  { timestamps: true }
);

floorCheckSchema.index({ date: -1, project: 1, status: 1 });

export const FloorCheck = mongoose.model<IFloorCheck>('FloorCheck', floorCheckSchema);
