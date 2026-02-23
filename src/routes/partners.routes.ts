import { Router } from 'express';
import * as partnersController from '../controllers/partners.controller';

const router = Router();

// GET  /api/partners           →  Fetch all partners
router.get('/', partnersController.getAll);

// PUT  /api/partners/featured  →  Update which partners are featured
router.put('/featured', partnersController.updateFeatured);

export default router;
