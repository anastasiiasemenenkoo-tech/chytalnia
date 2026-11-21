-- CreateTable
CREATE TABLE "YearShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YearShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YearShare_token_key" ON "YearShare"("token");

-- CreateIndex
CREATE UNIQUE INDEX "YearShare_userId_year_key" ON "YearShare"("userId", "year");

-- AddForeignKey
ALTER TABLE "YearShare" ADD CONSTRAINT "YearShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
