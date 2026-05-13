import { Router } from 'express';
import {
  getDailyPlans, getDailyPlan, createDailyPlan, updateDailyPlan,
  deleteDailyPlan, copyDailyPlan, startPlan, closePlan,
  updatePlanLine, getKitchenToday,
} from '../controllers/dailyPlanController';

const router = Router();

router.get('/kitchen/today', getKitchenToday);
router.get('/', getDailyPlans);
router.post('/', createDailyPlan);
router.get('/:id', getDailyPlan);
router.put('/:id', updateDailyPlan);
router.delete('/:id', deleteDailyPlan);
router.post('/:id/copy', copyDailyPlan);
router.post('/:id/start', startPlan);
router.post('/:id/close', closePlan);
router.put('/:id/lines/:lineId', updatePlanLine);

export default router;
