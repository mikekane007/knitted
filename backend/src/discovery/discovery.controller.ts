import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GeocodeQueryDto, NearbyQueryDto } from './discovery.dto';
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
}
