/*
  Warnings:

  - A unique constraint covering the columns `[authorId,postId]` on the table `Likes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authorId,commentId]` on the table `Likes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Likes_authorId_postId_key" ON "Likes"("authorId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Likes_authorId_commentId_key" ON "Likes"("authorId", "commentId");
