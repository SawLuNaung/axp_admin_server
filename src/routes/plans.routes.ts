import { Router } from 'express';
import * as plansController from '../controllers/plans.controller';

const router = Router();

// GET  /api/plans  →  Fetch all pricing plans
router.get('/', plansController.getAll);

// PUT  /api/plans  →  Bulk-save all pricing plans
router.put('/', plansController.syncAll);

export default router;
