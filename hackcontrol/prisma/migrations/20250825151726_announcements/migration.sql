-- AlterTable
ALTER TABLE "hackathons" ADD COLUMN     "criteria" STRING;
ALTER TABLE "hackathons" ADD COLUMN     "rules" STRING;

-- CreateTable
CREATE TABLE "announcements" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "content" STRING NOT NULL,
    "important" BOOL NOT NULL DEFAULT false,
    "hackathonId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
