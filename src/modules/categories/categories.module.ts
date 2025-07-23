import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Importa PrismaModule
import { CategoriesRepository } from './categories.repository'; // Importa el repositorio

@Module({
  imports: [PrismaModule], // Agrega PrismaModule
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}