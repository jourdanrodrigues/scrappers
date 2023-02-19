/*
  Warnings:

  - A unique constraint covering the columns `[number,registryId]` on the table `Requisition` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Requisition_number_registryId_key" ON "Requisition"("number", "registryId");
