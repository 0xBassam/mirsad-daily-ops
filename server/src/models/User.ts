import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'supervisor' | 'assistant_supervisor' | 'project_manager' | 'client' | 'operations' | 'warehouse' | 'kitchen';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  project?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'assistant_supervisor', 'project_manager', 'client', 'operations', 'warehouse', 'kitchen'],
      required: true,
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
