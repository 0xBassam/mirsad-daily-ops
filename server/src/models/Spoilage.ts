import mongoose, { Document, Schema } from 'mongoose';

export type SpoilageReason = 'expired' | 'damaged' | 'temperature_issue' | 'packaging_issue' | 'quality_issue' | 'spoiled' | 'other';
export type SpoilageAlertType = 'expired' | 'near_expiry' | 'temperature_breach' | 'damaged' | 'spoiled';
export type SpoilageStatus = 'active' | 'resolved' | 'dismissed';

export interface ISpoilage extends Document {
  item: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  quantity: number;
  reason: SpoilageReason;
  alertType: SpoilageAlertType;
  location: string;
  storageZone?: string;
  date: Date;
  daysUntilExpiry?: number;
  notes?: string;
  photo?: string;
  status: SpoilageStatus;
  detectedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const spoilageSchema = new Schema<ISpoilage>(
  {
    item:            { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    batch:           { type: Schema.Types.ObjectId, ref: 'Batch' },
    project:         { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    quantity:        { type: Number, required: true, min: 0 },
    reason:          { type: String, enum: ['expired', 'damaged', 'temperature_issue', 'packaging_issue', 'quality_issue', 'spoiled', 'other'], required: true },
    alertType:       { type: String, enum: ['expired', 'near_expiry', 'temperature_breach', 'damaged', 'spoiled'], required: true },
    location:        { type: String, required: true, trim: true },
    storageZone:     { type: String },
    date:            { type: Date, required: true },
    daysUntilExpiry: { type: Number },
    notes:           { type: String, trim: true },
    photo:           { type: String },
    status:          { type: String, enum: ['active', 'resolved', 'dismissed'], default: 'active' },
    detectedAt:      { type: Date, default: Date.now },
    createdBy:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt:      { type: Date },
  },
  { timestamps: true }
);

spoilageSchema.index({ project: 1, status: 1, detectedAt: -1 });
spoilageSchema.index({ item: 1, date: -1 });

export const Spoilage = mongoose.model<ISpoilage>('Spoilage', spoilageSchema);
