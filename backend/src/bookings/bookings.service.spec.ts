import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BookingsService } from './bookings.service';

interface Ref {
  key: string;
}

function createDatabase(seed: Record<string, Record<string, unknown>>) {
  const store = new Map(Object.entries(seed));
  const document = (collection: string, id: string | number): Ref => ({ key: `${collection}/${id}` });
  const snapshot = (ref: Ref) => ({
    exists: store.has(ref.key),
    data: () => store.get(ref.key),
  });

  const writes: { op: string; key: string; data: Record<string, unknown> }[] = [];
  const database = {
    document,
    firestore: {
      runTransaction: async <T>(fn: (transaction: unknown) => Promise<T>) => {
        const pending: typeof writes = [];
        const transaction = {
          get: async (ref: Ref) => snapshot(ref),
          set: (ref: Ref, data: Record<string, unknown>) => pending.push({ op: 'set', key: ref.key, data }),
          create: (ref: Ref, data: Record<string, unknown>) => pending.push({ op: 'create', key: ref.key, data }),
          update: (ref: Ref, data: Record<string, unknown>) => pending.push({ op: 'update', key: ref.key, data }),
        };
        const result = await fn(transaction);
        for (const write of pending) {
          store.set(write.key, write.op === 'update' ? { ...store.get(write.key), ...write.data } : write.data);
        }
        writes.push(...pending);
        return result;
      },
    },
    readNextId: async (transaction: { get: (ref: Ref) => Promise<ReturnType<typeof snapshot>> }, name: string) => {
      const reference = document('counters', name);
      const current = (await transaction.get(reference)).data() as { value: number } | undefined;
      return { id: (current?.value ?? 0) + 1, reference };
    },
  } as unknown as DatabaseService;

  return { database, store, writes };
}

describe('BookingsService.createBooking', () => {
  it('decrements an available ticket and creates a booking in the same transaction', async () => {
    const { database, store, writes } = createDatabase({
      'events/8': { id: 8, availableTickets: 2 },
      'counters/bookings': { value: 11 },
    });

    const result = await new BookingsService(database).createBooking(3, 8);

    expect(result).toMatchObject({ id: 12, eventId: 8, userId: 3 });
    expect(store.get('events/8')).toMatchObject({ availableTickets: 1 });
    expect(store.get('counters/bookings')).toEqual({ value: 12 });
    expect(store.get('bookings/12')).toMatchObject({ id: 12, eventId: 8, userId: 3 });
    expect(writes.map(({ op, key }) => `${op} ${key}`)).toEqual([
      'update events/8',
      'set counters/bookings',
      'create bookings/12',
    ]);
  });

  it('does not create a booking when no tickets remain', async () => {
    const { database, writes } = createDatabase({
      'events/8': { id: 8, availableTickets: 0 },
    });

    await expect(new BookingsService(database).createBooking(3, 8))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(writes).toEqual([]);
  });

  it('reports a missing event separately from a sold-out event', async () => {
    const { database, writes } = createDatabase({});

    await expect(new BookingsService(database).createBooking(3, 999))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(writes).toEqual([]);
  });
});
