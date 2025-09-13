/*
  Warnings:

  - A unique constraint covering the columns `[girl_id]` on the table `Girl` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Girl_girl_id_key" ON "Girl"("girl_id");
