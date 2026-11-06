import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([5, 10, 25, 50, 100])
  radiusKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 3, 7, 30, 90])
  days?: number;
}

export class GeocodeQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  q!: string;
}

/** Prefixed external event id, e.g. `openagenda:68608065` or `ticketmaster:G5vYZ9vJ1a1Ab`. */
export class EventIdParamDto {
  @IsString()
  @Matches(/^(openagenda|ticketmaster):[A-Za-z0-9_-]{1,64}$/, { message: 'Unknown event id.' })
  id!: string;
}

export class EventLookupQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

export class SaveEventDto {
  @IsIn(['going', 'interested'])
  status!: 'going' | 'interested';
}
