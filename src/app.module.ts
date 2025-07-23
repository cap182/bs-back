import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BooksModule } from './modules/books/books.module';
import { ScrapingModule } from './modules/scraping/scraping.module';

@Module({
  imports: [PrismaModule, CategoriesModule, BooksModule, ScrapingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
