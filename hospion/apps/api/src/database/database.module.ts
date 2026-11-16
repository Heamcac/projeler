import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: Pool,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL ?? 'postgres://hospion:hospion@localhost:5432/hospion',
        }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
