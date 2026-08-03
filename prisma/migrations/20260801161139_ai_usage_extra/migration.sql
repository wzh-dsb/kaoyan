-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "extra" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AiUsage" ("count", "date", "feature", "id", "userId") SELECT "count", "date", "feature", "id", "userId" FROM "AiUsage";
DROP TABLE "AiUsage";
ALTER TABLE "new_AiUsage" RENAME TO "AiUsage";
CREATE UNIQUE INDEX "AiUsage_userId_feature_date_key" ON "AiUsage"("userId", "feature", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
