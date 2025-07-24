import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetBooksDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1; // Página por defecto: 1

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 30; // Límite por defecto: 30 libros por página

  @IsOptional()
  @IsString()
  category_id?: string; // Filtro opcional por category_id

  @IsOptional()
  @IsString()
  title?: string; // Filtro opcional por título (para búsqueda parcial)
}