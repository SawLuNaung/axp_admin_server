import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

// Log when the pool connects successfully (first query)
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

// Log pool-level errors (e.g. lost connection)
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});
