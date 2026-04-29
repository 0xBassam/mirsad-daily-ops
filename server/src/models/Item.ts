import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  type: 'food' | 'material';
  unit: string;
  limitQty: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'ItemCategory', required: true },
    type: { type: String, enum: ['food', 'material'], required: true },
    unit: { type: String, required: true, trim: true },
    limitQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Item = mongoose.model<IItem>('Item', itemSchema);
