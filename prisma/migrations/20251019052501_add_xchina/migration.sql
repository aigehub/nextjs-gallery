-- CreateTable
CREATE TABLE "XChinaSigou" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "subs" TEXT NOT NULL,
    "girl_name" TEXT NOT NULL,
    "image_base_url" TEXT NOT NULL DEFAULT 'https://img.xchina.io/photos2/',
    "album_id" TEXT NOT NULL,
    "image_count" INTEGER NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Girl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "girl_id" INTEGER NOT NULL,
    "code_ref" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "bust" TEXT NOT NULL,
    "rank_bust" TEXT,
    "skill" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "province" TEXT NOT NULL,
    "p_number" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "c_number" INTEGER NOT NULL,
    "p_jd" TEXT NOT NULL,
    "p_wd" TEXT NOT NULL,
    "c_jd" TEXT NOT NULL,
    "c_wd" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "vx" TEXT NOT NULL,
    "qq" TEXT NOT NULL,
    "xl" TEXT NOT NULL,
    "yn" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "state_ref" INTEGER NOT NULL,
    "photo1" TEXT NOT NULL,
    "photo2" TEXT NOT NULL,
    "photo3" TEXT NOT NULL,
    "photo4" TEXT NOT NULL,
    "photo5" TEXT NOT NULL,
    "photo6" TEXT NOT NULL,
    "video1" TEXT NOT NULL,
    "video2" TEXT NOT NULL,
    "video" TEXT NOT NULL,
    "api_url" TEXT NOT NULL,
    "web_url" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_Girl" ("address", "age", "api_url", "bust", "c_jd", "c_number", "c_wd", "city", "code_ref", "create_time", "create_timestamps", "girl_id", "height", "id", "name", "p_jd", "p_number", "p_wd", "phone", "photo", "photo1", "photo2", "photo3", "photo4", "photo5", "photo6", "price", "province", "qq", "rank_bust", "remarks", "skill", "state_ref", "video", "video1", "video2", "vx", "web_url", "weight", "xl", "yn") SELECT "address", "age", "api_url", "bust", "c_jd", "c_number", "c_wd", "city", "code_ref", "create_time", "create_timestamps", "girl_id", "height", "id", "name", "p_jd", "p_number", "p_wd", "phone", "photo", "photo1", "photo2", "photo3", "photo4", "photo5", "photo6", "price", "province", "qq", "rank_bust", "remarks", "skill", "state_ref", "video", "video1", "video2", "vx", "web_url", "weight", "xl", "yn" FROM "Girl";
DROP TABLE "Girl";
ALTER TABLE "new_Girl" RENAME TO "Girl";
CREATE UNIQUE INDEX "Girl_girl_id_key" ON "Girl"("girl_id");
CREATE TABLE "new_Girl58Kv" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titlename" TEXT NOT NULL,
    "content" TEXT,
    "price" INTEGER,
    "wechat" TEXT,
    "uuutalk" TEXT,
    "qqnum" TEXT,
    "telegram" TEXT,
    "shadow" TEXT,
    "mobile" TEXT,
    "provinceCity" TEXT,
    "region" TEXT,
    "address" TEXT,
    "accuracy" TEXT,
    "dimension" TEXT,
    "position" TEXT,
    "ladyid" TEXT NOT NULL,
    "distance" TEXT,
    "isbn" INTEGER,
    "ladytype" INTEGER,
    "isExamine" INTEGER,
    "isStart" INTEGER,
    "isAuth" INTEGER,
    "topup" INTEGER,
    "isBlackList" BOOLEAN,
    "createTime" TEXT,
    "cover" TEXT,
    "data" TEXT,
    "video" TEXT,
    "characteristics" TEXT,
    "role" INTEGER,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_Girl58Kv" ("accuracy", "address", "characteristics", "content", "cover", "createTime", "create_time", "create_timestamps", "data", "dimension", "distance", "id", "isAuth", "isBlackList", "isExamine", "isStart", "isbn", "ladyid", "ladytype", "mobile", "position", "price", "provinceCity", "qqnum", "region", "role", "shadow", "telegram", "titlename", "topup", "uuutalk", "video", "wechat") SELECT "accuracy", "address", "characteristics", "content", "cover", "createTime", "create_time", "create_timestamps", "data", "dimension", "distance", "id", "isAuth", "isBlackList", "isExamine", "isStart", "isbn", "ladyid", "ladytype", "mobile", "position", "price", "provinceCity", "qqnum", "region", "role", "shadow", "telegram", "titlename", "topup", "uuutalk", "video", "wechat" FROM "Girl58Kv";
DROP TABLE "Girl58Kv";
ALTER TABLE "new_Girl58Kv" RENAME TO "Girl58Kv";
CREATE UNIQUE INDEX "Girl58Kv_ladyid_key" ON "Girl58Kv"("ladyid");
CREATE TABLE "new_GirlModelInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "girl_name" TEXT NOT NULL,
    "girl_desc" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_GirlModelInfo" ("create_time", "create_timestamps", "girl_desc", "girl_name", "id") SELECT "create_time", "create_timestamps", "girl_desc", "girl_name", "id" FROM "GirlModelInfo";
DROP TABLE "GirlModelInfo";
ALTER TABLE "new_GirlModelInfo" RENAME TO "GirlModelInfo";
CREATE UNIQUE INDEX "GirlModelInfo_girl_name_key" ON "GirlModelInfo"("girl_name");
CREATE TABLE "new_Meirentu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "girl_name" TEXT NOT NULL,
    "album_desc" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_Meirentu" ("album_desc", "cover", "create_time", "create_timestamps", "girl_name", "id", "images", "tags", "time") SELECT "album_desc", "cover", "create_time", "create_timestamps", "girl_name", "id", "images", "tags", "time" FROM "Meirentu";
DROP TABLE "Meirentu";
ALTER TABLE "new_Meirentu" RENAME TO "Meirentu";
CREATE UNIQUE INDEX "Meirentu_album_desc_key" ON "Meirentu"("album_desc");
CREATE TABLE "new_ZhizunDistrict" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "district_id" INTEGER NOT NULL,
    "district_name" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_ZhizunDistrict" ("create_time", "create_timestamps", "district_id", "district_name", "id") SELECT "create_time", "create_timestamps", "district_id", "district_name", "id" FROM "ZhizunDistrict";
DROP TABLE "ZhizunDistrict";
ALTER TABLE "new_ZhizunDistrict" RENAME TO "ZhizunDistrict";
CREATE UNIQUE INDEX "ZhizunDistrict_district_id_key" ON "ZhizunDistrict"("district_id");
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
    "authentications" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_ZhizunGirl" ("address", "agent_id", "authentication", "authentications", "certification", "city_code", "city_name", "code", "create_time", "create_timestamps", "district_code", "district_name", "id", "image", "images", "media", "medium", "name", "poster", "premium", "random_index", "recommend", "status", "tag_name", "tags", "url_id", "valid") SELECT "address", "agent_id", "authentication", "authentications", "certification", "city_code", "city_name", "code", "create_time", "create_timestamps", "district_code", "district_name", "id", "image", "images", "media", "medium", "name", "poster", "premium", "random_index", "recommend", "status", "tag_name", "tags", "url_id", "valid" FROM "ZhizunGirl";
DROP TABLE "ZhizunGirl";
ALTER TABLE "new_ZhizunGirl" RENAME TO "ZhizunGirl";
CREATE UNIQUE INDEX "ZhizunGirl_url_id_key" ON "ZhizunGirl"("url_id");
CREATE UNIQUE INDEX "ZhizunGirl_code_key" ON "ZhizunGirl"("code");
CREATE TABLE "new_ZhizunTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag_id" INTEGER NOT NULL,
    "tag_name" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_timestamps" BIGINT NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
INSERT INTO "new_ZhizunTag" ("create_time", "create_timestamps", "id", "tag_id", "tag_name") SELECT "create_time", "create_timestamps", "id", "tag_id", "tag_name" FROM "ZhizunTag";
DROP TABLE "ZhizunTag";
ALTER TABLE "new_ZhizunTag" RENAME TO "ZhizunTag";
CREATE UNIQUE INDEX "ZhizunTag_tag_id_key" ON "ZhizunTag"("tag_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "XChinaSigou_subs_key" ON "XChinaSigou"("subs");

-- CreateIndex
CREATE UNIQUE INDEX "XChinaSigou_album_id_key" ON "XChinaSigou"("album_id");
