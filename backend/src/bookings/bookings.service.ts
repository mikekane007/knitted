import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, FirebaseRecord } from '../database/database.service';

interface EventRecord extends FirebaseRecord {
  id: number;
  title: string;
  description: string;
  date: Date;
  availableTickets: number;
  location: string;
  startTime: string;
  price: number;
  coverImage: string;
  hostId: number | null;
}

interface BookingRecord extends FirebaseRecord {
  id: number;
  userId: number;
  eventId: number;
  bookedAt: Date;
}

interface UserRecord extends FirebaseRecord {
  id: number;
  name: string;
}

@Injectable()
export class BookingsService {
  constructor(private readonly database: DatabaseService) {}

  async getMyBookings(userId: number) {
    const snapshot = await this.database.collection<BookingRecord>('bookings')
      .where('userId', '==', userId)
      .orderBy('bookedAt', 'desc')
      .get();
    const bookings = await Promise.all(snapshot.docs.map(async (document) => {
      const booking = document.data();
      const eventSnapshot = await this.database.document<EventRecord>('events', booking.eventId).get();
      if (!eventSnapshot.exists) {
        return null;
      }
      const event = eventSnapshot.data()!;
      return {
        id: booking.id,
        bookedAt: booking.bookedAt,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
        },
      };
    }));
    return bookings.filter((booking) => booking !== null);
  }

  async getMyPasses(userId: number) {
    const snapshot = await this.database.collection<BookingRecord>('bookings')
      .where('userId', '==', userId)
      .orderBy('bookedAt', 'desc')
      .get();
    return Promise.all(snapshot.docs.map(async (document) => {
      const booking = document.data();
      const eventSnapshot = await this.database.document<EventRecord>('events', booking.eventId).get();
      if (!eventSnapshot.exists) {
        return null;
      }
      const event = eventSnapshot.data()!;
      const hostSnapshot = event.hostId
        ? await this.database.document<UserRecord>('users', event.hostId).get()
        : undefined;
      return {
        bookingId: booking.id,
        eventId: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        startTime: event.startTime,
        hostName: hostSnapshot?.data()?.name || 'Co-Host',
        price: Number(event.price),
        coverImage: event.coverImage,
        ticketCode: `KNIT-${String(booking.id).padStart(4, '0')}-${String(event.id).padStart(4, '0')}`,
        qrCodeData: `https://knitted.nyc/checkin/${booking.id}`,
      };
    })).then((passes) => passes.filter((pass) => pass !== null));
  }

  async createBooking(userId: number, eventId: number) {
    return this.database.firestore.runTransaction(async (transaction) => {
      const eventRef = this.database.document<EventRecord>('events', eventId);
      const eventSnapshot = await transaction.get(eventRef);
      if (!eventSnapshot.exists) {
        throw new NotFoundException('The specified event was not found.');
      }

      const event = eventSnapshot.data()!;
      if (event.availableTickets <= 0) {
        throw new BadRequestException('No tickets available for this event.');
      }

      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'bookings');
      const bookedAt = new Date();
      const booking: BookingRecord = { id, userId, eventId, bookedAt };
      transaction.update(eventRef, { availableTickets: event.availableTickets - 1 });
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('bookings', id), booking);
      return booking;
    });
  }
}
