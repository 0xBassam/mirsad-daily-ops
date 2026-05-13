import mongoose, { Document, Schema } from 'mongoose';

export type POStatus = 'active' | 'partially_received' | 'fully_received' | 'near_depletion' | 'over_consumed' | 'closed';

export interface IPOLine {
  _id: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  approvedQty: number;
  receivedQty: number;
  distributedQty: number;
  consumedQty: number;
  remainingQty: number;
  variance: number;
  unit: string;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplier: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  startDate: Date;
  endDate: Date;
  status: POStatus;
  lines: IPOLine[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const poLineSchema = new Schema<IPOLine>(
  {
    item:           { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    approvedQty:    { type: Number, required: true, min: 0 },
    receivedQty:    { type: Number, default: 0, min: 0 },
    distributedQty: { type: Number, default: 0, min: 0 },
    consumedQty:    { type: Number, default: 0, min: 0 },
    remainingQty:   { type: Number, default: 0 },
    variance:       { type: Number, default: 0 },
    unit:           { type: String, required: true },
  },
  { _id: true }
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber:  { type: String, required: true, unique: true, trim: true },
    supplier:  { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    project:   { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    month:     { type: String, required: true }, // YYYY-MM
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    status:    { type: String, enum: ['active', 'partially_received', 'fully_received', 'near_depletion', 'over_consumed', 'closed'], default: 'active' },
    lines:     [poLineSchema],
    notes:     { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ project: 1, month: 1 });
purchaseOrderSchema.index({ supplier: 1, status: 1 });

purchaseOrderSchema.methods.recalculate = function () {
  let anyNearDepletion = false;
  let anyOverConsumed = false;
  let totalApproved = 0;
  let totalReceived = 0;

  for (const line of this.lines) {
    // Remaining = units still pending delivery from supplier
    line.remainingQty = line.approvedQty - line.receivedQty;
    // Variance = received stock not yet consumed/distributed (on-hand buffer)
    line.variance = line.receivedQty - line.distributedQty - line.consumedQty;
    totalApproved += line.approvedQty;
    totalReceived += line.receivedQty;

    const usedQty = line.distributedQty + line.consumedQty;
    if (usedQty > line.receivedQty) {
      anyOverConsumed = true;
    } else if (line.receivedQty > 0 && (line.receivedQty - usedQty) / Math.max(1, line.approvedQty) < 0.15) {
      anyNearDepletion = true;
    }
  }

  if (this.status === 'closed') return;
  if (anyOverConsumed)                                    this.status = 'over_consumed';
  else if (anyNearDepletion)                              this.status = 'near_depletion';
  else if (totalApproved > 0 && totalReceived >= totalApproved) this.status = 'fully_received';
  else if (totalReceived > 0)                             this.status = 'partially_received';
  else                                                    this.status = 'active';
};

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
