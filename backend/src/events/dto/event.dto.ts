import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @MaxLength(256)
  title!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @MaxLength(64)
  startTime!: string;

  @IsString()
  @MaxLength(64)
  endTime!: string;

  @IsString()
  @MaxLength(512)
  location!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsString()
  @MaxLength(128)
  category!: string;

  @IsString()
  @MaxLength(1000)
  tags!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImage?: string;

  @IsInt()
  @Min(1)
  @Max(100_000)
  totalCapacity!: number;
}

export class PostChatMessageDto {
  @IsString()
  @MaxLength(1000)
  message!: string;
}

export class EventSearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  price?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  sortBy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
