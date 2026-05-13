import mongoose, { Document, Schema } from 'mongoose';

export type ReportType =
  | 'daily_floor_check'
  | 'daily_project_summary'
  | 'weekly_warehouse'
  | 'monthly_food_inventory'
  | 'monthly_materials'
  | 'approval_summary'
  | 'food_stock_balance';

export interface IReport extends Document {
  organization?: mongoose.Types.ObjectId;
  reportType: ReportType;
  title?: string;
  project?: mongoose.Types.ObjectId;
  building?: mongoose.Types.ObjectId;
  floor?: mongoose.Types.ObjectId;
  dateFrom?: Date;
  dateTo?: Date;
  generatedBy?: mongoose.Types.ObjectId;
  status: 'generated' | 'exported';
  pdfUrl?: string;
  excelUrl?: string;
  params?: Record<string, unknown>;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    reportType: {
      type: String,
      enum: ['daily_floor_check', 'daily_project_summary', 'weekly_warehouse', 'monthly_food_inventory', 'monthly_materials', 'approval_summary', 'food_stock_balance'],
      required: true,
    },
    title: { type: String },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    building: { type: Schema.Types.ObjectId, ref: 'Building' },
    floor: { type: Schema.Types.ObjectId, ref: 'Floor' },
    dateFrom: { type: Date },
    dateTo: { type: Date },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['generated', 'exported'], default: 'generated' },
    pdfUrl: { type: String },
    excelUrl: { type: String },
    params: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reportSchema.index({ organization: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
