import mongoose, { Document, Schema } from 'mongoose';

export interface IFloor extends Document {
  building: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  locationCode?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const floorSchema = new Schema<IFloor>(
  {
    building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    locationCode: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Floor = mongoose.model<IFloor>('Floor', floorSchema);
