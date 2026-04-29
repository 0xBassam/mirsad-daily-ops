import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    url: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Attachment = mongoose.model<IAttachment>('Attachment', attachmentSchema);
