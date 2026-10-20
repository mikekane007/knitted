import { DatabaseService } from '../database/database.service';
import { EventsService } from './events.service';

describe('EventsService search filters', () => {
  it('combines the existing filters with advanced date, category, and price filters safely', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const service = new EventsService({ query } as unknown as DatabaseService);

    await service.getEvents({
      search: 'coffee_%',
      neighborhood: 'DUMBO',
      category: 'Art & Design',
      price: 'Under $20',
      minPrice: 5,
      maxPrice: 19,
      dateFrom: '2026-10-21',
      dateTo: '2026-10-31',
      sortBy: 'price',
      limit: 20,
    });

    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('e."Title" ILIKE $1 ESCAPE');
    expect(sql).toContain('e."Location" ILIKE $2 ESCAPE');
    expect(sql).toContain('e."Category" ILIKE $3');
    expect(sql).toContain('e."Price" < 20');
    expect(sql).toContain('e."Date" >= $6');
    expect(sql).toContain('ORDER BY e."Price" ASC, e."Date" ASC LIMIT $8');
    expect(values).toEqual([
      '%coffee\\_\\%%',
      '%DUMBO%',
      'Art & Design',
      5,
      19,
      '2026-10-21',
      '2026-10-31',
      20,
    ]);
  });

  it('rejects reversed price and date ranges', async () => {
    const query = jest.fn();
    const service = new EventsService({ query } as unknown as DatabaseService);

    await expect(service.getEvents({ minPrice: 20, maxPrice: 10 }))
      .rejects.toThrow('minPrice cannot be greater than maxPrice.');
    await expect(service.getEvents({ dateFrom: '2026-11-01', dateTo: '2026-10-01' }))
      .rejects.toThrow('dateFrom cannot be later than dateTo.');
    expect(query).not.toHaveBeenCalled();
  });
});
