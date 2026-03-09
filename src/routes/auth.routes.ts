import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login    →  Authenticate and receive tokens
router.post('/login', authController.login);

// POST /api/auth/refresh  →  Get a new access token
router.post('/refresh', authController.refresh);

// POST /api/auth/logout   →  Revoke refresh token
router.post('/logout', authController.logout);

export default router;
