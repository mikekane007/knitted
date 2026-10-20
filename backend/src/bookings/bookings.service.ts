import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookingsService {
  constructor(private readonly database: DatabaseService) {}

  async getMyBookings(userId: number) {
    const result = await this.database.query(
      `SELECT b."Id" AS id, b."BookedAt" AS "bookedAt",
              jsonb_build_object(
                'id', e."Id", 'title', e."Title", 'description', e."Description",
                'date', e."Date"
              ) AS event
       FROM "Bookings" b JOIN "Events" e ON e."Id" = b."EventId"
       WHERE b."UserId" = $1 ORDER BY b."BookedAt" DESC`,
      [userId],
    );
    return result.rows;
  }

  async getMyPasses(userId: number) {
    const result = await this.database.query(
      `SELECT b."Id" AS "bookingId", e."Id" AS "eventId", e."Title" AS title,
              e."Description" AS description, e."Date" AS date,
              e."Location" AS location, e."StartTime" AS "startTime",
              COALESCE(u."Name", 'Co-Host') AS "hostName",
              e."Price"::float8 AS price, e."CoverImage" AS "coverImage",
              'KNIT-' || lpad(b."Id"::text, 4, '0') || '-' ||
                lpad(e."Id"::text, 4, '0') AS "ticketCode",
              'https://knitted.nyc/checkin/' || b."Id"::text AS "qrCodeData"
       FROM "Bookings" b
       JOIN "Events" e ON e."Id" = b."EventId"
       LEFT JOIN "Users" u ON u."Id" = e."HostId"
       WHERE b."UserId" = $1 ORDER BY b."BookedAt" DESC`,
      [userId],
    );
    return result.rows.map((pass) => ({ ...pass, price: Number(pass.price) }));
  }

  async createBooking(userId: number, eventId: number) {
    const client = await this.database.getPool().connect();
    try {
      await client.query('BEGIN');
      const updatedEvent = await client.query<{ id: number }>(
        `UPDATE "Events"
         SET "AvailableTickets" = "AvailableTickets" - 1
         WHERE "Id" = $1 AND "AvailableTickets" > 0
         RETURNING "Id" AS id`,
        [eventId],
      );
      if (!updatedEvent.rowCount) {
        const eventExists = await client.query(
          'SELECT 1 FROM "Events" WHERE "Id" = $1',
          [eventId],
        );
        if (!eventExists.rowCount) {
          throw new NotFoundException('The specified event was not found.');
        }
        throw new BadRequestException('No tickets available for this event.');
      }
      const booking = await client.query(
        `INSERT INTO "Bookings" ("UserId", "EventId", "BookedAt")
         VALUES ($1, $2, now())
         RETURNING "Id" AS id, "EventId" AS "eventId", "UserId" AS "userId",
                   "BookedAt" AS "bookedAt"`,
        [userId, eventId],
      );
      await client.query('COMMIT');
      return booking.rows[0];
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          'Booking failed and the database transaction could not be rolled back.',
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
