import mongoose, { Document, Schema } from 'mongoose';

interface ITransferLine {
  item: mongoose.Types.ObjectId;
  quantity: number;
  notes?: string;
}

export interface ITransfer extends Document {
  organization?: mongoose.Types.ObjectId;
  project:  mongoose.Types.ObjectId;
  building: mongoose.Types.ObjectId;
  floor:    mongoose.Types.ObjectId;
  lines: ITransferLine[];
  status: 'draft' | 'confirmed' | 'cancelled';
  transferDate: Date;
  notes?: string;
  createdBy:    mongoose.Types.ObjectId;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
}

const lineSchema = new Schema<ITransferLine>({
  item:     { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes:    String,
}, { _id: true });

const transferSchema = new Schema<ITransfer>({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  project:  { type: Schema.Types.ObjectId, ref: 'Project',  required: true },
  building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
  floor:    { type: Schema.Types.ObjectId, ref: 'Floor',    required: true },
  lines:    [lineSchema],
  status:   { type: String, enum: ['draft', 'confirmed', 'cancelled'], default: 'draft' },
  transferDate: { type: Date, default: Date.now },
  notes:       String,
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
}, { timestamps: true });

transferSchema.index({ organization: 1, project: 1, status: 1, transferDate: -1 });
transferSchema.index({ project: 1, status: 1, transferDate: -1 });

export const Transfer = mongoose.model<ITransfer>('Transfer', transferSchema);
