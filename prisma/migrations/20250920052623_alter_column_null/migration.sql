-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "cover" TEXT,
    "data" TEXT,
    "video" TEXT,
    "ladyid" INTEGER NOT NULL,
    "distance" INTEGER,
    "isbn" INTEGER,
    "ladytype" INTEGER,
    "isExamine" INTEGER,
    "isStart" INTEGER,
    "isAuth" INTEGER,
    "topup" INTEGER,
    "isBlackList" BOOLEAN,
    "createTime" TEXT,
    "characteristics" TEXT,
    "role" INTEGER
);
INSERT INTO "new_Girl58Kv" ("accuracy", "address", "characteristics", "content", "cover", "createTime", "data", "dimension", "distance", "id", "isAuth", "isBlackList", "isExamine", "isStart", "isbn", "ladyid", "ladytype", "mobile", "position", "price", "provinceCity", "qqnum", "region", "role", "shadow", "telegram", "titlename", "topup", "uuutalk", "video", "wechat") SELECT "accuracy", "address", "characteristics", "content", "cover", "createTime", "data", "dimension", "distance", "id", "isAuth", "isBlackList", "isExamine", "isStart", "isbn", "ladyid", "ladytype", "mobile", "position", "price", "provinceCity", "qqnum", "region", "role", "shadow", "telegram", "titlename", "topup", "uuutalk", "video", "wechat" FROM "Girl58Kv";
DROP TABLE "Girl58Kv";
ALTER TABLE "new_Girl58Kv" RENAME TO "Girl58Kv";
CREATE UNIQUE INDEX "Girl58Kv_ladyid_key" ON "Girl58Kv"("ladyid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
