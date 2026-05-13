import mongoose, { Document, Schema } from 'mongoose';

export type LineStatus = 'pending' | 'in_progress' | 'completed' | 'shortage';

export interface IDailyPlanLine extends Document {
  dailyPlan: mongoose.Types.ObjectId;
  floor: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  plannedQty: number;
  actualQty: number;
  assignedTo?: mongoose.Types.ObjectId;
  lineStatus: LineStatus;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyPlanLineSchema = new Schema<IDailyPlanLine>(
  {
    dailyPlan:   { type: Schema.Types.ObjectId, ref: 'DailyPlan', required: true },
    floor:       { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    item:        { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    plannedQty:  { type: Number, required: true, min: 0 },
    actualQty:   { type: Number, default: 0, min: 0 },
    assignedTo:  { type: Schema.Types.ObjectId, ref: 'User' },
    lineStatus:  { type: String, enum: ['pending', 'in_progress', 'completed', 'shortage'], default: 'pending' },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    notes:       { type: String },
  },
  { timestamps: true }
);

dailyPlanLineSchema.index({ dailyPlan: 1 });
dailyPlanLineSchema.index({ assignedTo: 1 });

export const DailyPlanLine = mongoose.model<IDailyPlanLine>('DailyPlanLine', dailyPlanLineSchema);
