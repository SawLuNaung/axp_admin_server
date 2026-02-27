import fs from 'fs';
import path from 'path';
import { pool } from '../database/pool';
import { config } from '../config';

// ─── TypeScript interface (matches frontend's PartnerLogo) ──

export interface PartnerLogo {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
}

// ─── Row ↔ Frontend mapping helpers ─────────────────────────

interface LogoRow {
  id: string;
  name: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

function rowToLogo(row: LogoRow): PartnerLogo {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
  };
}

// ─── Service functions ──────────────────────────────────────

/**
 * Fetch all logos, ordered by sort_order.
 */
export async function getAll(): Promise<PartnerLogo[]> {
  const { rows } = await pool.query<LogoRow>(
    'SELECT * FROM partner_logos ORDER BY sort_order ASC'
  );
  return rows.map(rowToLogo);
}

/**
 * Bulk-sync logos: upsert incoming logos, delete any that are no longer present.
 * Also cleans up orphaned image files from disk when logos are removed.
 *
 * Runs inside a single transaction:
 *   1. Get existing rows (need image_url for cleanup)
 *   2. Find IDs that were removed
 *   3. Delete orphaned image files from disk
 *   4. Delete removed logos from DB
 *   5. Upsert every incoming logo
 *   6. Return the fresh list
 */
export async function syncAll(logos: PartnerLogo[]): Promise<PartnerLogo[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get existing rows (need image_url to know which files to clean up)
    const { rows: existingRows } = await client.query<{ id: string; image_url: string }>(
      'SELECT id, image_url FROM partner_logos'
    );
    const existingMap = new Map(existingRows.map((r) => [r.id, r.image_url]));

    // 2. Find IDs that were removed
    const incomingIds = new Set(logos.map((l) => l.id));
    const idsToDelete = [...existingMap.keys()].filter((id) => !incomingIds.has(id));

    // 3. Clean up orphaned image files from disk
    for (const id of idsToDelete) {
      const imageUrl = existingMap.get(id);
      deleteUploadedFile(imageUrl);
    }

    // 4. Delete removed logos from DB
    if (idsToDelete.length > 0) {
      await client.query(
        'DELETE FROM partner_logos WHERE id = ANY($1)',
        [idsToDelete]
      );
    }

    // 5. Upsert each incoming logo
    for (let i = 0; i < logos.length; i++) {
      const l = logos[i];
      await client.query(
        `INSERT INTO partner_logos (id, name, image_url, link_url, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name       = EXCLUDED.name,
           image_url  = EXCLUDED.image_url,
           link_url   = EXCLUDED.link_url,
           sort_order = EXCLUDED.sort_order,
           updated_at = NOW()`,
        [
          l.id,
          l.name,
          l.imageUrl,
          l.linkUrl,
          i, // sort_order = array index
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // 6. Return the fresh list
  return getAll();
}

/**
 * Delete an uploaded file from disk if the URL points to a local upload.
 * Silently ignores external URLs and missing files.
 */
function deleteUploadedFile(imageUrl: string | undefined): void {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;

  const filename = imageUrl.replace('/uploads/', '');
  const filePath = path.resolve(config.upload.dir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Logos] Deleted orphaned file: ${filename}`);
    }
  } catch (err) {
    console.error(`[Logos] Failed to delete file ${filename}:`, err);
  }
}
