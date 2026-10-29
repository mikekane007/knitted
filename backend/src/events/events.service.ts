import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { DatabaseService, FirebaseRecord } from '../database/database.service';
import {
  CreateEventDto,
  EventSearchQueryDto,
  PostChatMessageDto,
} from './dto/event.dto';

interface UserRecord extends FirebaseRecord {
  id: number;
  email: string;
  passwordHash: string | null;
  oauthProviderKey: string | null;
  name: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  wovenThreads: string | null;
  isVerified: boolean;
  joinedDate: Date | Timestamp;
}

interface EventRecord extends FirebaseRecord {
  id: number;
  title: string;
  description: string;
  date: Date | Timestamp;
  totalCapacity: number;
  availableTickets: number;
  location: string;
  startTime: string;
  endTime: string;
  price: number;
  category: string;
  tags: string;
  coverImage: string;
  hostId: number | null;
}

interface BookingRecord extends FirebaseRecord {
  id: number;
  eventId: number;
  userId: number;
}

interface ChatRecord extends FirebaseRecord {
  id: number;
  eventId: number;
  userId: number;
  message: string;
  timestamp: Date | Timestamp;
}

interface EmailIndex extends FirebaseRecord {
  userId: number;
}

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
  price: number;
  category: string;
  tags: string;
  coverImage: string;
  hostId: number | null;
  host: Record<string, unknown> | null;
}

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800';

@Injectable()
export class EventsService {
  constructor(private readonly database: DatabaseService) {}

  async getEvents(filters: EventSearchQueryDto): Promise<EventRow[]> {
    this.validateFilters(filters);
    const snapshot = await this.database.collection<EventRecord>('events').get();
    const events = snapshot.docs
      .map((document) => this.toEventRow(document.data()))
      .filter((event) => this.matchesFilters(event, filters));

    this.sortEvents(events, filters.sortBy);
    const limited = events.slice(0, filters.limit ?? 100);
    const hostIds = [...new Set(limited.map((event) => event.hostId).filter(
      (id): id is number => id !== null,
    ))];
    const hostSnapshots = hostIds.length
      ? await this.database.firestore.getAll(
        ...hostIds.map((id) => this.database.document<UserRecord>('users', id)),
      )
      : [];
    const hosts = new Map<number, UserRecord>();
    for (const snapshot of hostSnapshots) {
      const user = snapshot.data() as UserRecord | undefined;
      if (user) {
        hosts.set(user.id, user);
      }
    }

    return limited.map((event) => ({
      ...event,
      host: event.hostId === null ? null : this.publicUser(hosts.get(event.hostId)),
    }));
  }

  async getEvent(id: number): Promise<EventRow> {
    const snapshot = await this.database.document<EventRecord>('events', id).get();
    const record = snapshot.data();
    if (!record) {
      throw new NotFoundException();
    }
    const event = this.toEventRow(record);
    const hostSnapshot = event.hostId
      ? await this.database.document<UserRecord>('users', event.hostId).get()
      : undefined;
    return {
      ...event,
      host: this.publicUser(hostSnapshot?.data()),
    };
  }

  async createEvent(userId: number, dto: CreateEventDto): Promise<EventRow> {
    const event = await this.database.firestore.runTransaction(async (transaction) => {
      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'events');
      const record: EventRecord = {
        id,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        totalCapacity: dto.totalCapacity,
        availableTickets: dto.totalCapacity,
        location: dto.location,
        startTime: dto.startTime,
        endTime: dto.endTime,
        price: dto.price,
        category: dto.category,
        tags: dto.tags,
        coverImage: dto.coverImage || DEFAULT_COVER_IMAGE,
        hostId: userId,
      };
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('events', id), record);
      return record;
    });
    return this.getEvent(event.id);
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
    const snapshot = await this.database.collection<EventRecord>('events').get();
    const countByCategory = new Map<string, number>();
    for (const document of snapshot.docs) {
      const category = document.data().category;
      countByCategory.set(category, (countByCategory.get(category) ?? 0) + 1);
    }
    return categories.map((category) => ({
      ...category,
      activeCount: countByCategory.get(category.name) ?? 0,
    }));
  }

  async getAttendees(eventId: number) {
    await this.requireEvent(eventId);
    const bookings = await this.database.collection<BookingRecord>('bookings')
      .where('eventId', '==', eventId)
      .get();
    const userIds = [...new Set(bookings.docs.map((booking) => booking.data().userId))];
    if (!userIds.length) {
      return [];
    }
    const users = await this.database.firestore.getAll(
      ...userIds.map((id) => this.database.document<UserRecord>('users', id)),
    );
    return users.flatMap((snapshot) => {
      const user = snapshot.data() as UserRecord | undefined;
      return user ? [{
        id: user.id,
        name: user.name,
        email: user.email,
        location: user.location,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      }] : [];
    });
  }

  async getChatMessages(eventId: number) {
    await this.requireEvent(eventId);
    const messages = await this.database.collection<ChatRecord>('chatMessages')
      .where('eventId', '==', eventId)
      .orderBy('timestamp', 'asc')
      .get();
    const userIds = [...new Set(messages.docs.map((message) => message.data().userId))];
    const userSnapshots = userIds.length
      ? await this.database.firestore.getAll(
        ...userIds.map((id) => this.database.document<UserRecord>('users', id)),
      )
      : [];
    const users = new Map<number, UserRecord>();
    for (const snapshot of userSnapshots) {
      const user = snapshot.data() as UserRecord | undefined;
      if (user) {
        users.set(user.id, user);
      }
    }
    return messages.docs.flatMap((document) => {
      const message = document.data();
      const user = users.get(message.userId);
      return user ? [{
        id: message.id,
        eventId: message.eventId,
        userId: message.userId,
        message: message.message,
        timestamp: this.asDate(message.timestamp),
        user: this.publicUser(user),
      }] : [];
    });
  }

  async postChatMessage(eventId: number, userId: number, dto: PostChatMessageDto) {
    await this.requireEvent(eventId);
    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException('Message cannot be empty.');
    }
    const userSnapshot = await this.database.document<UserRecord>('users', userId).get();
    const user = userSnapshot.data();
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    const saved = await this.database.firestore.runTransaction(async (transaction) => {
      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'chatMessages');
      const record: ChatRecord = { id, eventId, userId, message, timestamp: new Date() };
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('chatMessages', id), record);
      return record;
    });
    return { ...saved, user: this.publicUser(user) };
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
      throw new ServiceUnavailableException({
        Message: 'Apify API returned an error.',
        Details: await response.text(),
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
        ?? DEFAULT_COVER_IMAGE;
      const price = typeof data.price === 'number' ? data.price : typeof data.fee === 'number' ? data.fee : 0;
      const categoryText = `${title} ${description}`.toLowerCase();
      const category = /run|yoga|fit|climb|hiking|outdoor/.test(categoryText)
        ? 'Active & Outdoors'
        : /wine|food|cook|dinner|tasting/.test(categoryText)
          ? 'Food & Wine'
          : 'Art & Design';
      await this.createStoredEvent({
        title: title.slice(0, 256),
        description,
        date: eventDate,
        totalCapacity: 30,
        availableTickets: 30,
        location,
        startTime,
        endTime,
        price,
        category,
        tags: (this.firstString(data, ['tags', 'category']) ?? '').slice(0, 1000),
        coverImage,
        hostId: externalHost,
      });
    }
    return this.getEvents({});
  }

  async seedEvents() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    const existing = await this.database.collection<EventRecord>('events').limit(1).get();
    if (!existing.empty) {
      return { message: 'Seed data was not applied because events already exist.' };
    }

    const examples = [
      ['sarah.j@example.com', 'Sarah Jenkins', 'Morning Coffee & Urban Sketching', 'Join us for a slow Sunday morning sketching workshop.', 1, 0, 'Art & Design', 'Sketching, Coffee', 'The Roastery, DUMBO'],
      ['elena.r@example.com', 'Elena Rossi', 'Natural Wine & Vinyl Listening', 'An intimate evening of natural wine and warm analog sound.', 3, 22, 'Food & Wine', 'Vinyl, Natural Wine', 'Cellar Door, East Village'],
      ['marcus.j@example.com', 'Marcus Johnson', 'Sunrise Bouldering & Espresso', 'An early morning outdoor climbing and coffee gathering.', 5, 15, 'Active & Outdoors', 'Climbing, Fitness, Coffee', 'DUMBO Boulders'],
    ] as const;
    for (const [email, name, title, description, days, price, category, tags, location] of examples) {
      const hostId = await this.findOrCreateSystemUser(email, name);
      await this.createStoredEvent({
        title,
        description,
        date: new Date(Date.now() + days * 86_400_000),
        totalCapacity: 20,
        availableTickets: 20,
        location,
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        price,
        category,
        tags,
        coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
        hostId,
      });
    }
    return { message: 'Seed events created.' };
  }

  private async requireEvent(eventId: number): Promise<void> {
    const snapshot = await this.database.document<EventRecord>('events', eventId).get();
    if (!snapshot.exists) {
      throw new NotFoundException('Event not found.');
    }
  }

  private async ensureExternalHost(): Promise<number> {
    return this.findOrCreateSystemUser(
      'external.host@meetup.com',
      'External Meetup Organizer',
      {
        bio: 'Automatically synced local meetups and community gatherings.',
        location: 'New York, NY',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        wovenThreads: 'Community, Integration',
        isVerified: true,
      },
    );
  }

  private async findOrCreateSystemUser(
    emailValue: string,
    name: string,
    extras: Partial<UserRecord> = {},
  ): Promise<number> {
    const email = emailValue.toLowerCase();
    const key = createHash('sha256').update(email).digest('hex');
    const emailRef = this.database.document<EmailIndex>('userEmails', key);
    return this.database.firestore.runTransaction(async (transaction) => {
      const emailSnapshot = await transaction.get(emailRef);
      if (emailSnapshot.exists) {
        const userId = emailSnapshot.data()?.userId;
        if (typeof userId !== 'number') {
          throw new Error('System user email index is invalid.');
        }
        return userId;
      }
      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'users');
      const user: UserRecord = {
        id,
        email,
        passwordHash: null,
        oauthProvider: null,
        oauthProviderKey: null,
        name,
        bio: null,
        location: null,
        avatarUrl: null,
        wovenThreads: null,
        isVerified: false,
        joinedDate: new Date(),
        ...extras,
      };
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('users', id), user);
      transaction.create(emailRef, { userId: id });
      return id;
    });
  }

  private async createStoredEvent(
    record: Omit<EventRecord, 'id'>,
  ): Promise<number> {
    return this.database.firestore.runTransaction(async (transaction) => {
      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'events');
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('events', id), { ...record, id });
      return id;
    });
  }

  private validateFilters(filters: EventSearchQueryDto): void {
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
  }

  private matchesFilters(event: EventRow, filters: EventSearchQueryDto): boolean {
    const search = filters.search?.trim().toLowerCase();
    if (search && !`${event.title} ${event.description} ${event.category} ${event.tags}`.toLowerCase().includes(search)) {
      return false;
    }
    const neighborhood = filters.neighborhood?.trim().toLowerCase();
    if (neighborhood && neighborhood !== 'all nyc' && !event.location.toLowerCase().includes(neighborhood)) {
      return false;
    }
    if (filters.category?.trim() && event.category.toLowerCase() !== filters.category.trim().toLowerCase()) {
      return false;
    }
    const priceFilter = filters.price?.toLowerCase();
    if (priceFilter === 'free' && event.price !== 0) {
      return false;
    }
    if (priceFilter === 'under $20' && event.price >= 20) {
      return false;
    }
    if (filters.minPrice !== undefined && event.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && event.price > filters.maxPrice) {
      return false;
    }
    const from = filters.dateFrom ? new Date(`${filters.dateFrom.slice(0, 10)}T00:00:00.000Z`) : undefined;
    const to = filters.dateTo
      ? new Date(new Date(`${filters.dateTo.slice(0, 10)}T00:00:00.000Z`).getTime() + 86_400_000)
      : undefined;
    return !(from && event.date < from) && !(to && event.date >= to);
  }

  private sortEvents(events: EventRow[], sortBy?: string): void {
    events.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.id - a.id;
      }
      if (sortBy === 'price') {
        return a.price - b.price || a.date.getTime() - b.date.getTime();
      }
      if (sortBy === 'priceDesc') {
        return b.price - a.price || a.date.getTime() - b.date.getTime();
      }
      return a.date.getTime() - b.date.getTime() || a.id - b.id;
    });
  }

  private toEventRow(record: EventRecord): EventRow {
    return {
      ...record,
      date: this.asDate(record.date),
      price: Number(record.price),
      host: null,
    };
  }

  private asDate(value: Date | Timestamp): Date {
    return value instanceof Date ? value : value.toDate();
  }

  private publicUser(user?: UserRecord): Record<string, unknown> | null {
    if (!user) {
      return null;
    }
    const {
      passwordHash: _passwordHash,
      oauthProviderKey: _oauthProviderKey,
      ...safe
    } = user;
    return {
      ...safe,
      joinedDate: this.asDate(user.joinedDate),
    };
  }

  private firstString(data: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      if (typeof data[key] === 'string' && data[key]) {
        return data[key] as string;
      }
    }
    return undefined;
  }
}
