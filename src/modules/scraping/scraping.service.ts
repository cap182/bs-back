import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CategoriesService } from '../categories/categories.service';
import { CreateCategoryDto } from '../categories/dtos/create-category.dto';
import { Category } from '@prisma/client'; // Importa el tipo Category de Prisma

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly BASE_URL = 'https://books.toscrape.com/catalogue/category/books_1/';
  private readonly CATEGORIES_PAGE_URL = `${this.BASE_URL}index.html`;

  constructor(private readonly categoriesService: CategoriesService) {}

  async scrapeCategories(): Promise<Category[]> {
    this.logger.log(`Starting category scraping from: ${this.CATEGORIES_PAGE_URL}`);
    const scrapedCategories: CreateCategoryDto[] = [];

    try {
      const response = await axios.get(this.CATEGORIES_PAGE_URL);
      const $ = cheerio.load(response.data);

      const sideCategories = $('.side_categories');
      const categoryListItems = sideCategories.find('ul.nav-list > li > ul > li');

      categoryListItems.each((index, element) => {
        const anchor = $(element).find('a');
        const relativeUrl = anchor.attr('href');
        const categoryName = anchor.text().trim();

        if (relativeUrl && categoryName) {
          const fullUrl = new URL(relativeUrl, this.BASE_URL).href;

          const urlParts = fullUrl.split('/');         
          const categoryIdWithHtml = urlParts[urlParts.length - 2];
          let categoryId = '';

          if (categoryIdWithHtml) {
            const idMatch = categoryIdWithHtml.match(/^(.*)_(\d+)$/);
            if (idMatch && idMatch[1] && idMatch[2]) {
                categoryId = `${idMatch[1]}_${idMatch[2]}`;
            } else {                
                categoryId = categoryIdWithHtml;
                this.logger.warn(`Could not parse category ID from URL part: "${categoryIdWithHtml}". Using it as is.`);
            }
          }
          
          const formattedCategoryName = categoryName.toLowerCase();

          scrapedCategories.push({
            category_id: categoryId,
            category_name: formattedCategoryName,
            category_url: fullUrl,
          });
        }
      });

      this.logger.log(`Found ${scrapedCategories.length} categories.`);
      
      const createdCategories: Category[] = [];
      for (const categoryDto of scrapedCategories) {
        try {
          const existingCategory = await this.categoriesService.findOne(categoryDto.category_id);
          if (existingCategory) {
              this.logger.warn(`Category "${categoryDto.category_name}" (${categoryDto.category_id}) already exists. Skipping creation.`);
              createdCategories.push(existingCategory);
              continue;
          }
          
          const createdCategory = await this.categoriesService.create(categoryDto);
          createdCategories.push(createdCategory);
          this.logger.log(`Category "${categoryDto.category_name}" (${categoryDto.category_id}) created.`);
        } catch (error) {
            this.logger.error(`Failed to create category ${categoryDto.category_name}: ${error.message}`);
        }
      }

      this.logger.log('Category scraping finished.');
      return createdCategories;
    } catch (error) {
      this.logger.error(`Error during category scraping: ${error.message}`);
      throw error;
    }
  }
}