-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Operation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
