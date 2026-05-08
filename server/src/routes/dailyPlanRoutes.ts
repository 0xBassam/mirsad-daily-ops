import { Router } from 'express';
import { getDailyPlans, getDailyPlan, createDailyPlan, updateDailyPlan, deleteDailyPlan, copyDailyPlan } from '../controllers/dailyPlanController';

const router = Router();
router.get('/', getDailyPlans);
router.post('/', createDailyPlan);
router.get('/:id', getDailyPlan);
router.put('/:id', updateDailyPlan);
router.delete('/:id', deleteDailyPlan);
router.post('/:id/copy', copyDailyPlan);

export default router;
