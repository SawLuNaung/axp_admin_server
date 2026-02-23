import { Request, Response, NextFunction } from 'express';
import * as plansService from '../services/plans.service';
import { AppError } from '../middleware/error-handler';

/**
 * GET /api/plans
 * Returns all pricing plans ordered by sort_order.
 */
export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const plans = await plansService.getAll();
    res.json(plans);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/plans
 * Receives { plans: Plan[] }, syncs them to the database, and returns the saved list.
 *
 * Validation:
 *   - Body must contain a "plans" key
 *   - "plans" must be a non-empty array
 *   - Each plan must have at least: id, title, price, period, features, buttonText, buttonVariant
 */
export async function syncAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { plans } = req.body;

    // ── Validate top-level structure ──
    if (!plans || !Array.isArray(plans)) {
      throw new AppError(400, 'Request body must contain a "plans" array.');
    }

    if (plans.length === 0) {
      throw new AppError(400, 'Plans array must not be empty.');
    }

    // ── Validate each plan ──
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];

      if (!p.id || typeof p.id !== 'string') {
        throw new AppError(400, `plans[${i}]: "id" is required and must be a string.`);
      }
      if (!p.title || typeof p.title !== 'string') {
        throw new AppError(400, `plans[${i}]: "title" is required.`);
      }
      if (!p.price || typeof p.price !== 'string') {
        throw new AppError(400, `plans[${i}]: "price" is required.`);
      }
      if (!p.period || typeof p.period !== 'string') {
        throw new AppError(400, `plans[${i}]: "period" is required.`);
      }
      if (!Array.isArray(p.features)) {
        throw new AppError(400, `plans[${i}]: "features" must be an array.`);
      }
      if (!p.buttonText || typeof p.buttonText !== 'string') {
        throw new AppError(400, `plans[${i}]: "buttonText" is required.`);
      }
      if (!['primary', 'secondary'].includes(p.buttonVariant)) {
        throw new AppError(400, `plans[${i}]: "buttonVariant" must be "primary" or "secondary".`);
      }
    }

    // ── Sync to database ──
    const saved = await plansService.syncAll(plans);
    res.json(saved);
  } catch (err) {
    next(err);
  }
}
