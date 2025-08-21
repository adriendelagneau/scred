-- CreateTable
CREATE TABLE "public"."identity_key" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "identity_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identity_key_publicKey_key" ON "public"."identity_key"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "identity_key_userId_key" ON "public"."identity_key"("userId");

-- AddForeignKey
ALTER TABLE "public"."identity_key" ADD CONSTRAINT "identity_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
