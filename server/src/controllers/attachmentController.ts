import { Request, Response } from 'express';
import { Attachment } from '../models/Attachment';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded or file type not allowed', 400);

  const attachment = await Attachment.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    entityType: req.body.entityType,
    entityId: req.body.entityId,
    uploadedBy: req.user?.userId,
  });

  res.status(201).json({ success: true, data: attachment });
});

export const getAttachment = asyncHandler(async (req: Request, res: Response) => {
  const data = await Attachment.findById(req.params.id);
  if (!data) throw new AppError('Attachment not found', 404);
  res.json({ success: true, data });
});

export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  const data = await Attachment.findByIdAndDelete(req.params.id);
  if (!data) throw new AppError('Attachment not found', 404);
  res.json({ success: true });
});
