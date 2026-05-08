import { Router } from 'express';
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, receivePOLine, distributePOLine } from '../controllers/purchaseOrderController';

const router = Router();
router.get('/', getPurchaseOrders);
router.post('/', createPurchaseOrder);
router.get('/:id', getPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.post('/:id/lines/:lineId/receive', receivePOLine);
router.post('/:id/lines/:lineId/distribute', distributePOLine);
export default router;
