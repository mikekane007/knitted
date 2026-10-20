import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('my-bookings')
  getMyBookings(@Req() request: AuthenticatedRequest) {
    return this.bookings.getMyBookings(request.user.id);
  }

  @Get('my-passes')
  getMyPasses(@Req() request: AuthenticatedRequest) {
    return this.bookings.getMyPasses(request.user.id);
  }

  @Post()
  createBooking(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.createBooking(request.user.id, dto.eventId);
  }
}
