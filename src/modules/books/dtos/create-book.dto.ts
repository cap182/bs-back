import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsUrl,
  IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  book_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsUrl()
  @IsNotEmpty()
  img: string;

  @IsBoolean()
  @Type(() => Boolean)
  stock: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock_quantity?: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
