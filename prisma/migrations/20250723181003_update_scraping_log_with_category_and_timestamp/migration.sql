-- AlterTable
ALTER TABLE "scrapings" ADD COLUMN     "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "scrapings" ADD CONSTRAINT "scrapings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;
