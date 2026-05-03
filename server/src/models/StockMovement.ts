import mongoose, { Document, Schema } from 'mongoose';

export type MovementType =
  | 'RECEIVE'
  | 'ISSUE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'RETURN'
  | 'CONSUMPTION';

export interface IStockMovement extends Document {
  project: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  movementType: MovementType;
  quantity: number;
  movementDate: Date;
  sourceType: 'floor_check' | 'manual' | 'adjustment' | 'transfer' | 'damage' | 'return' | 'spoilage' | 'purchase_order' | 'receiving';
  sourceRef?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    movementType: {
      type: String,
      enum: ['RECEIVE', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'CONSUMPTION'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    movementDate: { type: Date, required: true },
    sourceType: {
      type: String,
      enum: ['floor_check', 'manual', 'adjustment', 'transfer', 'damage', 'return', 'spoilage', 'purchase_order', 'receiving'],
      default: 'manual',
    },
    sourceRef: { type: Schema.Types.ObjectId },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ project: 1, item: 1, movementDate: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);
