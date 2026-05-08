import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyPlan extends Document {
  date: Date;
  project: mongoose.Types.ObjectId;
  building: mongoose.Types.ObjectId;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  status: 'draft' | 'published' | 'closed';
  notes?: string;
  copiedFromDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dailyPlanSchema = new Schema<IDailyPlan>(
  {
    date: { type: Date, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'morning',
    },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
    notes: { type: String },
    copiedFromDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const DailyPlan = mongoose.model<IDailyPlan>('DailyPlan', dailyPlanSchema);
