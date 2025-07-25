// src/modules/scraping/scraping.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Scraping } from '@prisma/client';

@Injectable()
export class ScrapingRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ScrapingCreateInput): Promise<Scraping> {
    return this.prisma.scraping.create({ data });
  }

  async findAll(): Promise<Scraping[]> {
    return this.prisma.scraping.findMany({
      orderBy: {
        scraped_at: 'desc',
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
}