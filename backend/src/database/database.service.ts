import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? process.env.CONNECTION_STRING,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
  });

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL && !process.env.CONNECTION_STRING) {
      throw new Error('DATABASE_URL must be configured.');
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "Id" SERIAL PRIMARY KEY,
        "Email" varchar(256) NOT NULL UNIQUE,
        "PasswordHash" varchar(512),
        "OAuthProvider" varchar(50),
        "OAuthProviderKey" varchar(256),
        "Name" text NOT NULL DEFAULT '',
        "Bio" text,
        "Location" text,
        "AvatarUrl" text,
        "WovenThreads" text,
        "IsVerified" boolean NOT NULL DEFAULT false,
        "JoinedDate" timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "Events" (
        "Id" SERIAL PRIMARY KEY,
        "Title" varchar(256) NOT NULL,
        "Description" varchar(2000) NOT NULL DEFAULT '',
        "Date" timestamptz NOT NULL,
        "TotalCapacity" integer NOT NULL,
        "AvailableTickets" integer NOT NULL,
        "Location" text NOT NULL DEFAULT '',
        "StartTime" text NOT NULL DEFAULT '',
        "EndTime" text NOT NULL DEFAULT '',
        "Price" numeric NOT NULL DEFAULT 0,
        "Category" text NOT NULL DEFAULT '',
        "Tags" text NOT NULL DEFAULT '',
        "CoverImage" text NOT NULL DEFAULT '',
        "HostId" integer REFERENCES "Users"("Id") ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS "Bookings" (
        "Id" SERIAL PRIMARY KEY,
        "UserId" integer NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
        "EventId" integer NOT NULL REFERENCES "Events"("Id") ON DELETE CASCADE,
        "BookedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "ChatMessages" (
        "Id" SERIAL PRIMARY KEY,
        "EventId" integer NOT NULL REFERENCES "Events"("Id") ON DELETE CASCADE,
        "UserId" integer NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
        "Message" varchar(1000) NOT NULL,
        "Timestamp" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IX_Events_HostId" ON "Events"("HostId");
      CREATE INDEX IF NOT EXISTS "IX_Bookings_UserId" ON "Bookings"("UserId");
      CREATE INDEX IF NOT EXISTS "IX_Bookings_EventId" ON "Bookings"("EventId");
      CREATE INDEX IF NOT EXISTS "IX_ChatMessages_EventId_Timestamp" ON "ChatMessages"("EventId", "Timestamp");
      CREATE INDEX IF NOT EXISTS "IX_ChatMessages_UserId" ON "ChatMessages"("UserId");
    `);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
    return values?.length
      ? this.pool.query<T>(text, values)
      : this.pool.query<T>(text);
  }

  getPool(): Pool {
    return this.pool;
  }
}
