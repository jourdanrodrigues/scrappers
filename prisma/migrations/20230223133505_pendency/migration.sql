-- CreateTable
CREATE TABLE "Pendency" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "requisitionId" INTEGER NOT NULL,

    CONSTRAINT "Pendency_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pendency" ADD CONSTRAINT "Pendency_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
