import { Router } from 'express';
import * as aboutUsController from '../controllers/about-us.controller';
import { upload } from '../middleware/upload';

const router = Router();

// GET   /api/about-us         →  Fetch About Us config
router.get('/', aboutUsController.get);

// PUT   /api/about-us         →  Save About Us config
router.put('/', aboutUsController.update);

// POST  /api/about-us/upload  →  Upload company logo image
router.post('/upload', upload.single('image'), aboutUsController.uploadLogo);

export default router;
