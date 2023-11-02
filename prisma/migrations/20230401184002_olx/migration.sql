-- CreateTable
CREATE TABLE "OlxCarAd" (
    "listId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "date" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "urlId" INTEGER NOT NULL,
    "thumbnailId" INTEGER NOT NULL,

    CONSTRAINT "OlxCarAd_pkey" PRIMARY KEY ("listId")
);

-- CreateTable
CREATE TABLE "OlxUrlBranch" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "parentPathId" INTEGER,

    CONSTRAINT "OlxUrlBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OlxUrlBranch_path_key" ON "OlxUrlBranch"("path");

-- CreateIndex
CREATE UNIQUE INDEX "OlxUrlBranch_parentPathId_key" ON "OlxUrlBranch"("parentPathId");

-- CreateIndex
CREATE UNIQUE INDEX "OlxUrlBranch_path_parentPathId_key" ON "OlxUrlBranch"("path", "parentPathId");

-- AddForeignKey
ALTER TABLE "OlxCarAd" ADD CONSTRAINT "OlxCarAd_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "OlxUrlBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OlxCarAd" ADD CONSTRAINT "OlxCarAd_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "OlxUrlBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OlxUrlBranch" ADD CONSTRAINT "OlxUrlBranch_parentPathId_fkey" FOREIGN KEY ("parentPathId") REFERENCES "OlxUrlBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
