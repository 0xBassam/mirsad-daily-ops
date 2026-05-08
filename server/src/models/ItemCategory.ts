import mongoose, { Document, Schema } from 'mongoose';

export interface IItemCategory extends Document {
  name: string;
  type: 'food' | 'material';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const itemCategorySchema = new Schema<IItemCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ['food', 'material'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const ItemCategory = mongoose.model<IItemCategory>('ItemCategory', itemCategorySchema);
