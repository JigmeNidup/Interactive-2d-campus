import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (err) => {
    console.error("[pg] unexpected pool error", err);
  });

  return pool;
}

export const pool: Pool = global.__pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never);
}

export function getClient(): Promise<PoolClient> {
  return pool.connect();
}
