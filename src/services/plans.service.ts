import { pool } from '../database/pool';

export interface Plan {
  id: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  isPopular?: boolean;
}

// ─── Row ↔ Frontend mapping helpers ─────────────────────────

interface PlanRow {
  id: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  button_text: string;
  button_variant: string;
  is_popular: boolean;
  sort_order: number;
}

function rowToPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    period: row.period,
    features: row.features,
    buttonText: row.button_text,
    buttonVariant: row.button_variant as Plan['buttonVariant'],
    isPopular: row.is_popular,
  };
}

// ─── Service functions ──────────────────────────────────────

/**
 * Fetch all plans, ordered by sort_order.
 */
export async function getAll(): Promise<Plan[]> {
  const { rows } = await pool.query<PlanRow>(
    'SELECT * FROM plans ORDER BY sort_order ASC'
  );
  return rows.map(rowToPlan);
}

/**
 * Bulk-sync plans: upsert incoming plans, delete any that are no longer present.
 *
 * This runs inside a single transaction so it either fully succeeds or fully rolls back.
 *
 * How it works:
 *   1. Get the IDs currently in the database
 *   2. Figure out which IDs were removed (exist in DB but not in the incoming array)
 *   3. Delete those removed plans
 *   4. Upsert every incoming plan (INSERT or UPDATE if the ID already exists)
 *   5. Return the fresh list
 */
export async function syncAll(plans: Plan[]): Promise<Plan[]> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get existing IDs
    const { rows: existingRows } = await client.query<{ id: string }>(
      'SELECT id FROM plans'
    );
    const existingIds = new Set(existingRows.map((r) => r.id));

    // 2. Incoming IDs
    const incomingIds = new Set(plans.map((p) => p.id));

    // 3. Delete plans that were removed
    const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));
    if (idsToDelete.length > 0) {
      await client.query(
        'DELETE FROM plans WHERE id = ANY($1)',
        [idsToDelete]
      );
    }

    // 4. Upsert each incoming plan
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];
      await client.query(
        `INSERT INTO plans (id, title, price, period, features, button_text, button_variant, is_popular, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title          = EXCLUDED.title,
           price          = EXCLUDED.price,
           period         = EXCLUDED.period,
           features       = EXCLUDED.features,
           button_text    = EXCLUDED.button_text,
           button_variant = EXCLUDED.button_variant,
           is_popular     = EXCLUDED.is_popular,
           sort_order     = EXCLUDED.sort_order,
           updated_at     = NOW()`,
        [
          p.id,
          p.title,
          p.price,
          p.period,
          JSON.stringify(p.features),
          p.buttonText,
          p.buttonVariant,
          p.isPopular ?? false,
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

  // 5. Return the fresh list from the database
  return getAll();
}
