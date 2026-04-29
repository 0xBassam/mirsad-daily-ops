import mongoose, { Document, Schema } from 'mongoose';

export interface IBuilding extends Document {
  project: mongoose.Types.ObjectId;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const buildingSchema = new Schema<IBuilding>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Building = mongoose.model<IBuilding>('Building', buildingSchema);
