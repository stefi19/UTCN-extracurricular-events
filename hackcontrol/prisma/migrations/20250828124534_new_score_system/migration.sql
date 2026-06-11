-- AlterTable
ALTER TABLE "hackathons" ADD COLUMN     "min_judges_required" INT4 NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "scores" (
    "id" STRING NOT NULL,
    "judgeId" STRING NOT NULL,
    "participationId" STRING NOT NULL,
    "score" INT4 NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scores_judgeId_participationId_key" ON "scores"("judgeId", "participationId");

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "judges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
