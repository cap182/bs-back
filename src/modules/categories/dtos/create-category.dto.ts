import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsDate,
  IsOptional,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  category_name: string;

  @IsUrl()
  @IsNotEmpty()
  category_url: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  updated_on?: Date;
}
