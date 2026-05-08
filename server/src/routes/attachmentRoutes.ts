import { Router } from 'express';
import { uploadAttachment, getAttachment, deleteAttachment } from '../controllers/attachmentController';
import { upload } from '../middleware/upload';

const router = Router();
router.post('/upload', upload.single('file'), uploadAttachment);
router.get('/:id', getAttachment);
router.delete('/:id', deleteAttachment);

export default router;
