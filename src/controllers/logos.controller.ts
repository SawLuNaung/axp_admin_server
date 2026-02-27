import { Request, Response, NextFunction } from 'express';
import * as logosService from '../services/logos.service';
import { AppError } from '../middleware/error-handler';

/**
 * GET /api/logos
 * Returns all partner logos ordered by sort_order.
 */
export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logos = await logosService.getAll();
    res.json(logos);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/logos
 * Receives { logos: PartnerLogo[] }, syncs them to the database, and returns the saved list.
 *
 * Validation:
 *   - Body must contain a "logos" key
 *   - "logos" must be an array (can be empty — removes all logos)
 *   - Each logo must have at least: id, name
 */
export async function syncAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { logos } = req.body;

    // ── Validate top-level structure ──
    if (!logos || !Array.isArray(logos)) {
      throw new AppError(400, 'Request body must contain a "logos" array.');
    }

    // ── Validate each logo ──
    for (let i = 0; i < logos.length; i++) {
      const l = logos[i];

      if (!l.id || typeof l.id !== 'string') {
        throw new AppError(400, `logos[${i}]: "id" is required and must be a string.`);
      }
      if (typeof l.name !== 'string') {
        throw new AppError(400, `logos[${i}]: "name" is required and must be a string.`);
      }
      if (l.imageUrl !== undefined && typeof l.imageUrl !== 'string') {
        throw new AppError(400, `logos[${i}]: "imageUrl" must be a string.`);
      }
      if (l.linkUrl !== undefined && typeof l.linkUrl !== 'string') {
        throw new AppError(400, `logos[${i}]: "linkUrl" must be a string.`);
      }
    }

    // ── Sync to database ──
    const saved = await logosService.syncAll(logos);
    res.json(saved);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/logos/upload
 * Accepts a single image file (multipart/form-data, field name: "image").
 * Returns the URL where the uploaded image can be accessed.
 */
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, 'No image file provided. Use field name "image".');
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({ imageUrl });
  } catch (err) {
    next(err);
  }
}
