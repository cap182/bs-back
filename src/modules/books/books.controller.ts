import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { GetBooksDto } from './dtos/get-books.dto';
import { Book } from '@prisma/client';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // POST /books: Crear un nuevo libro (útil para el proceso de scraping)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  // GET /books: Listado completo de libros
  // GET /books?category=category_name: Filtrado por categoría
  @Get()
  async findAll(
    @Query() query: GetBooksDto,
  ): Promise<{ data: Book[]; total: number; page: number; limit: number }> {
    const { data, total } = await this.booksService.findAll(query);
    return {
      data,
      total,
      page: query.page || 1,
      limit: query.limit || 30,
    };
  }

  // GET /books/:id: Detalle de un libro específico
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  // PATCH /books/:id: Actualizar un libro (opcional, pero útil)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  // DELETE /books/:id: Eliminar libro
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
