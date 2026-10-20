import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BookingsService } from './bookings.service';

describe('BookingsService.createBooking', () => {
  it('decrements an available ticket and creates a booking in the same transaction', async () => {
    const clientQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: null })
      .mockResolvedValueOnce({ rows: [{ id: 8 }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [{ id: 12, eventId: 8, userId: 3, bookedAt: new Date() }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: null });
    const release = jest.fn();
    const database = {
      getPool: () => ({ connect: async () => ({ query: clientQuery, release }) }),
    } as unknown as DatabaseService;

    const result = await new BookingsService(database).createBooking(3, 8);

    expect(result).toMatchObject({ id: 12, eventId: 8, userId: 3 });
    expect(clientQuery.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      expect.stringContaining('"AvailableTickets" > 0'),
      expect.stringContaining('INSERT INTO "Bookings"'),
      'COMMIT',
    ]);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('does not insert a booking when no tickets remain', async () => {
    const clientQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: null })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: null });
    const database = {
      getPool: () => ({ connect: async () => ({ query: clientQuery, release: jest.fn() }) }),
    } as unknown as DatabaseService;

    await expect(new BookingsService(database).createBooking(3, 8))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(clientQuery.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO "Bookings"')))
      .toBe(false);
  });

  it('reports a missing event separately from a sold-out event', async () => {
    const clientQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: null })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: null });
    const database = {
      getPool: () => ({ connect: async () => ({ query: clientQuery, release: jest.fn() }) }),
    } as unknown as DatabaseService;

    await expect(new BookingsService(database).createBooking(3, 999))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
