import mongoose, { Document, Schema } from 'mongoose';

export type LineStatus = 'ok' | 'shortage' | 'extra' | 'not_available' | 'replaced' | 'needs_review';

export interface IFloorCheckLine extends Document {
  floorCheck: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  plannedQty: number;
  actualQty: number;
  difference: number;
  lineStatus: LineStatus;
  notes?: string;
  photos: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const floorCheckLineSchema = new Schema<IFloorCheckLine>(
  {
    floorCheck: { type: Schema.Types.ObjectId, ref: 'FloorCheck', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    plannedQty: { type: Number, default: 0, min: 0 },
    actualQty: { type: Number, default: 0, min: 0 },
    difference: { type: Number, default: 0 },
    lineStatus: {
      type: String,
      enum: ['ok', 'shortage', 'extra', 'not_available', 'replaced', 'needs_review'],
      default: 'ok',
    },
    notes: { type: String },
    photos: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
  },
  { timestamps: true }
);

floorCheckLineSchema.pre('save', function (next) {
  this.difference = this.actualQty - this.plannedQty;
  next();
});

floorCheckLineSchema.index({ floorCheck: 1 });

export const FloorCheckLine = mongoose.model<IFloorCheckLine>('FloorCheckLine', floorCheckLineSchema);
