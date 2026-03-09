import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../database/pool';
import { config } from '../config';
import { AppError } from '../middleware/error-handler';

interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
}

interface RefreshTokenRow {
  id: number;
  admin_id: number;
  token: string;
  expires_at: Date;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function signAccessToken(adminId: number, username: string): string {
  return jwt.sign(
    { adminId, username },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

function signRefreshToken(adminId: number): string {
  return jwt.sign(
    { adminId },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Parse a duration string like "15m", "7d", "2h" into milliseconds.
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // fallback 15 min

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 60 * 1000);
}

// ─── Service functions ──────────────────────────────────────

export async function login(username: string, password: string): Promise<TokenPair> {
  const { rows } = await pool.query<AdminRow>(
    'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
    [username]
  );

  if (rows.length === 0) {
    throw new AppError(401, 'Invalid username or password.');
  }

  const admin = rows[0];
  const valid = await bcrypt.compare(password, admin.password_hash);

  if (!valid) {
    throw new AppError(401, 'Invalid username or password.');
  }

  const accessToken = signAccessToken(admin.id, admin.username);
  const refreshToken = signRefreshToken(admin.id);

  const expiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn));
  await pool.query(
    `INSERT INTO refresh_tokens (admin_id, token, expires_at) VALUES ($1, $2, $3)`,
    [admin.id, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify JWT signature first
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.secret) as jwt.JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token.');
  }

  // Check the token exists in DB (not revoked)
  const { rows } = await pool.query<RefreshTokenRow>(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [refreshToken]
  );

  if (rows.length === 0) {
    throw new AppError(401, 'Refresh token has been revoked or expired.');
  }

  // Look up admin to include username in the new access token
  const { rows: adminRows } = await pool.query<AdminRow>(
    'SELECT id, username, password_hash FROM admin_users WHERE id = $1',
    [decoded.adminId]
  );

  if (adminRows.length === 0) {
    throw new AppError(401, 'Admin user no longer exists.');
  }

  const admin = adminRows[0];
  const accessToken = signAccessToken(admin.id, admin.username);

  return { accessToken };
}

export async function logout(refreshToken: string): Promise<void> {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
}
