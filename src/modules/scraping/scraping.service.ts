import { Injectable, Logger, BadRequestException, NotFoundException, HttpStatus, HttpException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../prisma/prisma.service'; // Para el ScrapingLog
import { CategoriesService } from '../categories/categories.service';
import { BooksService } from '../books/books.service'; // Para guardar libros
import { CreateBookDto } from '../books/dtos/create-book.dto'; // DTO para crear libros
import { Category, Book, Scraping } from '@prisma/client'; // Importar tipos de Prisma
import { ScrapeBooksDto } from './dtos/scrape-books.dto';
import { ScrapingRepository } from './scraping.repository';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly BASE_URL = 'https://books.toscrape.com';
  private readonly CATEGORY_BASE_PATH = '/catalogue/category/books/';
  private readonly GENERIC_CATALOG_PATH = '/catalogue/';

  private readonly RATING_MAP = {
    'One': 1,
    'Two': 2,
    'Three': 3,
    'Four': 4,
    'Five': 5,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly booksService: BooksService,
    private readonly scrapingRepository: ScrapingRepository
  ) {}

  async scrapeCategories(): Promise<Category[]> {
    this.logger.log(`Starting category scraping from: ${this.BASE_URL}${this.GENERIC_CATALOG_PATH}category/books_1/index.html`);
    const scrapedCategories: CreateBookDto[] = [];

    try {
      const response = await axios.get(`${this.BASE_URL}${this.GENERIC_CATALOG_PATH}category/books_1/index.html`);
      const $ = cheerio.load(response.data);

      const sideCategories = $('.side_categories');
      const categoryListItems = sideCategories.find('ul.nav-list > li > ul > li');

      categoryListItems.each((index, element) => {
        const anchor = $(element).find('a');
        const relativeUrl = anchor.attr('href');
        const categoryName = anchor.text().trim();

        if (relativeUrl && categoryName) {
          const fullUrl = new URL(relativeUrl, this.BASE_URL + this.GENERIC_CATALOG_PATH + 'category/books_1/').href;

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
            book_id: categoryId,
            title: formattedCategoryName,
            price: 0, rating: 0, img: '', stock: false, categoryId: categoryId,      
          });
        }
      });

      this.logger.log(`Found ${scrapedCategories.length} categories.`);

      const createdCategoryResults: Category[] = [];
      for (const categoryDtoLike of scrapedCategories) {        
        const categoryData = {
          category_id: categoryDtoLike.book_id,
          category_name: categoryDtoLike.title,
          category_url: categoryDtoLike.img || `${this.BASE_URL}${this.CATEGORY_BASE_PATH}${categoryDtoLike.book_id}/index.html`, // Url base de la categoria
        };

        try {
          const existingCategory = await this.categoriesService.findOne(categoryData.category_id);
          if (existingCategory) {
              this.logger.warn(`Category "${categoryData.category_name}" (${categoryData.category_id}) already exists. Skipping creation.`);
              createdCategoryResults.push(existingCategory);
              continue;
          }

          const createdCategory = await this.categoriesService.create(categoryData);
          createdCategoryResults.push(createdCategory);
          this.logger.log(`Category "${categoryData.category_name}" (${categoryData.category_id}) created.`);
        } catch (error) {
            this.logger.error(`Failed to create category ${categoryData.category_name}: ${error.message}`);
        }
      }

      this.logger.log('Category scraping finished.');
      return createdCategoryResults;
    } catch (error) {
      this.logger.error(`Error during category scraping: ${error.message}`);
      throw error;
    }
  }

  async getScrapingLogs(): Promise<Scraping[]> {
    this.logger.log('Fetching all scraping logs.');
    const logs = await this.scrapingRepository.findAll();
    return logs;
  }



  async scrapeBooks(params: ScrapeBooksDto): Promise<{ message: string; count: number }> {
    const { page, category } = params;
    let booksProcessedCount = 0;
    let scrapingLogEntry: Scraping | null = null;
    let targetCategory: Category | null = null;

    if ((page && category)) {
      throw new BadRequestException('Provide either "page" or "category" parameter, or neither for automatic page scraping.');
    }

    try {
      if (page) {
        // CASO 1: Scraping de una página específica
        this.logger.log(`Starting book scraping for page: ${page}`);
        booksProcessedCount = await this.scrapeBooksFromPage(page);
        scrapingLogEntry = await this.prisma.scraping.create({
          data: {
            number_of_books: booksProcessedCount,
            page: page,
          },
        });
      } else if (category) {
        // CASO 3: Scraping de una categoría específica con paginación
        this.logger.log(`Starting book scraping for category: ${category}`);
        targetCategory = await this.categoriesService.findOne(category);
        if (!targetCategory) {
          throw new NotFoundException(`Category with ID "${category}" not found in database.`);
        }
        booksProcessedCount = await this.scrapeBooksFromCategory(targetCategory);
        scrapingLogEntry = await this.prisma.scraping.create({
          data: {
            number_of_books: booksProcessedCount,
            category_id: targetCategory.category_id,
          },
        });
        await this.categoriesService.update(targetCategory.category_id, { updated_on: new Date() });
        this.logger.log(`Updated 'updated_on' for category "${targetCategory.category_name}".`);
      } else {
        // CASO 2: Scraping de la siguiente página automática
        this.logger.log('Starting automatic book scraping for next available page.');
        const nextPageToScrape = await this.findNextPageToScrape();
        this.logger.log(`Next page to scrape: ${nextPageToScrape}`);
        booksProcessedCount = await this.scrapeBooksFromPage(nextPageToScrape);
        scrapingLogEntry = await this.prisma.scraping.create({
          data: {
            number_of_books: booksProcessedCount,
            page: nextPageToScrape,
          },
        });
      }

      const message = `Book scraping completed successfully. ${booksProcessedCount} books processed.`;
      this.logger.log(message);
      return { message, count: booksProcessedCount };

    } catch (error) {
      this.logger.error(`Error during book scraping: ${error.message}`);
      throw error;
    }
  }

  private async scrapeBooksFromPage(pageNumber: number): Promise<number> {
    const url = `${this.BASE_URL}${this.GENERIC_CATALOG_PATH}page-${pageNumber}.html`;
    this.logger.log(`Fetching books from: ${url}`);
    let booksAdded = 0;

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const bookArticles = $('article.product_pod');

      if (bookArticles.length === 0) {
        this.logger.warn(`No books found on page ${pageNumber}. It might be the last page.`);
        return 0;
      }

      for (const element of bookArticles.toArray()) {
        const bookUrlRelative = $(element).find('.image_container a').attr('href');
        if (!bookUrlRelative) {
          this.logger.warn('Skipping book: missing relative URL.');
          continue;
        }

        const bookFullUrl = new URL(bookUrlRelative, `${this.BASE_URL}${this.GENERIC_CATALOG_PATH}`).href;
        const bookId = bookFullUrl.split('/').slice(-2, -1)[0]; // Extract 'a-light-in-the-attic_1000'

        const existingBook = await this.booksService.findOne(bookId);
        if (existingBook) {
          this.logger.log(`Book "${bookId}" already exists. Skipping.`);
          continue;
        }

        const title = $(element).find('h3 a').attr('title')?.toLowerCase().trim() || 'No Title';
        const priceText = $(element).find('.product_price .price_color').text().replace('£', '');
        const price = parseFloat(priceText);

        const ratingClass = $(element).find('.star-rating').attr('class')?.split(' ').pop();
        const rating = this.RATING_MAP[ratingClass as keyof typeof this.RATING_MAP] || 0;

        const stockText = $(element).find('.instock.availability').text().trim();
        const stock = stockText.includes('In stock');
        let stockQuantity: number | null = null;
        const quantityMatch = stockText.match(/\((\d+) available\)/);
        if (quantityMatch && quantityMatch[1]) {
          stockQuantity = parseInt(quantityMatch[1], 10);
        }

        const categoryId = await this.getCategoryFromBookDetailPage(bookFullUrl);
        if (!categoryId) {
          this.logger.error(`Could not determine category for book "${title}" (${bookId}). Skipping.`);
          continue;
        }

        
        let categoryInDb = await this.categoriesService.findOne(categoryId);
        if (!categoryInDb) {
            this.logger.warn(`Category "${categoryId}" not found in DB for book "${title}". Consider running category scraping first.`);
            continue;
        }


        const createBookDto: CreateBookDto = {
          book_id: bookId,
          title: title,
          price: price,
          rating: rating,
          img: new URL($(element).find('.image_container img').attr('src') || '', this.BASE_URL + this.GENERIC_CATALOG_PATH).href,
          stock: stock,
          stock_quantity: stockQuantity,
          categoryId: categoryId,
        };

        try {
          await this.booksService.create(createBookDto);
          booksAdded++;
          this.logger.log(`Added book: "${title}" (${bookId}) from page ${pageNumber}.`);
        } catch (dbError) {
          this.logger.error(`Failed to save book "${title}" (${bookId}): ${dbError.message}`);
        }
      }
      return booksAdded;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status === HttpStatus.NOT_FOUND) {
        this.logger.warn(`Page ${pageNumber} not found (404). Assuming it's beyond the last existing page.`);
        
        return 0;
        
      } else {
        this.logger.error(`Error scraping page ${pageNumber}: ${error.message}`);
        throw error;
      }
    }
  }

  // --- Lógica Auxiliar para Scrapear una Categoría Específica (CASO 3) ---
  private async scrapeBooksFromCategory(category: Category): Promise<number> {
    let currentPageUrl = `${this.BASE_URL}${this.CATEGORY_BASE_PATH}${category.category_id}/index.html`;
    let booksAdded = 0;
    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
      this.logger.log(`Fetching books from category "${category.category_name}" page: ${currentPageUrl}`);
      try {
        const response = await axios.get(currentPageUrl);
        const $ = cheerio.load(response.data);

        const bookArticles = $('article.product_pod');

        if (bookArticles.length === 0 && pageNum === 1) {
            this.logger.warn(`No books found on first page for category "${category.category_name}".`);
            break;
        }

        for (const element of bookArticles.toArray()) {
          const bookUrlRelative = $(element).find('.image_container a').attr('href');
          if (!bookUrlRelative) {
            this.logger.warn('Skipping book: missing relative URL.');
            continue;
          }

          const bookFullUrl = new URL(bookUrlRelative, `${this.BASE_URL}${this.CATEGORY_BASE_PATH}${category.category_id}/`).href;
          const bookId = bookFullUrl.split('/').slice(-2, -1)[0];

          const existingBook = await this.booksService.findOne(bookId);
          if (existingBook) {
            this.logger.log(`Book "${bookId}" already exists. Skipping.`);
            continue;
          }

          const title = $(element).find('h3 a').attr('title')?.toLowerCase().trim() || 'No Title';
          const priceText = $(element).find('.product_price .price_color').text().replace('£', '');
          const price = parseFloat(priceText);

          const ratingClass = $(element).find('.star-rating').attr('class')?.split(' ').pop();
          const rating = this.RATING_MAP[ratingClass as keyof typeof this.RATING_MAP] || 0;

          const stockText = $(element).find('.instock.availability').text().trim();
          const stock = stockText.includes('In stock');
          let stockQuantity: number | null = null;
          const quantityMatch = stockText.match(/\((\d+) available\)/);
          if (quantityMatch && quantityMatch[1]) {
            stockQuantity = parseInt(quantityMatch[1], 10);
          }
          
          const createBookDto: CreateBookDto = {
            book_id: bookId,
            title: title,
            price: price,
            rating: rating,
            img: new URL($(element).find('.image_container img').attr('src') || '', this.BASE_URL + this.GENERIC_CATALOG_PATH).href,
            stock: stock,
            stock_quantity: stockQuantity,
            categoryId: category.category_id,
          };

          try {
            await this.booksService.create(createBookDto);
            booksAdded++;
            this.logger.log(`Added book: "${title}" (${bookId}) from category "${category.category_name}".`);
          } catch (dbError) {
            this.logger.error(`Failed to save book "${title}" (${bookId}): ${dbError.message}`);
          }
        }

        // Buscar el botón "next" para la paginación
        const nextButton = $('li.next a');
        if (nextButton.length > 0) {
          const nextRelativeUrl = nextButton.attr('href');
          if (nextRelativeUrl) {            
            currentPageUrl = new URL(nextRelativeUrl, currentPageUrl).href;
            pageNum++;
          } else {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }

      } catch (error) {
        this.logger.error(`Error scraping category "${category.category_name}" page ${currentPageUrl}: ${error.message}`);
        hasNextPage = false;
      }
    }
    return booksAdded;
  }

  // --- Lógica para obtener la categoría desde la página de detalle del libro (CASO 1 y 2) ---
  private async getCategoryFromBookDetailPage(bookDetailUrl: string): Promise<string | null> {
    try {
      this.logger.debug(`Fetching category from book detail page: ${bookDetailUrl}`);
      const response = await axios.get(bookDetailUrl);
      const $ = cheerio.load(response.data);

      const categoryAnchor = $('ul.breadcrumb li:nth-child(3) a');
      const relativeCategoryUrl = categoryAnchor.attr('href');

      if (relativeCategoryUrl) {
        const fullCategoryUrl = new URL(relativeCategoryUrl, this.BASE_URL + this.GENERIC_CATALOG_PATH + 'books_1/').href;
        const urlParts = fullCategoryUrl.split('/');
        const categoryIdWithHtml = urlParts[urlParts.length - 2];
        
        if (categoryIdWithHtml) {
          const idMatch = categoryIdWithHtml.match(/^(.*)_(\d+)$/);
          if (idMatch && idMatch[1] && idMatch[2]) {
              return `${idMatch[1]}_${idMatch[2]}`;
          } else {
              this.logger.warn(`Could not parse category ID from detail page URL part: "${categoryIdWithHtml}".`);
              return categoryIdWithHtml; 
          }
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`Error fetching category from book detail page ${bookDetailUrl}: ${error.message}`);
      return null;
    }
  }

  // --- Lógica para encontrar la siguiente página a scrapear (CASO 2) ---
  private async findNextPageToScrape(): Promise<number> {
    const lastScrapedPageLog = await this.prisma.scraping.findFirst({
      where: {
        page: { not: null }, 
        category_id: null,
      },
      orderBy: {
        page: 'desc',
      },
      select: {
        page: true,
      },
    });

    if (lastScrapedPageLog && lastScrapedPageLog.page !== null) {
      const nextPage = lastScrapedPageLog.page + 1;
      const testUrl = `${this.BASE_URL}${this.GENERIC_CATALOG_PATH}page-${nextPage}.html`;
      try {
        const response = await axios.get(testUrl);
        const $ = cheerio.load(response.data);
        const bookArticles = $('article.product_pod');
        if (bookArticles.length > 0) {
          return nextPage;
        } else {
          return await this.findFirstUnscrapedPageFromStart();
        }
      } catch (error) {
        this.logger.warn(`Page ${nextPage} resulted in error or no content: ${error.message}. Searching for first unscraped page.`);
        return await this.findFirstUnscrapedPageFromStart();
      }
    } else {
      return 1;
    }
  }

  private async findFirstUnscrapedPageFromStart(): Promise<number> {
    let currentPage = 1;
    while (true) {
      const pageScraped = await this.prisma.scraping.findFirst({
        where: {
          page: currentPage,
          category_id: null,
        },
      });

      if (!pageScraped) {
        const testUrl = `${this.BASE_URL}${this.GENERIC_CATALOG_PATH}page-${currentPage}.html`;
        try {
          const response = await axios.get(testUrl);
          const $ = cheerio.load(response.data);
          const bookArticles = $('article.product_pod');
          if (bookArticles.length > 0) {
            return currentPage;
          } else {
            this.logger.log(`Page ${currentPage} has no books. Assuming end of general catalog pages.`);
            return currentPage; 
          }
        } catch (error) {
          this.logger.log(`Page ${currentPage} does not exist or failed to load. Assuming end of general catalog pages.`);
          return currentPage;
        }
      }
      currentPage++;
    }
  }
}