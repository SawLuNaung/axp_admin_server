import { pool } from '../database/pool';
import { AppError } from '../middleware/error-handler';


export interface Partner {
  id: string;
  name: string;
  title: string;
  company: string;
  quote: string;
  imageUrl: string;
  featured: boolean;
}

// Maximum number of partners that can be featured at once
export const MAX_FEATURED = 3;

// ─── Row ↔ Frontend mapping helpers ─────────────────────────

interface PartnerRow {
  id: string;
  name: string;
  title: string;
  company: string;
  quote: string;
  image_url: string;
  featured: boolean;
}

function rowToPartner(row: PartnerRow): Partner {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    company: row.company,
    quote: row.quote,
    imageUrl: row.image_url,
    featured: row.featured,
  };
}

// ─── Service functions ──────────────────────────────────────

/**
 * Fetch all partners, ordered by id.
 */
export async function getAll(): Promise<Partner[]> {
  const { rows } = await pool.query<PartnerRow>(
    'SELECT * FROM partners ORDER BY id ASC'
  );
  return rows.map(rowToPartner);
}

/**
 * Update which partners are featured.
 *
 * Receives an array of partner IDs that should be featured.
 * All other partners are set to featured = false.
 *
 * Runs inside a transaction:
 *   1. Validate: no more than MAX_FEATURED (3) IDs
 *   2. Validate: all provided IDs actually exist in the DB
 *   3. Set ALL partners to featured = false
 *   4. Set the selected partners to featured = true
 *   5. Return the updated list
 */
export async function updateFeatured(featuredIds: string[]): Promise<Partner[]> {
  // 1. Enforce the max featured limit
  if (featuredIds.length > MAX_FEATURED) {
    throw new AppError(400, `Cannot feature more than ${MAX_FEATURED} partners.`);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Validate that all provided IDs exist
    if (featuredIds.length > 0) {
      const { rows: existingRows } = await client.query<{ id: string }>(
        'SELECT id FROM partners WHERE id = ANY($1)',
        [featuredIds]
      );
      const existingIds = new Set(existingRows.map((r) => r.id));
      const invalidIds = featuredIds.filter((id) => !existingIds.has(id));

      if (invalidIds.length > 0) {
        throw new AppError(400, `Partner IDs not found: ${invalidIds.join(', ')}`);
      }
    }

    // 3. Unfeatured all partners
    await client.query(
      'UPDATE partners SET featured = FALSE, updated_at = NOW() WHERE featured = TRUE'
    );

    // 4. Feature the selected ones
    if (featuredIds.length > 0) {
      await client.query(
        'UPDATE partners SET featured = TRUE, updated_at = NOW() WHERE id = ANY($1)',
        [featuredIds]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // 5. Return the updated list
  return getAll();
}
