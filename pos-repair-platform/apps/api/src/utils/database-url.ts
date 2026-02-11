/**
 * Production uses private IP only (no Cloud SQL Unix socket).
 * If DATABASE_URL contains /cloudsql/ in production, fail fast with a clear message.
 */

import * as fs from 'fs';
import { execSync } from 'child_process';

const CLOUDSQL_INSTANCE = 'repair-pos-485101:us-central1:pos-repair-postgres';
const CLOUDSQL_DIR = `/cloudsql/${CLOUDSQL_INSTANCE}`;

const PRIVATE_IP_HINT =
  'Set _DATABASE_URL in the Cloud Build trigger to private IP: postgresql://USER:PASS@10.221.0.3:5432/pos_repair_platform';

export function normalizeDatabaseUrl(): void {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const isProduction = process.env.NODE_ENV === 'production';
  const isSocketUrl = url.includes('/cloudsql/');

  if (isProduction && isSocketUrl) {
    console.error(
      'CRITICAL: DATABASE_URL is a Cloud SQL socket URL but this service uses private IP only. ' +
        PRIVATE_IP_HINT,
    );
    throw new Error(
      'Invalid DATABASE_URL for production: use private IP, not Cloud SQL socket. ' + PRIVATE_IP_HINT,
    );
  }

  // In dev or if socket URL was used with socket mount, optional normalization (leave private IP as-is)
  if (!isSocketUrl) return;

  try {
    let normalized = url.replace(/@localhost:5432\//, '@localhost/');
    const authMatch = normalized.match(/^(postgres(?:ql)?:\/\/[^@]+@)([^/]+)(\/[^?]*\??.*)$/);
    if (authMatch) {
      const [, prefix, hostPart, pathAndQuery] = authMatch;
      if (hostPart !== 'localhost') {
        normalized = `${prefix}localhost${pathAndQuery}`;
      }
    }
    const hostParamMatch = normalized.match(/\?host=([^&]+)/);
    if (hostParamMatch) {
      let socketPath = decodeURIComponent(hostParamMatch[1]);
      if (socketPath.endsWith(':5432')) socketPath = socketPath.slice(0, -5);
      if (socketPath.endsWith('/.s.PGSQL.5432')) socketPath = socketPath.slice(0, -'.s.PGSQL.5432'.length);
      socketPath = socketPath.replace(/\/+$/, '');
      const encodedHost = encodeURIComponent(socketPath);
      normalized = normalized.replace(/\?host=[^&]+/, `?host=${encodedHost}`);
    }
    process.env.DATABASE_URL = normalized;
  } catch {
    // If parsing fails, leave DATABASE_URL unchanged
  }
}

/**
 * Senior Dev Diagnostic: Log what the container sees (redacted URL).
 * Run at startup when DEBUG_DB=1 or in development.
 */
export function logDatabaseConnectionDiagnostics(): void {
  const url = process.env.DATABASE_URL;
  const shouldLog = process.env.DEBUG_DB === '1' || process.env.NODE_ENV === 'development';
  if (!shouldLog || !url) return;

  const redacted = url.replace(/:[^:@]+@/, ':****@');
  console.log('[DB diagnostic] DATABASE_URL (redacted):', redacted);
  if (url.includes('/cloudsql/')) {
    const hostMatch = url.match(/\?host=([^&]+)/);
    if (hostMatch) {
      const socketPath = decodeURIComponent(hostMatch[1]);
      const dirExists = fs.existsSync(socketPath);
      console.log('[DB diagnostic] socket path (decoded):', socketPath);
      console.log('[DB diagnostic] directory exists:', dirExists);
    }
    try {
      const files = execSync(`ls -la "${CLOUDSQL_DIR}" 2>&1`).toString();
      console.log('[DB diagnostic] /cloudsql/ contents:', files);
    } catch {
      console.error('[DB diagnostic] /cloudsql/ directory missing or empty');
    }
  }
}
