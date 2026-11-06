import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventIdParamDto, EventLookupQueryDto, GeocodeQueryDto, NearbyQueryDto, SaveEventDto } from './discovery.dto';
import { DiscoveryService } from './discovery.service';

/** Events from other platforms near a location. Like Knitted events, these need a signed-in user. */
@Controller('discover')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('nearby')
  nearby(@Query() query: NearbyQueryDto) {
    return this.discovery.nearby(query.lat, query.lng, query.radiusKm ?? 25, query.days ?? 30);
  }

  @Get('geocode')
  geocode(@Query() query: GeocodeQueryDto) {
    return this.discovery.geocode(query.q);
  }

  /** Events the user marked as going or interested, soonest first. */
  @Get('saved')
  listSaved(@Req() request: AuthenticatedRequest) {
    return this.discovery.listSaved(request.user.id);
  }

  @Put('saved/:id')
  save(@Req() request: AuthenticatedRequest, @Param() params: EventIdParamDto, @Body() body: SaveEventDto) {
    return this.discovery.save(request.user.id, params.id, body.status);
  }

  @Delete('saved/:id')
  unsave(@Req() request: AuthenticatedRequest, @Param() params: EventIdParamDto) {
    return this.discovery.unsave(request.user.id, params.id);
  }

  @Get('events/:id')
  getEvent(@Req() request: AuthenticatedRequest, @Param() params: EventIdParamDto, @Query() query: EventLookupQueryDto) {
    const origin = query.lat !== undefined && query.lng !== undefined
      ? { latitude: query.lat, longitude: query.lng }
      : undefined;
    return this.discovery.getEvent(request.user.id, params.id, origin);
  }
}
