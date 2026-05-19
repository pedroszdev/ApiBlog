-- AlterTable
ALTER TABLE "Comments" ADD COLUMN     "parent_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
