import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

type ClientLike = Pool | PoolClient;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    client: ClientLike = this.pool,
  ): Promise<QueryResult<T>> {
    return client.query<T>(text, params);
  }

  async tx<T>(handler: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await handler(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
