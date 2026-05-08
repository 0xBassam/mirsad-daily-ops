import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyPlanLine extends Document {
  dailyPlan: mongoose.Types.ObjectId;
  floor: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  plannedQty: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyPlanLineSchema = new Schema<IDailyPlanLine>(
  {
    dailyPlan: { type: Schema.Types.ObjectId, ref: 'DailyPlan', required: true },
    floor: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    plannedQty: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

export const DailyPlanLine = mongoose.model<IDailyPlanLine>('DailyPlanLine', dailyPlanLineSchema);
