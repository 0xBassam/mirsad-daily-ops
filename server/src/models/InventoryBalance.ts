import mongoose, { Document, Schema } from 'mongoose';

export type InventoryStatus = 'available' | 'low_stock' | 'out_of_stock' | 'over_consumed';

export interface IInventoryBalance extends Document {
  project: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  period: string; // YYYY-MM
  monthlyLimit: number;
  openingBalance: number;
  receivedQty: number;
  consumedQty: number;
  issuedQty: number;
  damagedQty: number;
  returnedQty: number;
  remainingQty: number;
  status: InventoryStatus;
  updatedAt: Date;
}

const inventoryBalanceSchema = new Schema<IInventoryBalance>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    period: { type: String, required: true }, // YYYY-MM
    monthlyLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    receivedQty: { type: Number, default: 0 },
    consumedQty: { type: Number, default: 0 },
    issuedQty: { type: Number, default: 0 },
    damagedQty: { type: Number, default: 0 },
    returnedQty: { type: Number, default: 0 },
    remainingQty: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['available', 'low_stock', 'out_of_stock', 'over_consumed'],
      default: 'available',
    },
  },
  { timestamps: { updatedAt: true, createdAt: false } }
);

inventoryBalanceSchema.index({ project: 1, item: 1, period: 1 }, { unique: true });

inventoryBalanceSchema.methods.recalculate = function () {
  this.remainingQty =
    this.openingBalance +
    this.receivedQty -
    this.consumedQty -
    this.issuedQty -
    this.damagedQty +
    this.returnedQty;

  if (this.remainingQty <= 0) {
    this.status = 'out_of_stock';
  } else if (this.consumedQty + this.issuedQty > this.monthlyLimit && this.monthlyLimit > 0) {
    this.status = 'over_consumed';
  } else if (this.monthlyLimit > 0 && this.remainingQty / this.monthlyLimit < 0.2) {
    this.status = 'low_stock';
  } else {
    this.status = 'available';
  }
};

export const InventoryBalance = mongoose.model<IInventoryBalance>('InventoryBalance', inventoryBalanceSchema);
