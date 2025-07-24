import { Controller, Post, HttpCode, HttpStatus, Logger, Body } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { Category } from '@prisma/client';
import { ScrapeBooksDto } from './dtos/scrape-books.dto'; // Importa el nuevo DTO

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

  // --- NUEVO ENDPOINT PARA SCRAPING DE LIBROS ---
  @Post('books')
  @HttpCode(HttpStatus.OK)
  async scrapeBooksEndpoint(@Body() params: ScrapeBooksDto): Promise<{ message: string; count: number }> {
    this.logger.log(`Received request to scrape books with params: ${JSON.stringify(params)}`);  

    try {
      const result = await this.scrapingService.scrapeBooks(params);
      return result;
    } catch (error) {
      this.logger.error(`Error processing book scraping request: ${error.message}`);
      throw error;
    }
  }
}