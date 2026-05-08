import { Router } from 'express';
import {
  getCorrectiveActions,
  getCorrectiveActionById,
  createCorrectiveAction,
  updateCorrectiveAction,
} from '../controllers/correctiveActionController';

const router = Router();

router.route('/').get(getCorrectiveActions).post(createCorrectiveAction);
router.route('/:id').get(getCorrectiveActionById).put(updateCorrectiveAction);

export default router;
