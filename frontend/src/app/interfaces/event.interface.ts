export interface EventHost {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  isVerified?: boolean;
}

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
  host?: EventHost;
}

export interface EventSearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'price' | 'priceDesc' | 'newest';
  limit?: number;
}

export interface EventCategory {
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  colorTheme: string;
  activeCount: number;
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
  location: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface ChatMessage {
  id: number;
  eventId: number;
  userId: number;
  message: string;
  timestamp: string;
  user?: { id: number; name: string; email: string; avatarUrl: string | null };
}

export interface EventDraft {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  price: number;
  category: string;
  tags: string;
  coverImage: string;
  totalCapacity: number;
}
