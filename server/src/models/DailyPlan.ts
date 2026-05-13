import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyPlan extends Document {
  organization?: mongoose.Types.ObjectId;
  date: Date;
  project: mongoose.Types.ObjectId;
  building: mongoose.Types.ObjectId;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'closed';
  notes?: string;
  copiedFromDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dailyPlanSchema = new Schema<IDailyPlan>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    date: { type: Date, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'morning',
    },
    status: { type: String, enum: ['draft', 'published', 'in_progress', 'completed', 'closed'], default: 'draft' },
    notes: { type: String },
    copiedFromDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dailyPlanSchema.index({ organization: 1, date: -1 });
dailyPlanSchema.index({ organization: 1, project: 1, status: 1 });

export const DailyPlan = mongoose.model<IDailyPlan>('DailyPlan', dailyPlanSchema);
