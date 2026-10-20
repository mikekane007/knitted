import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';
import { DatabaseService } from './database/database.service';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { HealthController } from './health.controller';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        issuer: process.env.JWT_ISSUER ?? 'KnittedApi',
        audience: process.env.JWT_AUDIENCE ?? 'KnittedClient',
        expiresIn: Number(process.env.JWT_EXPIRY_MINUTES ?? 60) * 60,
      },
      verifyOptions: {
        issuer: process.env.JWT_ISSUER ?? 'KnittedApi',
        audience: process.env.JWT_AUDIENCE ?? 'KnittedClient',
      },
    }),
  ],
  controllers: [AuthController, BookingsController, EventsController, HealthController],
  providers: [DatabaseService, AuthService, BookingsService, EventsService, JwtAuthGuard],
})
export class AppModule {}
