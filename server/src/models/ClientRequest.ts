import mongoose, { Document, Schema } from 'mongoose';

export type ClientRequestType   = 'catering' | 'maintenance' | 'supplies' | 'event' | 'housekeeping' | 'other';
export type ClientRequestStatus = 'submitted' | 'assigned' | 'in_progress' | 'delivered' | 'confirmed' | 'rejected';
export type ClientRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

interface IRequestItem {
  name:      string;
  quantity:  number;
  unit?:     string;
}

export interface IClientRequest extends Document {
  title:             string;
  description:       string;
  requestType:       ClientRequestType;
  priority:          ClientRequestPriority;
  project:           mongoose.Types.ObjectId;
  building?:         mongoose.Types.ObjectId;
  floor?:            mongoose.Types.ObjectId;
  requestedBy:       mongoose.Types.ObjectId;
  assignedTo?:       mongoose.Types.ObjectId;
  status:            ClientRequestStatus;
  items:             IRequestItem[];
  expectedDelivery?: Date;
  deliveredAt?:      Date;
  confirmedAt?:      Date;
  rejectionReason?:  string;
  notes?:            string;
}

const itemSchema = new Schema<IRequestItem>({
  name:     { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit:     String,
}, { _id: false });

const clientRequestSchema = new Schema<IClientRequest>({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requestType: { type: String, enum: ['catering','maintenance','supplies','event','housekeeping','other'], required: true },
  priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  project:     { type: Schema.Types.ObjectId, ref: 'Project',  required: true },
  building:    { type: Schema.Types.ObjectId, ref: 'Building' },
  floor:       { type: Schema.Types.ObjectId, ref: 'Floor' },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User' },
  status:      { type: String, enum: ['submitted','assigned','in_progress','delivered','confirmed','rejected'], default: 'submitted' },
  items:       [itemSchema],
  expectedDelivery: Date,
  deliveredAt:      Date,
  confirmedAt:      Date,
  rejectionReason:  String,
  notes:            String,
}, { timestamps: true });

clientRequestSchema.index({ project: 1, status: 1, requestedBy: 1 });

export const ClientRequest = mongoose.model<IClientRequest>('ClientRequest', clientRequestSchema);
