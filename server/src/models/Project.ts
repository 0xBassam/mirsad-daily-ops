import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  organization?: mongoose.Types.ObjectId;
  name: string;
  clientName?: string;
  locationCode?: string;
  status: 'active' | 'inactive';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    name: { type: String, required: true, trim: true },
    clientName: { type: String, trim: true },
    locationCode: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
