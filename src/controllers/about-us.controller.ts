import { Request, Response, NextFunction } from 'express';
import * as aboutUsService from '../services/about-us.service';
import { AppError } from '../middleware/error-handler';

/**
 * GET /api/about-us
 * Returns the About Us config (company logo, phone, social links).
 */
export async function get(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await aboutUsService.get();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/about-us
 * Receives the full config object and saves it.
 *
 * Validation:
 *   - phoneNumber is required
 *   - All fields must be strings (if provided)
 */
export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body;

    if (!body.phoneNumber || typeof body.phoneNumber !== 'string') {
      throw new AppError(400, '"phoneNumber" is required and must be a string.');
    }

    const config: aboutUsService.AboutUsConfig = {
      companyLogoUrl: typeof body.companyLogoUrl === 'string' ? body.companyLogoUrl : '',
      phoneNumber: body.phoneNumber,
      facebookUrl: typeof body.facebookUrl === 'string' ? body.facebookUrl : '',
      twitterUrl: typeof body.twitterUrl === 'string' ? body.twitterUrl : '',
      instagramUrl: typeof body.instagramUrl === 'string' ? body.instagramUrl : '',
      linkedinUrl: typeof body.linkedinUrl === 'string' ? body.linkedinUrl : '',
    };

    const saved = await aboutUsService.update(config);
    res.json(saved);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/about-us/upload
 * Accepts a single image file (multipart/form-data, field name: "image").
 * Returns the URL where the uploaded company logo can be accessed.
 */
export async function uploadLogo(
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
