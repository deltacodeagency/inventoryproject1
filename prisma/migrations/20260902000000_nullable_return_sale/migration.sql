ALTER TABLE "return" DROP CONSTRAINT "return_saleId_fkey";

ALTER TABLE "return" ALTER COLUMN "saleId" DROP NOT NULL;

ALTER TABLE "return"
  ADD CONSTRAINT "return_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "sale"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;