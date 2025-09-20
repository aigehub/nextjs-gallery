-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ZhizunGirl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url_id" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "recommend" BOOLEAN NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "premium" BOOLEAN NOT NULL,
    "code" INTEGER NOT NULL,
    "city_code" INTEGER NOT NULL,
    "district_code" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "certification" BOOLEAN NOT NULL,
    "poster" TEXT NOT NULL,
    "random_index" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "district_name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "media" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "authentication" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "authentications" TEXT NOT NULL
);
INSERT INTO "new_ZhizunGirl" ("address", "agent_id", "authentication", "authentications", "certification", "city_code", "city_name", "code", "district_code", "district_name", "id", "image", "images", "media", "medium", "name", "poster", "premium", "random_index", "recommend", "status", "tag_name", "tags", "url_id", "valid") SELECT "address", "agent_id", "authentication", "authentications", "certification", "city_code", "city_name", "code", "district_code", "district_name", "id", "image", "images", "media", "medium", "name", "poster", "premium", "random_index", "recommend", "status", "tag_name", "tags", "url_id", "valid" FROM "ZhizunGirl";
DROP TABLE "ZhizunGirl";
ALTER TABLE "new_ZhizunGirl" RENAME TO "ZhizunGirl";
CREATE UNIQUE INDEX "ZhizunGirl_url_id_key" ON "ZhizunGirl"("url_id");
CREATE UNIQUE INDEX "ZhizunGirl_code_key" ON "ZhizunGirl"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
