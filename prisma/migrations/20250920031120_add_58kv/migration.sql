-- CreateTable
CREATE TABLE "Girl58Kv" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titlename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "wechat" TEXT NOT NULL,
    "uuutalk" TEXT NOT NULL,
    "qqnum" TEXT NOT NULL,
    "telegram" TEXT NOT NULL,
    "shadow" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "provinceCity" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "accuracy" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "video" TEXT NOT NULL,
    "ladyid" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "isbn" INTEGER NOT NULL,
    "ladytype" INTEGER NOT NULL,
    "isExamine" INTEGER NOT NULL,
    "isStart" INTEGER NOT NULL,
    "isAuth" INTEGER NOT NULL,
    "topup" INTEGER NOT NULL,
    "isBlackList" BOOLEAN NOT NULL,
    "createTime" TEXT NOT NULL,
    "characteristics" TEXT NOT NULL,
    "role" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Girl58Kv_ladyid_key" ON "Girl58Kv"("ladyid");
