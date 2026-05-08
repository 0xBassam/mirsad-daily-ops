import { Router } from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier } from '../controllers/supplierController';

const router = Router();
router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
export default router;
