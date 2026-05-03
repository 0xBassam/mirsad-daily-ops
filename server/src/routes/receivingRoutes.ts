import { Router } from 'express';
import { getReceivings, getReceiving, createReceiving, updateReceiving, confirmReceiving } from '../controllers/receivingController';

const router = Router();
router.get('/',          getReceivings);
router.post('/',         createReceiving);
router.get('/:id',       getReceiving);
router.put('/:id',       updateReceiving);
router.post('/:id/confirm', confirmReceiving);

export default router;
