-- CreateTable
CREATE TABLE "books" (
    "book_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "rating" INTEGER NOT NULL,
    "img" TEXT NOT NULL,
    "stock" BOOLEAN NOT NULL,
    "stock_quantity" INTEGER,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("book_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "category_url" TEXT NOT NULL,
    "updated_on" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "scrapings" (
    "scraping_id" SERIAL NOT NULL,
    "category_id" TEXT,
    "page" INTEGER,
    "number_of_books" INTEGER NOT NULL,

    CONSTRAINT "scrapings_pkey" PRIMARY KEY ("scraping_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_name_key" ON "categories"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_url_key" ON "categories"("category_url");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
