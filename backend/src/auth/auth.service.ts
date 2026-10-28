import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { DatabaseService, FirebaseRecord } from '../database/database.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { hashPassword, verifyPassword } from './password-hasher';

interface UserRecord extends FirebaseRecord {
  id: number;
  email: string;
  passwordHash: string | null;
  oauthProvider: string | null;
  oauthProviderKey: string | null;
  name: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  wovenThreads: string | null;
  isVerified: boolean;
  joinedDate: Date;
}

type PublicUser = Omit<UserRecord, 'passwordHash' | 'oauthProviderKey'>;

interface EmailIndex extends FirebaseRecord {
  userId: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await hashPassword(dto.password);
    const emailRef = this.emailReference(email);
    const user = await this.database.firestore.runTransaction(async (transaction) => {
      if ((await transaction.get(emailRef)).exists) {
        throw new BadRequestException('Email is already taken.');
      }

      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'users');
      const record: UserRecord = {
        id,
        email,
        passwordHash,
        oauthProvider: null,
        oauthProviderKey: null,
        name: '',
        bio: null,
        location: null,
        avatarUrl: null,
        wovenThreads: null,
        isVerified: false,
        joinedDate: new Date(),
      };
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('users', id), record);
      transaction.create(emailRef, { userId: id });
      return record;
    });

    return { token: await this.createToken(user.id, user.email), email: user.email };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const emailSnapshot = await this.emailReference(email).get();
    const userId = emailSnapshot.data()?.userId;
    const userSnapshot = userId
      ? await this.database.document<UserRecord>('users', userId).get()
      : undefined;
    const user = userSnapshot?.data();
    if (!user?.passwordHash || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return { token: await this.createToken(user.id, user.email), email: user.email };
  }

  async getProfile(userId: number): Promise<PublicUser> {
    const snapshot = await this.database.document<UserRecord>('users', userId).get();
    const user = snapshot.data();
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return this.publicUser(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<PublicUser> {
    const reference = this.database.document<UserRecord>('users', userId);
    const snapshot = await reference.get();
    const user = snapshot.data();
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    const updated: UserRecord = {
      ...user,
      name: dto.name,
      bio: dto.bio ?? null,
      location: dto.location ?? null,
      avatarUrl: dto.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      wovenThreads: dto.wovenThreads ?? null,
    };
    await reference.set(updated);
    return this.publicUser(updated);
  }

  async findOrCreateGoogleUser(emailAddress: string, name: string, providerKey: string) {
    const email = emailAddress.trim().toLowerCase();
    const emailRef = this.emailReference(email);
    return this.database.firestore.runTransaction(async (transaction) => {
      const emailSnapshot = await transaction.get(emailRef);
      if (emailSnapshot.exists) {
        const userId = emailSnapshot.data()?.userId;
        if (!userId) {
          throw new Error('Google account email index is invalid.');
        }
        const userRef = this.database.document<UserRecord>('users', userId);
        const userSnapshot = await transaction.get(userRef);
        const user = userSnapshot.data();
        if (!user) {
          throw new Error('Google account email index references a missing user.');
        }
        if (!user.oauthProvider) {
          transaction.update(userRef, { oauthProvider: 'Google', oauthProviderKey: providerKey });
        }
        return { id: user.id, email: user.email };
      }

      const { id, reference: counterRef } = await this.database.readNextId(transaction, 'users');
      const user: UserRecord = {
        id,
        email,
        passwordHash: null,
        oauthProvider: 'Google',
        oauthProviderKey: providerKey,
        name,
        bio: null,
        location: null,
        avatarUrl: null,
        wovenThreads: null,
        isVerified: true,
        joinedDate: new Date(),
      };
      transaction.set(counterRef, { value: id });
      transaction.create(this.database.document('users', id), user);
      transaction.create(emailRef, { userId: id });
      return { id, email };
    });
  }

  async createToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: String(userId),
      email,
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': String(userId),
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': email,
    });
  }

  private publicUser(user: UserRecord): PublicUser {
    const { passwordHash: _passwordHash, oauthProviderKey: _oauthProviderKey, ...safe } = user;
    return safe;
  }

  private emailReference(email: string) {
    const key = createHash('sha256').update(email).digest('hex');
    return this.database.document<EmailIndex>('userEmails', key);
  }
}
