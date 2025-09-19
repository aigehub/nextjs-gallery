-- CreateTable
CREATE TABLE "ZhizunTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag_id" INTEGER NOT NULL,
    "tag_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ZhizunDistrict" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "district_id" INTEGER NOT NULL,
    "district_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ZhizunGirl" (
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
    "random_index" INTEGER NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "ZhizunTag_tag_id_key" ON "ZhizunTag"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "ZhizunDistrict_district_id_key" ON "ZhizunDistrict"("district_id");

-- CreateIndex
CREATE UNIQUE INDEX "ZhizunGirl_url_id_key" ON "ZhizunGirl"("url_id");

-- CreateIndex
CREATE UNIQUE INDEX "ZhizunGirl_code_key" ON "ZhizunGirl"("code");
