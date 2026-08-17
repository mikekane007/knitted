export interface KnittedEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  totalCapacity: number;
  availableTickets: number;
  location: string;
  startTime: string;
  endTime: string;
  price: number;
  category: string;
  tags: string;
  coverImage: string;
  hostId?: number;
  host?: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string;
    bio?: string;
    isVerified?: boolean;
  };
}
