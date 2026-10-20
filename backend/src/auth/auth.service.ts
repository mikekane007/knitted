import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { hashPassword, verifyPassword } from './password-hasher';

interface UserRow {
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

type PublicUser = Omit<UserRow, 'passwordHash' | 'oauthProviderKey'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.database.query(
      'SELECT 1 FROM "Users" WHERE lower("Email") = $1 LIMIT 1',
      [email],
    );
    if (exists.rowCount) {
      throw new BadRequestException('Email is already taken.');
    }

    const passwordHash = await hashPassword(dto.password);
    let result;
    try {
      result = await this.database.query<{ id: number; email: string }>(
        `INSERT INTO "Users" ("Email", "PasswordHash", "Name", "IsVerified", "JoinedDate")
         VALUES ($1, $2, '', false, now())
         RETURNING "Id" AS id, "Email" AS email`,
        [email, passwordHash],
      );
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException('Email is already taken.');
      }
      throw error;
    }
    const user = result.rows[0];
    return { token: await this.createToken(user.id, user.email), email: user.email };
  }

  async login(dto: LoginDto) {
    const result = await this.database.query<{
      id: number;
      email: string;
      passwordHash: string | null;
    }>(
      `SELECT "Id" AS id, "Email" AS email, "PasswordHash" AS "passwordHash"
       FROM "Users" WHERE lower("Email") = $1 LIMIT 1`,
      [dto.email.trim().toLowerCase()],
    );
    const user = result.rows[0];
    if (!user?.passwordHash || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return { token: await this.createToken(user.id, user.email), email: user.email };
  }

  async getProfile(userId: number): Promise<PublicUser> {
    const result = await this.database.query<UserRow>(
      `SELECT "Id" AS id, "Email" AS email, "OAuthProvider" AS "oauthProvider",
              "OAuthProviderKey" AS "oauthProviderKey", "Name" AS name, "Bio" AS bio,
              "Location" AS location, "AvatarUrl" AS "avatarUrl",
              "WovenThreads" AS "wovenThreads", "IsVerified" AS "isVerified",
              "JoinedDate" AS "joinedDate", "PasswordHash" AS "passwordHash"
       FROM "Users" WHERE "Id" = $1`,
      [userId],
    );
    const user = result.rows[0];
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return this.publicUser(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<PublicUser> {
    const result = await this.database.query<UserRow>(
      `UPDATE "Users"
       SET "Name" = $2, "Bio" = $3, "Location" = $4, "AvatarUrl" = $5,
           "WovenThreads" = $6
       WHERE "Id" = $1
       RETURNING "Id" AS id, "Email" AS email, "OAuthProvider" AS "oauthProvider",
                 "OAuthProviderKey" AS "oauthProviderKey", "Name" AS name, "Bio" AS bio,
                 "Location" AS location, "AvatarUrl" AS "avatarUrl",
                 "WovenThreads" AS "wovenThreads", "IsVerified" AS "isVerified",
                 "JoinedDate" AS "joinedDate", "PasswordHash" AS "passwordHash"`,
      [
        userId,
        dto.name,
        dto.bio ?? null,
        dto.location ?? null,
        dto.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        dto.wovenThreads ?? null,
      ],
    );
    const user = result.rows[0];
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return this.publicUser(user);
  }

  async findOrCreateGoogleUser(email: string, name: string, providerKey: string) {
    const existing = await this.database.query<{ id: number; email: string; oauthProvider: string | null }>(
      `SELECT "Id" AS id, "Email" AS email, "OAuthProvider" AS "oauthProvider"
       FROM "Users" WHERE lower("Email") = $1 LIMIT 1`,
      [email.toLowerCase()],
    );
    if (existing.rows[0]) {
      const user = existing.rows[0];
      if (!user.oauthProvider) {
        await this.database.query(
          `UPDATE "Users" SET "OAuthProvider" = 'Google', "OAuthProviderKey" = $2
           WHERE "Id" = $1`,
          [user.id, providerKey],
        );
      }
      return { id: user.id, email: user.email };
    }

    try {
      const created = await this.database.query<{ id: number; email: string }>(
        `INSERT INTO "Users"
           ("Email", "OAuthProvider", "OAuthProviderKey", "Name", "IsVerified", "JoinedDate")
         VALUES ($1, 'Google', $2, $3, false, now())
         RETURNING "Id" AS id, "Email" AS email`,
        [email.toLowerCase(), providerKey, name],
      );
      return created.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code !== '23505') {
        throw error;
      }
      const raced = await this.database.query<{ id: number; email: string }>(
        `SELECT "Id" AS id, "Email" AS email FROM "Users" WHERE lower("Email") = $1`,
        [email.toLowerCase()],
      );
      if (!raced.rows[0]) {
        throw error;
      }
      return raced.rows[0];
    }
  }

  async createToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: String(userId),
      email,
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': String(userId),
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': email,
    });
  }

  private publicUser(user: UserRow): PublicUser {
    const { passwordHash: _passwordHash, oauthProviderKey: _oauthProviderKey, ...safe } = user;
    return safe;
  }
}
