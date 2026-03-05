import { pool } from './pool';

const CREATE_PLANS_TABLE = `
  CREATE TABLE IF NOT EXISTS plans (
    id              VARCHAR(64) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    price           VARCHAR(50)  NOT NULL,
    period          VARCHAR(50)  NOT NULL,
    features        JSONB        NOT NULL DEFAULT '[]',
    button_text     VARCHAR(100) NOT NULL DEFAULT 'Choose Plan',
    button_variant  VARCHAR(20)  NOT NULL DEFAULT 'secondary',
    is_popular      BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  );
`;

const CREATE_PARTNERS_TABLE = `
  CREATE TABLE IF NOT EXISTS partners (
    id              VARCHAR(64) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    company         VARCHAR(255) NOT NULL,
    quote           TEXT         NOT NULL,
    image_url       VARCHAR(500) NOT NULL DEFAULT '',
    featured        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  );
`;

const CREATE_PARTNER_LOGOS_TABLE = `
  CREATE TABLE IF NOT EXISTS partner_logos (
    id              VARCHAR(64) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    image_url       VARCHAR(500) NOT NULL DEFAULT '',
    link_url        VARCHAR(500) NOT NULL DEFAULT '',
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  );
`;

const CREATE_ABOUT_US_TABLE = `
  CREATE TABLE IF NOT EXISTS about_us (
    id                INTEGER      PRIMARY KEY DEFAULT 1,
    company_logo_url  VARCHAR(500) NOT NULL DEFAULT '',
    phone_number      VARCHAR(50)  NOT NULL DEFAULT '',
    facebook_url      VARCHAR(500) NOT NULL DEFAULT '',
    twitter_url       VARCHAR(500) NOT NULL DEFAULT '',
    instagram_url     VARCHAR(500) NOT NULL DEFAULT '',
    linkedin_url      VARCHAR(500) NOT NULL DEFAULT '',
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
  );
`;

async function migrate(): Promise<void> {
  console.log('[Migrate] Creating tables...');

  await pool.query(CREATE_PLANS_TABLE);
  console.log('[Migrate] ✓ plans');

  await pool.query(CREATE_PARTNERS_TABLE);
  console.log('[Migrate] ✓ partners');

  await pool.query(CREATE_PARTNER_LOGOS_TABLE);
  console.log('[Migrate] ✓ partner_logos');

  await pool.query(CREATE_ABOUT_US_TABLE);
  console.log('[Migrate] ✓ about_us');

  console.log('[Migrate] Done.');
}

// Run directly: npm run migrate
migrate()
  .catch((err) => {
    console.error('[Migrate] Failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
