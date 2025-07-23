import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

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
}