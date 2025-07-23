import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { CategoriesModule } from '../categories/categories.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [CategoriesModule, PrismaModule],
  controllers: [ScrapingController],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
