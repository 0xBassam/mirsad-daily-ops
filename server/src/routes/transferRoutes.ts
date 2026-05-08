import { Router } from 'express';
import { getTransfers, getTransfer, createTransfer, updateTransfer, confirmTransfer, cancelTransfer } from '../controllers/transferController';

const router = Router();
router.get('/',          getTransfers);
router.post('/',         createTransfer);
router.get('/:id',       getTransfer);
router.put('/:id',       updateTransfer);
router.post('/:id/confirm', confirmTransfer);
router.post('/:id/cancel',  cancelTransfer);

export default router;
