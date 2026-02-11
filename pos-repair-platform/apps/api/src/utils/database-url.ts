/**
 * Cloud SQL Unix socket: we use "brute force" format so Prisma doesn't append :5432.
 * - Authority: postgresql://USER:PASSWORD@localhost/DB_NAME (no :5432 after localhost).
 * - Socket path in ?host= only. URL-encoding the host param can help when colons in
 *   the instance name (PROJECT:REGION:INSTANCE) break the URI parser.
 *
 * Brute force (directory): ?host=/cloudsql/repair-pos-485101:us-central1:pos-repair-postgres
 * URL-encoded:             ?host=%2Fcloudsql%2Frepair-pos-485101%3Aus-central1%3Apos-repair-postgres
 */

import * as fs from 'fs';

export function normalizeDatabaseUrl(): void {
  let url = process.env.DATABASE_URL;
  if (!url || !url.includes('/cloudsql/')) return;

  try {
    // 1. Force @localhost/ with NO port (Prisma must not see :5432 in authority or it can append to socket path)
    const authMatch = url.match(/^(postgres(?:ql)?:\/\/[^@]+@)([^/]+)(\/[^?]*\??.*)$/);
    if (authMatch) {
      const [, prefix, hostPart, pathAndQuery] = authMatch;
      if (hostPart !== 'localhost') {
        const newHost = hostPart.includes(':') ? 'localhost' : hostPart;
        url = `${prefix}${newHost}${pathAndQuery}`;
      }
    }
    // Strip :5432 from authority if still present
    url = url.replace(/@localhost:5432\//, '@localhost/');

    // 2. Normalize ?host= value: strip trailing :5432 (driver must not append it)
    const hostParamMatch = url.match(/\?host=([^&]+)/);
    if (hostParamMatch) {
      let socketPath = decodeURIComponent(hostParamMatch[1]);
      if (socketPath.endsWith(':5432') && !socketPath.endsWith('/.s.PGSQL.5432')) {
        socketPath = socketPath.slice(0, -5);
      }
      // URL-encode the host param so colons in instance name don't break the URI parser
      const encodedHost = encodeURIComponent(socketPath);
      url = url.replace(/\?host=[^&]+/, `?host=${encodedHost}`);
    }

    process.env.DATABASE_URL = url;
  } catch {
    // If parsing fails, leave DATABASE_URL unchanged
  }
}

/**
 * Log what the container sees: redacted DATABASE_URL and whether the socket path exists.
 * Run at startup when DEBUG_DB=1 or in development. Helps catch "ghost" env or empty /cloudsql/.
 */
export function logDatabaseConnectionDiagnostics(): void {
  const url = process.env.DATABASE_URL;
  const shouldLog = process.env.DEBUG_DB === '1' || process.env.NODE_ENV === 'development';
  if (!shouldLog || !url) return;

  const redacted = url.replace(/:[^:@]+@/, ':****@');
  console.log('[DB diagnostic] DATABASE_URL (redacted):', redacted);

  const hostMatch = url.match(/\?host=([^&]+)/);
  if (hostMatch) {
    const socketPath = decodeURIComponent(hostMatch[1]);
    const dir = socketPath.endsWith('/.s.PGSQL.5432') ? socketPath.slice(0, -'.s.PGSQL.5432'.length) : socketPath;
    const fileExists = fs.existsSync(socketPath);
    const dirExists = fs.existsSync(dir);
    console.log('[DB diagnostic] socket path:', socketPath);
    console.log('[DB diagnostic] socket file exists:', fileExists, '| directory exists:', dirExists);
    if (!fileExists && !dirExists) {
      console.warn('[DB diagnostic] /cloudsql/ mount may be empty. Check Cloud Run annotations: run.googleapis.com/cloudsql-instances');
    }
  }
}
