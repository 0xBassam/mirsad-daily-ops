import mongoose, { Document, Schema } from 'mongoose';

export type MaintenanceCategory = 'electrical' | 'plumbing' | 'hvac' | 'equipment' | 'cleaning' | 'structural' | 'other';
export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export interface IMaintenanceRequest extends Document {
  title:       string;
  description: string;
  project:     mongoose.Types.ObjectId;
  building:    mongoose.Types.ObjectId;
  floor?:      mongoose.Types.ObjectId;
  category:    MaintenanceCategory;
  priority:    MaintenancePriority;
  status:      MaintenanceStatus;
  reportedBy:  mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
  notes?:      string;
}

const maintenanceSchema = new Schema<IMaintenanceRequest>({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  project:     { type: Schema.Types.ObjectId, ref: 'Project',  required: true },
  building:    { type: Schema.Types.ObjectId, ref: 'Building', required: true },
  floor:       { type: Schema.Types.ObjectId, ref: 'Floor' },
  category:    { type: String, enum: ['electrical','plumbing','hvac','equipment','cleaning','structural','other'], required: true },
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:      { type: String, enum: ['open','assigned','in_progress','resolved','closed'], default: 'open' },
  reportedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User' },
  assignedAt:  Date,
  resolvedAt:  Date,
  resolution:  String,
  notes:       String,
}, { timestamps: true });

maintenanceSchema.index({ project: 1, status: 1, priority: 1 });

export const MaintenanceRequest = mongoose.model<IMaintenanceRequest>('MaintenanceRequest', maintenanceSchema);
