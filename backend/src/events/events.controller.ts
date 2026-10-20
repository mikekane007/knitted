import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateEventDto,
  EventSearchQueryDto,
  PostChatMessageDto,
} from './dto/event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  getEvents(@Query() filters: EventSearchQueryDto) {
    return this.events.getEvents(filters);
  }

  @Get('categories-summary')
  getCategoriesSummary() {
    return this.events.getCategoriesSummary();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createEvent(@Req() request: AuthenticatedRequest, @Body() dto: CreateEventDto) {
    return this.events.createEvent(request.user.id, dto);
  }

  @Get(':id/attendees')
  getAttendees(@Param('id', ParseIntPipe) id: number) {
    return this.events.getAttendees(id);
  }

  @Get(':id/chat')
  getChatMessages(@Param('id', ParseIntPipe) id: number) {
    return this.events.getChatMessages(id);
  }

  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  postChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: PostChatMessageDto,
  ) {
    return this.events.postChatMessage(id, request.user.id, dto);
  }

  @Post('scan-external')
  scanExternalEvents() {
    return this.events.scanExternalEvents();
  }

  @Post('seed')
  seedEvents() {
    return this.events.seedEvents();
  }

  @Get(':id')
  getEvent(@Param('id', ParseIntPipe) id: number) {
    return this.events.getEvent(id);
  }
}
