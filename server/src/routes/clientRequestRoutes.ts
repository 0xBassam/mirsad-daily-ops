import { Router } from 'express';
import {
  getClientRequests, getClientRequest,
  createClientRequest, updateClientRequest,
  assignClientRequest, startClientRequest,
  deliverClientRequest, confirmClientRequest,
  rejectClientRequest,
} from '../controllers/clientRequestController';

const router = Router();
router.get('/',                  getClientRequests);
router.post('/',                 createClientRequest);
router.get('/:id',               getClientRequest);
router.put('/:id',               updateClientRequest);
router.post('/:id/assign',       assignClientRequest);
router.post('/:id/start',        startClientRequest);
router.post('/:id/deliver',      deliverClientRequest);
router.post('/:id/confirm',      confirmClientRequest);
router.post('/:id/reject',       rejectClientRequest);

export default router;
