import mongoose, { Document, Schema } from 'mongoose';

export interface IBuilding extends Document {
  organization?: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const buildingSchema = new Schema<IBuilding>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

buildingSchema.index({ organization: 1 });
buildingSchema.index({ organization: 1, project: 1 });

export const Building = mongoose.model<IBuilding>('Building', buildingSchema);
