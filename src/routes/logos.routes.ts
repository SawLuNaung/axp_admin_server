import { Router } from 'express';
import * as logosController from '../controllers/logos.controller';
import { upload } from '../middleware/upload';

const router = Router();

// GET   /api/logos         →  Fetch all partner logos
router.get('/', logosController.getAll);

// PUT   /api/logos         →  Bulk-save all partner logos
router.put('/', logosController.syncAll);

// POST  /api/logos/upload  →  Upload a logo image file
router.post('/upload', upload.single('image'), logosController.uploadImage);

export default router;
