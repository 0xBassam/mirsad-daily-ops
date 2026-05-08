import mongoose, { Document, Schema } from 'mongoose';

export type StorageZone = 'cold' | 'chilled' | 'freezer' | 'ambient' | 'dry_storage' | 'coffee_station' | 'hospitality';
export type BatchStatus = 'active' | 'consumed' | 'expired' | 'spoiled' | 'recalled';

export interface IBatch extends Document {
  batchNumber: string;
  item: mongoose.Types.ObjectId;
  supplier: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  quantity: number;
  remainingQty: number;
  receivedDate: Date;
  expiryDate?: Date;
  storageZone: StorageZone;
  status: BatchStatus;
  purchaseOrder?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    batchNumber:   { type: String, required: true, trim: true, unique: true },
    item:          { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    supplier:      { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    project:       { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    quantity:      { type: Number, required: true, min: 0 },
    remainingQty:  { type: Number, required: true, min: 0 },
    receivedDate:  { type: Date, required: true },
    expiryDate:    { type: Date },
    storageZone:   { type: String, enum: ['cold', 'chilled', 'freezer', 'ambient', 'dry_storage', 'coffee_station', 'hospitality'], required: true },
    status:        { type: String, enum: ['active', 'consumed', 'expired', 'spoiled', 'recalled'], default: 'active' },
    purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    notes:         { type: String, trim: true },
    createdBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

batchSchema.index({ project: 1, item: 1, status: 1 });
batchSchema.index({ expiryDate: 1, status: 1 }); // FEFO queries
batchSchema.index({ receivedDate: 1, status: 1 }); // FIFO queries

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
