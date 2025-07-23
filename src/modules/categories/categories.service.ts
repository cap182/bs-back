import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from './dtos/create-category.dto'; 
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesRepository.create(createCategoryDto);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.findAll();
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOneById(id);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.categoriesRepository.update(id, updateCategoryDto);
  }

  async remove(id: string): Promise<Category> {
    return this.categoriesRepository.remove(id);
  }
}