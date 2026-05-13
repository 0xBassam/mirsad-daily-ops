import mongoose, { Document, Schema } from 'mongoose';

export interface IItemCategory extends Document {
  organization?: mongoose.Types.ObjectId;
  name: string;
  type: 'food' | 'material';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const itemCategorySchema = new Schema<IItemCategory>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['food', 'material'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

itemCategorySchema.index({ organization: 1 });

export const ItemCategory = mongoose.model<IItemCategory>('ItemCategory', itemCategorySchema);
