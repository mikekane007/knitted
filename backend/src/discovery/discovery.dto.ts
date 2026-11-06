import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

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
