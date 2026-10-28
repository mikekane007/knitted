import { DatabaseService } from '../database/database.service';
import { EventsService } from './events.service';

function event(id: number, overrides: Record<string, unknown>) {
  return {
    id,
    title: `Event ${id}`,
    description: '',
    date: new Date('2026-10-25T18:00:00.000Z'),
    totalCapacity: 10,
    availableTickets: 10,
    location: 'DUMBO, Brooklyn',
    startTime: '18:00',
    endTime: '20:00',
    price: 10,
    category: 'Art & Design',
    tags: '',
    coverImage: '',
    hostId: null,
    ...overrides,
  };
}

function createDatabase(events: Record<string, unknown>[], users: Record<string, unknown>[] = []) {
  const get = jest.fn(async () => ({ docs: events.map((data) => ({ data: () => data })) }));
  const database = {
    collection: () => ({ get }),
    document: (collection: string, id: number) => ({ collection, id }),
    firestore: {
      getAll: async (...refs: { id: number }[]) => refs.map((ref) => ({
        data: () => users.find((user) => user.id === ref.id),
      })),
    },
  } as unknown as DatabaseService;
  return { database, get };
}

describe('EventsService search filters', () => {
  it('combines the existing filters with advanced date, category, and price filters', async () => {
    const { database } = createDatabase([
      event(1, { title: 'Coffee sketching', price: 15 }),
      event(2, { title: 'Coffee sketching', price: 5, date: new Date('2026-10-31T23:00:00.000Z') }),
      event(3, { title: 'Coffee sketching', price: 25 }),
      event(4, { title: 'Coffee sketching', price: 3 }),
      event(5, { title: 'Coffee sketching', price: 12, location: 'Harlem' }),
      event(6, { title: 'Coffee sketching', price: 12, category: 'Food & Wine' }),
      event(7, { title: 'Coffee sketching', price: 12, date: new Date('2026-11-01T00:00:00.000Z') }),
      event(8, { title: 'Pottery', price: 12 }),
      event(9, { title: 'Coffee sketching', price: 8, hostId: 42 }),
    ], [{ id: 42, name: 'Ada', email: 'ada@example.com', passwordHash: 'secret', oauthProviderKey: 'key', joinedDate: new Date() }]);
    const service = new EventsService(database);

    const result = await service.getEvents({
      search: 'coffee',
      neighborhood: 'dumbo',
      category: 'art & design',
      price: 'Under $20',
      minPrice: 5,
      maxPrice: 19,
      dateFrom: '2026-10-21',
      dateTo: '2026-10-31',
      sortBy: 'price',
      limit: 3,
    });

    expect(result.map((row) => row.id)).toEqual([2, 9, 1]);
    expect(result[1].host).toMatchObject({ id: 42, name: 'Ada' });
    expect(result[1].host).not.toHaveProperty('passwordHash');
    expect(result[1].host).not.toHaveProperty('oauthProviderKey');
  });

  it('rejects reversed price and date ranges', async () => {
    const { database, get } = createDatabase([]);
    const service = new EventsService(database);

    await expect(service.getEvents({ minPrice: 20, maxPrice: 10 }))
      .rejects.toThrow('minPrice cannot be greater than maxPrice.');
    await expect(service.getEvents({ dateFrom: '2026-11-01', dateTo: '2026-10-01' }))
      .rejects.toThrow('dateFrom cannot be later than dateTo.');
    expect(get).not.toHaveBeenCalled();
  });
});
