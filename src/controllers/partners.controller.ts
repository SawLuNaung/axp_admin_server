import { Request, Response, NextFunction } from 'express';
import * as partnersService from '../services/partners.service';
import { AppError } from '../middleware/error-handler';

/**
 * GET /api/partners
 * Returns all partners ordered by id.
 */
export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const partners = await partnersService.getAll();
    res.json(partners);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/partners/featured
 * Receives { featuredIds: string[] } and updates which partners are shown on site.
 *
 * Validation:
 *   - Body must contain a "featuredIds" key
 *   - "featuredIds" must be an array of strings
 *   - Maximum 3 IDs allowed (enforced by service too, but fail fast here)
 */
export async function updateFeatured(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { featuredIds } = req.body;

    // ── Validate top-level structure ──
    if (!featuredIds || !Array.isArray(featuredIds)) {
      throw new AppError(400, 'Request body must contain a "featuredIds" array.');
    }

    // ── Validate each element is a string ──
    for (let i = 0; i < featuredIds.length; i++) {
      if (typeof featuredIds[i] !== 'string') {
        throw new AppError(400, `featuredIds[${i}]: must be a string.`);
      }
    }

    // ── Validate max count ──
    if (featuredIds.length > partnersService.MAX_FEATURED) {
      throw new AppError(
        400,
        `Cannot feature more than ${partnersService.MAX_FEATURED} partners. Received ${featuredIds.length}.`
      );
    }

    // ── Update in database ──
    const updated = await partnersService.updateFeatured(featuredIds);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
