import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  lastResendAt?: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    otpHash:     { type: String, required: true },
    expiresAt:   { type: Date, required: true },
    attempts:    { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastResendAt:{ type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
// TTL: MongoDB auto-deletes expired OTP docs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
