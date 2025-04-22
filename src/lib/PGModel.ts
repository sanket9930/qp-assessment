import { Pool, QueryResult, QueryResultRow } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false, // Needed for Railway/Supabase/etc.
  },
});

export const PGModel = {
  query,
  checkConnection,
  release
}

// Define a type for the query parameters
async function query<T extends QueryResultRow>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  const result = await pool.query<T>(text, params);
  return result;
}

async function checkConnection(): Promise<void> {
  await pool.query('SELECT 1');
}

async function release(): Promise<void> {
  const client = await pool.connect()
  client.release()
}
