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
  findAll(@Query('category') categoryName?: string) {
    if (categoryName) {
      return this.booksService.findByCategory(categoryName);
    }
    return this.booksService.findAll();
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
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content para eliminación exitosa
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
