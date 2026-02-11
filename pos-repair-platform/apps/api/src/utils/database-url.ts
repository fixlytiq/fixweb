/**
 * Normalizes DATABASE_URL for Cloud SQL Unix socket.
 * Pattern: postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
 * - Use 'localhost' as host in the authority; socket path goes only in the 'host' query parameter.
 * - Do not put :5432 in the socket path (some drivers append it and break the path).
 */
export function normalizeDatabaseUrl(): void {
  let url = process.env.DATABASE_URL;
  if (!url || !url.includes('/cloudsql/')) return;

  try {
    // Strip :5432 from the ?host= value if present (driver may append it; avoid double)
    const hostParamMatch = url.match(/\?host=([^&]+)/);
    if (hostParamMatch) {
      let socketPath = hostParamMatch[1];
      if (socketPath.endsWith(':5432')) {
        socketPath = socketPath.slice(0, -5);
        url = url.replace(/\?host=[^&]+/, `?host=${socketPath}`);
      }
    }

    // Ensure authority is @localhost/ (no port) so Prisma uses socket from query param only
    const authMatch = url.match(/^(postgres(?:ql)?:\/\/[^@]+@)([^/]+)(\/[^?]*\??.*)$/);
    if (authMatch) {
      const [, prefix, hostPart, pathAndQuery] = authMatch;
      if (hostPart !== 'localhost') {
        url = `${prefix}localhost${pathAndQuery}`;
      }
    }

    process.env.DATABASE_URL = url;
  } catch {
    // If parsing fails, leave DATABASE_URL unchanged
  }
}
