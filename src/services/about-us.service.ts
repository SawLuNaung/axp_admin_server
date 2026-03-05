import { pool } from '../database/pool';

// ─── TypeScript interface (sent to / received from frontend) ─

export interface AboutUsConfig {
  companyLogoUrl: string;
  phoneNumber: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}

// ─── Row ↔ Frontend mapping helpers ──────────────────────────

interface AboutUsRow {
  id: number;
  company_logo_url: string;
  phone_number: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
}

function rowToConfig(row: AboutUsRow): AboutUsConfig {
  return {
    companyLogoUrl: row.company_logo_url,
    phoneNumber: row.phone_number,
    facebookUrl: row.facebook_url,
    twitterUrl: row.twitter_url,
    instagramUrl: row.instagram_url,
    linkedinUrl: row.linkedin_url,
  };
}

const DEFAULT_CONFIG: AboutUsConfig = {
  companyLogoUrl: '',
  phoneNumber: '',
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
};

// ─── Service functions ───────────────────────────────────────

/**
 * Fetch the About Us config (single row, id = 1).
 * Returns defaults if no row exists.
 */
export async function get(): Promise<AboutUsConfig> {
  const { rows } = await pool.query<AboutUsRow>(
    'SELECT * FROM about_us WHERE id = 1'
  );

  if (rows.length === 0) {
    return DEFAULT_CONFIG;
  }

  return rowToConfig(rows[0]);
}

/**
 * Update the About Us config (single row, id = 1).
 * Uses INSERT ... ON CONFLICT to handle the case where the row doesn't exist yet.
 */
export async function update(config: AboutUsConfig): Promise<AboutUsConfig> {
  await pool.query(
    `INSERT INTO about_us (id, company_logo_url, phone_number, facebook_url, twitter_url, instagram_url, linkedin_url, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (id) DO UPDATE SET
       company_logo_url = EXCLUDED.company_logo_url,
       phone_number     = EXCLUDED.phone_number,
       facebook_url     = EXCLUDED.facebook_url,
       twitter_url      = EXCLUDED.twitter_url,
       instagram_url    = EXCLUDED.instagram_url,
       linkedin_url     = EXCLUDED.linkedin_url,
       updated_at       = NOW()`,
    [
      config.companyLogoUrl,
      config.phoneNumber,
      config.facebookUrl,
      config.twitterUrl,
      config.instagramUrl,
      config.linkedinUrl,
    ]
  );

  return get();
}
