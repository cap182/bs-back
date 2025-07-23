import { Injectable, NotFoundException } from '@nestjs/common';
import { BooksRepository } from './books.repository';
import { Book } from '@prisma/client';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private booksRepository: BooksRepository) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    return this.booksRepository.create(createBookDto);
  }

  async findAll(): Promise<Book[]> {
    return this.booksRepository.findAll();
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepository.findOneById(id);
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found.`);
    }
    return book;
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