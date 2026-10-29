export interface Booking {
  id: number;
  bookedAt: string;
  event: {
    id: number;
    title: string;
    description: string;
    date: string;
  };
}

export interface Pass {
  bookingId: number;
  eventId: number;
  title: string;
  description: string;
  date: string;
  location: string;
  startTime: string;
  hostName: string;
  price: number;
  coverImage: string;
  ticketCode: string;
  qrCodeData: string;
}
