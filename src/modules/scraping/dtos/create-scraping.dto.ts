import { IsNumber, IsOptional, IsUUID, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScrapingDto {
  @IsUUID()
  @IsOptional() // categoryId es opcional en la tabla Scraping
  categoryId?: string; // Clave foránea opcional a Category

  @IsNumber()
  @Min(1)
  @IsOptional() // page es opcional
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty() // number_of_books es obligatorio
  @Type(() => Number)
  number_of_books: number;
}