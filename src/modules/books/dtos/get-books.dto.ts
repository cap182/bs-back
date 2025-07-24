import { IsOptional, IsNumber, IsString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export type PriceFilterType = 'greater_than' | 'less_than' | 'equal';
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

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0) // El precio no debería ser negativo
  price?: number; // El valor del precio para comparar

  @IsOptional()
  @IsString()
  @IsIn(['greater_than', 'less_than', 'equal'])
  price_filter_type?: PriceFilterType;
}