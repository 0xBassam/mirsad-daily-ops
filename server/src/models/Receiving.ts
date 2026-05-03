import mongoose, { Document, Schema } from 'mongoose';

interface IReceivingLine {
  item:              mongoose.Types.ObjectId;
  purchaseOrderLine?: mongoose.Types.ObjectId;
  quantityOrdered:  number;
  quantityReceived: number;
  condition:        'good' | 'damaged' | 'rejected';
  batchNumber?:     string;
  expiryDate?:      Date;
  notes?:           string;
}

export interface IReceiving extends Document {
  project:        mongoose.Types.ObjectId;
  supplier:       mongoose.Types.ObjectId;
  purchaseOrder?: mongoose.Types.ObjectId;
  deliveryDate:   Date;
  lines:          IReceivingLine[];
  status:         'pending' | 'confirmed' | 'partial' | 'rejected';
  invoiceNumber?: string;
  notes?:         string;
  receivedBy?:    mongoose.Types.ObjectId;
  confirmedBy?:   mongoose.Types.ObjectId;
  confirmedAt?:   Date;
}

const lineSchema = new Schema<IReceivingLine>({
  item:              { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  purchaseOrderLine: Schema.Types.ObjectId,
  quantityOrdered:   { type: Number, required: true, min: 0 },
  quantityReceived:  { type: Number, required: true, min: 0 },
  condition:         { type: String, enum: ['good', 'damaged', 'rejected'], default: 'good' },
  batchNumber:       String,
  expiryDate:        Date,
  notes:             String,
}, { _id: true });

const receivingSchema = new Schema<IReceiving>({
  project:       { type: Schema.Types.ObjectId, ref: 'Project',      required: true },
  supplier:      { type: Schema.Types.ObjectId, ref: 'Supplier',     required: true },
  purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  deliveryDate:  { type: Date, default: Date.now },
  lines: [lineSchema],
  status: { type: String, enum: ['pending', 'confirmed', 'partial', 'rejected'], default: 'pending' },
  invoiceNumber: String,
  notes:         String,
  receivedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  confirmedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  confirmedAt:   Date,
}, { timestamps: true });

receivingSchema.index({ project: 1, status: 1, deliveryDate: -1 });
receivingSchema.index({ purchaseOrder: 1 });

export const Receiving = mongoose.model<IReceiving>('Receiving', receivingSchema);
