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
