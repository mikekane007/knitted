import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import {
  CreateEventDto,
  EventSearchQueryDto,
  PostChatMessageDto,
} from './dto/event.dto';

const EVENT_COLUMNS = `
  e."Id" AS id, e."Title" AS title, e."Description" AS description,
  e."Date" AS date, e."TotalCapacity" AS "totalCapacity",
  e."AvailableTickets" AS "availableTickets", e."Location" AS location,
  e."StartTime" AS "startTime", e."EndTime" AS "endTime",
  e."Price"::float8 AS price, e."Category" AS category, e."Tags" AS tags,
  e."CoverImage" AS "coverImage", e."HostId" AS "hostId",
  CASE WHEN u."Id" IS NULL THEN NULL ELSE jsonb_build_object(
    'id', u."Id", 'email', u."Email", 'name', u."Name", 'bio', u."Bio",
    'location', u."Location", 'avatarUrl', u."AvatarUrl",
    'wovenThreads', u."WovenThreads", 'isVerified', u."IsVerified",
    'joinedDate', u."JoinedDate"
  ) END AS host`;

export interface EventRow {
  id: number;
  title: string;
  description: string;
  date: Date;
  totalCapacity: number;
  availableTickets: number;
  location: string;
  startTime: string;
  endTime: string;
  price: number | string;
  category: string;
  tags: string;
  coverImage: string;
  hostId: number | null;
  host: Record<string, unknown> | null;
}

@Injectable()
export class EventsService {
  constructor(private readonly database: DatabaseService) {}

  async getEvents(filters: EventSearchQueryDto): Promise<EventRow[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (filters.search?.trim()) {
      const search = add(`%${this.escapeLike(filters.search.trim())}%`);
      conditions.push(`(
        e."Title" ILIKE ${search} ESCAPE '\\' OR
        e."Description" ILIKE ${search} ESCAPE '\\' OR
        e."Category" ILIKE ${search} ESCAPE '\\' OR
        e."Tags" ILIKE ${search} ESCAPE '\\'
      )`);
    }
    if (filters.neighborhood?.trim() && filters.neighborhood.toLowerCase() !== 'all nyc') {
      conditions.push(`e."Location" ILIKE ${add(`%${this.escapeLike(filters.neighborhood.trim())}%`)} ESCAPE '\\'`);
    }
    if (filters.category?.trim()) {
      conditions.push(`e."Category" ILIKE ${add(filters.category.trim())}`);
    }
    if (filters.price?.toLowerCase() === 'free') {
      conditions.push('e."Price" = 0');
    } else if (filters.price?.toLowerCase() === 'under $20') {
      conditions.push('e."Price" < 20');
    }
    if (filters.minPrice !== undefined) {
      conditions.push(`e."Price" >= ${add(filters.minPrice)}`);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`e."Price" <= ${add(filters.maxPrice)}`);
    }
    if (filters.dateFrom) {
      conditions.push(`e."Date" >= ${add(filters.dateFrom)}`);
    }
    if (filters.dateTo) {
      conditions.push(`e."Date" < (${add(filters.dateTo)}::date + INTERVAL '1 day')`);
    }
    if (
      filters.minPrice !== undefined
      && filters.maxPrice !== undefined
      && filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice.');
    }
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new BadRequestException('dateFrom cannot be later than dateTo.');
    }

    const orderBy: Record<string, string> = {
      date: 'e."Date" ASC, e."Id" ASC',
      price: 'e."Price" ASC, e."Date" ASC',
      priceDesc: 'e."Price" DESC, e."Date" ASC',
      newest: 'e."Id" DESC',
    };
    const order = orderBy[filters.sortBy ?? 'date'] ?? orderBy.date;
    const limit = add(filters.limit ?? 100);
    const result = await this.database.query<EventRow>(
      `SELECT ${EVENT_COLUMNS}
       FROM "Events" e LEFT JOIN "Users" u ON u."Id" = e."HostId"
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY ${order} LIMIT ${limit}`,
      values,
    );
    return result.rows.map((event) => ({ ...event, price: Number(event.price) }));
  }

  async getEvent(id: number): Promise<EventRow> {
    const result = await this.database.query<EventRow>(
      `SELECT ${EVENT_COLUMNS}
       FROM "Events" e LEFT JOIN "Users" u ON u."Id" = e."HostId"
       WHERE e."Id" = $1`,
      [id],
    );
    const event = result.rows[0];
    if (!event) {
      throw new NotFoundException();
    }
    return { ...event, price: Number(event.price) };
  }

  async createEvent(userId: number, dto: CreateEventDto): Promise<EventRow> {
    const result = await this.database.query<{ id: number }>(
      `INSERT INTO "Events"
         ("Title", "Description", "Date", "TotalCapacity", "AvailableTickets",
          "Location", "StartTime", "EndTime", "Price", "Category", "Tags",
          "CoverImage", "HostId")
       VALUES ($1, $2, $3::date, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING "Id" AS id`,
      [
        dto.title,
        dto.description,
        dto.date,
        dto.totalCapacity,
        dto.location,
        dto.startTime,
        dto.endTime,
        dto.price,
        dto.category,
        dto.tags,
        dto.coverImage || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
        userId,
      ],
    );
    return this.getEvent(result.rows[0].id);
  }

  async getCategoriesSummary() {
    const categories = [
      {
        name: 'Art & Design',
        tagline: 'Sketch, build, and capture the city together.',
        description: 'Drawing, sketching, painting, architecture tours, and hands-on design meetups in cozy local spots.',
        coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
        colorTheme: '#d97706',
      },
      {
        name: 'Food & Wine',
        tagline: 'Share natural wines, sourdough, and great stories.',
        description: 'Intimate supper clubs, natural wine tastings, high-fidelity listening bars, and local culinary collaborations.',
        coverImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800',
        colorTheme: '#dc2626',
      },
      {
        name: 'Active & Outdoors',
        tagline: 'Move, climb, run, and explore the landscape.',
        description: 'Sunrise runs, outdoor bouldering, park workouts, sunset hiking, and high-energy athletic gatherings.',
        coverImage: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=800',
        colorTheme: '#059669',
      },
    ];
    const counts = await this.database.query<{ category: string; count: number }>(
      `SELECT "Category" AS category, count(*)::int AS count
       FROM "Events" GROUP BY "Category"`,
    );
    const countByCategory = new Map(counts.rows.map((row) => [row.category, row.count]));
    return categories.map((category) => ({
      ...category,
      activeCount: countByCategory.get(category.name) ?? 0,
    }));
  }

  async getAttendees(eventId: number) {
    await this.requireEvent(eventId);
    const result = await this.database.query(
      `SELECT u."Id" AS id, u."Name" AS name, u."Email" AS email,
              u."Location" AS location, u."AvatarUrl" AS "avatarUrl",
              u."IsVerified" AS "isVerified"
       FROM "Bookings" b JOIN "Users" u ON u."Id" = b."UserId"
       WHERE b."EventId" = $1`,
      [eventId],
    );
    return result.rows;
  }

  async getChatMessages(eventId: number) {
    await this.requireEvent(eventId);
    const result = await this.database.query(
      `SELECT c."Id" AS id, c."EventId" AS "eventId", c."UserId" AS "userId",
              c."Message" AS message, c."Timestamp" AS timestamp,
              jsonb_build_object(
                'id', u."Id", 'email', u."Email", 'name', u."Name",
                'bio', u."Bio", 'location', u."Location",
                'avatarUrl', u."AvatarUrl", 'wovenThreads', u."WovenThreads",
                'isVerified', u."IsVerified", 'joinedDate', u."JoinedDate"
              ) AS "user"
       FROM "ChatMessages" c JOIN "Users" u ON u."Id" = c."UserId"
       WHERE c."EventId" = $1 ORDER BY c."Timestamp"`,
      [eventId],
    );
    return result.rows;
  }

  async postChatMessage(eventId: number, userId: number, dto: PostChatMessageDto) {
    await this.requireEvent(eventId);
    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException('Message cannot be empty.');
    }
    const result = await this.database.query(
      `INSERT INTO "ChatMessages" ("EventId", "UserId", "Message", "Timestamp")
       VALUES ($1, $2, $3, now())
       RETURNING "Id" AS id, "EventId" AS "eventId", "UserId" AS "userId",
                 "Message" AS message, "Timestamp" AS timestamp`,
      [eventId, userId, message],
    );
    const saved = result.rows[0];
    const userResult = await this.database.query(
      `SELECT "Id" AS id, "Email" AS email, "Name" AS name, "Bio" AS bio,
              "Location" AS location, "AvatarUrl" AS "avatarUrl",
              "WovenThreads" AS "wovenThreads", "IsVerified" AS "isVerified",
              "JoinedDate" AS "joinedDate"
       FROM "Users" WHERE "Id" = $1`,
      [userId],
    );
    return { ...saved, user: userResult.rows[0] };
  }

  async scanExternalEvents() {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new BadRequestException({
        Message: 'Apify API token is not configured. Please set the APIFY_API_TOKEN environment variable.',
      });
    }
    let response: Response;
    try {
      response = await fetch(
        `https://api.apify.com/v2/actors/oHaGcsfmmm2nxYdjA/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'events',
            searchKeyword: 'tech',
            city: 'New York',
            state: '',
            country: 'us',
            eventType: '',
            sortBy: '',
            maxResults: 10,
            connectorDelivery: 'summary',
          }),
          signal: AbortSignal.timeout(240_000),
        },
      );
    } catch (error) {
      throw new ServiceUnavailableException({
        Message: 'Failed to connect to Apify API.',
        Details: error instanceof Error ? error.message : 'Unknown connection error.',
      });
    }
    if (!response.ok) {
      const details = await response.text();
      throw new ServiceUnavailableException({
        Message: 'Apify API returned an error.',
        Details: details,
      });
    }
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new BadRequestException('Apify API returned invalid format (expected JSON array).');
    }

    const externalHost = await this.ensureExternalHost();
    for (const item of payload) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const data = item as Record<string, unknown>;
      const title = this.firstString(data, ['eventName', 'title', 'name']) ?? 'Local Gathering';
      const description = (this.firstString(data, ['eventDescription', 'description', 'info'])
        ?? 'A community event synced from external platform.').slice(0, 2000);
      const venue = data.venue && typeof data.venue === 'object'
        ? (data.venue as Record<string, unknown>).name
        : undefined;
      const location = this.firstString(data, ['address', 'location', 'venueName'])
        ?? (typeof venue === 'string' ? venue : 'New York, NY');
      const parsedDate = this.firstString(data, ['date', 'dateTime']);
      const eventDate = parsedDate && !Number.isNaN(Date.parse(parsedDate))
        ? new Date(parsedDate)
        : new Date(Date.now() + 2 * 86_400_000);
      const startTime = this.firstString(data, ['startTime']) ?? eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
      });
      const endTime = this.firstString(data, ['endTime']) ?? new Date(eventDate.getTime() + 2 * 3_600_000)
        .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      const coverImage = this.firstString(data, ['imageUrl', 'eventPhoto', 'image', 'photo'])
        ?? 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800';
      const priceValue = typeof data.price === 'number' ? data.price : typeof data.fee === 'number' ? data.fee : 0;
      const categoryText = `${title} ${description}`.toLowerCase();
      const category = /run|yoga|fit|climb|hiking|outdoor/.test(categoryText)
        ? 'Active & Outdoors'
        : /wine|food|cook|dinner|tasting/.test(categoryText)
          ? 'Food & Wine'
          : 'Art & Design';
      const tags = this.firstString(data, ['tags', 'category']) ?? '';

      await this.database.query(
        `INSERT INTO "Events"
          ("Title", "Description", "Date", "TotalCapacity", "AvailableTickets",
           "Location", "StartTime", "EndTime", "Price", "Category", "Tags",
           "CoverImage", "HostId")
         VALUES ($1, $2, $3, 30, 30, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [title.slice(0, 256), description, eventDate.toISOString(), location, startTime, endTime,
          priceValue, category, tags.slice(0, 1000), coverImage, externalHost],
      );
    }
    return this.getEvents({});
  }

  async seedEvents() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    const existing = await this.database.query('SELECT 1 FROM "Events" LIMIT 1');
    if (existing.rowCount) {
      return { message: 'Seed data was not applied because events already exist.' };
    }

    const pool = this.database.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const examples = [
        ['sarah.j@example.com', 'Sarah Jenkins', 'Morning Coffee & Urban Sketching', 'Join us for a slow Sunday morning sketching workshop.', 1, 0, 'Art & Design', 'Sketching, Coffee', 'The Roastery, DUMBO'],
        ['elena.r@example.com', 'Elena Rossi', 'Natural Wine & Vinyl Listening', 'An intimate evening of natural wine and warm analog sound.', 3, 22, 'Food & Wine', 'Vinyl, Natural Wine', 'Cellar Door, East Village'],
        ['marcus.j@example.com', 'Marcus Johnson', 'Sunrise Bouldering & Espresso', 'An early morning outdoor climbing and coffee gathering.', 5, 15, 'Active & Outdoors', 'Climbing, Fitness, Coffee', 'DUMBO Boulders'],
      ] as const;
      for (const [email, name, title, description, days, price, category, tags, location] of examples) {
        const user = await client.query<{ id: number }>(
          `INSERT INTO "Users" ("Email", "Name", "IsVerified", "JoinedDate")
           VALUES ($1, $2, false, now())
           ON CONFLICT ("Email") DO UPDATE SET "Email" = EXCLUDED."Email"
           RETURNING "Id" AS id`,
          [email, name],
        );
        await client.query(
          `INSERT INTO "Events"
            ("Title", "Description", "Date", "TotalCapacity", "AvailableTickets",
             "Location", "StartTime", "EndTime", "Price", "Category", "Tags",
             "CoverImage", "HostId")
           VALUES ($1, $2, current_date + $3, 20, 20, $4, '09:00 AM', '11:00 AM',
                   $5, $6, $7, $8, $9)`,
          [title, description, days, location, price, category, tags,
            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
            user.rows[0].id],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return { message: 'Seed events created.' };
  }

  private async requireEvent(eventId: number): Promise<void> {
    const result = await this.database.query('SELECT 1 FROM "Events" WHERE "Id" = $1', [eventId]);
    if (!result.rowCount) {
      throw new NotFoundException('Event not found.');
    }
  }

  private async ensureExternalHost(): Promise<number> {
    const result = await this.database.query<{ id: number }>(
      `INSERT INTO "Users"
        ("Email", "Name", "Bio", "Location", "AvatarUrl", "WovenThreads", "IsVerified", "JoinedDate")
       VALUES (
         'external.host@meetup.com', 'External Meetup Organizer',
         'Automatically synced local meetups and community gatherings.',
         'New York, NY',
         'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
         'Community, Integration', true, now()
       )
       ON CONFLICT ("Email") DO UPDATE SET "Email" = EXCLUDED."Email"
       RETURNING "Id" AS id`,
    );
    return result.rows[0].id;
  }

  private firstString(data: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      if (typeof data[key] === 'string' && data[key]) {
        return data[key] as string;
      }
    }
    return undefined;
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
