import { Injectable, NotFoundException } from '@nestjs/common';
import { BooksRepository } from './books.repository';
import { Book, Prisma } from '@prisma/client';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { GetBooksDto } from './dtos/get-books.dto';

@Injectable()
export class BooksService {
  constructor(private booksRepository: BooksRepository) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const existingBook = await this.booksRepository.findOneById(
      createBookDto.book_id,
    );
    if (existingBook) {
      return existingBook;
    }
    return this.booksRepository.create(createBookDto);
  }
  async findAll(query: GetBooksDto): Promise<{ data: Book[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 30;
    const skip = (page - 1) * limit;

    // Construir el objeto de filtros para Prisma
    const filters: Prisma.BookWhereInput = {};

    if (query.category_id) {
      filters.categoryId = query.category_id;
    }

    if (query.title) {
      filters.title = {
        contains: query.title, // Búsqueda parcial (case-sensitive por defecto en algunos DBs)
        mode: 'insensitive', // Para búsqueda insensible a mayúsculas/minúsculas (requiere PostgreSQL)
      };
    }

    // Obtener el total de libros que coinciden con los filtros (sin paginación)
    const total = await this.booksRepository.count(filters);

    // Obtener los libros paginados con filtros
    const data = await this.booksRepository.findAll(skip, limit, filters);

    return { data, total };
  }

  async findOne(bookId: string): Promise<Book | null> {
    return this.booksRepository.findOneById(bookId);
  }

  async findByCategory(categoryName: string): Promise<Book[]> {
    return this.booksRepository.findByCategoryName(categoryName);
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    const existingBook = await this.booksRepository.findOneById(id);
    if (!existingBook) {
      throw new NotFoundException(`Book with ID "${id}" not found.`);
    }
    return this.booksRepository.update(id, updateBookDto);
  }

  async remove(id: string): Promise<Book> {
    const existingBook = await this.booksRepository.findOneById(id);
    if (!existingBook) {
      throw new NotFoundException(`Book with ID "${id}" not found.`);
    }
    return this.booksRepository.remove(id);
  }
}
