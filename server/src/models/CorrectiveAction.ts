import mongoose, { Document, Schema } from 'mongoose';

export type CorrectiveActionSourceType = 'fridge_check' | 'floor_check' | 'inventory' | 'manual';
export type CorrectiveActionPriority   = 'low' | 'medium' | 'high' | 'critical';
export type CorrectiveActionStatus     = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ICorrectiveAction extends Document {
  title:       string;
  description: string;
  sourceType:  CorrectiveActionSourceType;
  sourceRef?:  mongoose.Types.ObjectId;
  assignedTo:  mongoose.Types.ObjectId;
  dueDate:     Date;
  priority:    CorrectiveActionPriority;
  status:      CorrectiveActionStatus;
  resolution?: string;
  resolvedAt?: Date;
  createdBy:   mongoose.Types.ObjectId;
  project:     mongoose.Types.ObjectId;
}

const correctiveActionSchema = new Schema<ICorrectiveAction>({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  sourceType:  { type: String, enum: ['fridge_check','floor_check','inventory','manual'], required: true },
  sourceRef:   { type: Schema.Types.ObjectId },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate:     { type: Date, required: true },
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:      { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
  resolution:  String,
  resolvedAt:  Date,
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
}, { timestamps: true });

correctiveActionSchema.index({ project: 1, status: 1, priority: 1 });
correctiveActionSchema.index({ assignedTo: 1, status: 1 });

export const CorrectiveAction = mongoose.model<ICorrectiveAction>('CorrectiveAction', correctiveActionSchema);
