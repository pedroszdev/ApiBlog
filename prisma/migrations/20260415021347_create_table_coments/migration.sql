-- CreateTable
CREATE TABLE "Coments" (
    "id" SERIAL NOT NULL,
    "coment" TEXT NOT NULL,
    "authorId" INTEGER,
    "postId" INTEGER,

    CONSTRAINT "Coments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Coments" ADD CONSTRAINT "Coments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coments" ADD CONSTRAINT "Coments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
