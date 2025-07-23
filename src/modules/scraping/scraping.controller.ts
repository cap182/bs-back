import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { Category } from '@prisma/client';

@Controller('scraping')
export class ScrapingController {
  private readonly logger = new Logger(ScrapingController.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('categories')
  @HttpCode(HttpStatus.OK)
  async scrapeCategoriesEndpoint(): Promise<{ message: string; createdCategories: Category[] }> {
    this.logger.log('Received request to scrape categories.');
    try {
      const createdCategories = await this.scrapingService.scrapeCategories();
      return {
        message: `Category scraping completed successfully. ${createdCategories.length} categories processed.`,
        createdCategories: createdCategories,
      };
    } catch (error) {
      this.logger.error(`Error processing category scraping request: ${error.message}`);
      throw error;
    }
  }
}