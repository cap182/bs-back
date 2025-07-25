import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Book, Prisma } from '@prisma/client';
import { CreateBookDto } from './dtos/create-book.dto';

@Injectable()
export class BooksRepository {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const { categoryId, ...bookData } = createBookDto;

    return this.prisma.book.create({
      data: {
        ...bookData,
        category: {
          connect: { category_id: categoryId },
        },
      },
    });
  }

  async findAll(
    skip: number,
    take: number,
    where: Prisma.BookWhereInput,
  ): Promise<Book[]> {
    return this.prisma.book.findMany({
      skip: skip,
      take: take,
      where: where,
      orderBy: {
        title: 'asc',
      },
      include: {
        category: {
          select: {
            category_name: true,
          },
        },
      },
    });
  }

  async count(where: Prisma.BookWhereInput): Promise<number> {
    return this.prisma.book.count({
      where: where,
    });
  }

  async findOneById(id: string): Promise<Book | null> {
    return this.prisma.book.findUnique({
      where: { book_id: id },
      include: {
        category: {
          select: {
            category_name: true,
          },
        },
      },
    });
  }

  async findByCategoryName(categoryName: string): Promise<Book[]> {
    return this.prisma.book.findMany({
      where: {
        category: {
          category_name: categoryName,
        },
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, data: Prisma.BookUpdateInput): Promise<Book> {
    return this.prisma.book.update({
      where: { book_id: id },
      data,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string): Promise<Book> {
    return this.prisma.book.delete({
      where: { book_id: id },
    });
  }
}
