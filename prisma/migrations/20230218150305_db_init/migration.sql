-- CreateTable
CREATE TABLE "Requisition" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "registryId" INTEGER NOT NULL,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listener" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "requisitionId" INTEGER NOT NULL,

    CONSTRAINT "Listener_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "Phase" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "requisitionId" INTEGER NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Listener" ADD CONSTRAINT "Listener_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
