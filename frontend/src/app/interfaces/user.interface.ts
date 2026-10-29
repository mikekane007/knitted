export interface UserProfile {
  id: number;
  email: string;
  oauthProvider: string | null;
  name: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  wovenThreads: string | null;
  isVerified: boolean;
  joinedDate?: string;
}

export type ProfileUpdate = Partial<Pick<UserProfile, 'name' | 'bio' | 'location' | 'avatarUrl' | 'wovenThreads'>>;
