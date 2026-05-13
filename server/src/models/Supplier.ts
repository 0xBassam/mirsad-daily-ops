import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  organization?: mongoose.Types.ObjectId;
  name: string;
  nameAr?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category: 'food' | 'material' | 'both';
  rating: number;
  status: 'active' | 'inactive' | 'blacklisted';
  licenseNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    organization:  { type: Schema.Types.ObjectId, ref: 'Organization' },
    name:          { type: String, required: true, trim: true },
    nameAr:        { type: String, trim: true },
    contactName:   { type: String, trim: true },
    phone:         { type: String, trim: true },
    email:         { type: String, trim: true, lowercase: true },
    category:      { type: String, enum: ['food', 'material', 'both'], required: true },
    rating:        { type: Number, min: 1, max: 5, default: 3 },
    status:        { type: String, enum: ['active', 'inactive', 'blacklisted'], default: 'active' },
    licenseNumber: { type: String, trim: true },
    address:       { type: String, trim: true },
  },
  { timestamps: true }
);

supplierSchema.index({ organization: 1 });
supplierSchema.index({ organization: 1, category: 1, status: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
