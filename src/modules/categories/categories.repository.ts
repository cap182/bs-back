import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Category } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async findOneById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { category_id: id } });
  }

  async findOneByName(name: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { category_name: name } });
  }

  async update(
    id: string,
    data: Prisma.CategoryUpdateInput,
  ): Promise<Category> {
    return this.prisma.category.update({
      where: { category_id: id },
      data,
    });
  }

  async remove(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { category_id: id } });
  }
}