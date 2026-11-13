-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('BENEFICIARIO', 'DIRIGENTE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BENEFICIARIO', 'DIRIGENTE', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('LOBATO', 'SCOUT', 'CAMINANTE', 'ROVER', 'JEFE');

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "type" "UserType" NOT NULL DEFAULT 'BENEFICIARIO',
    "role" "Role" NOT NULL DEFAULT 'BENEFICIARIO',
    "level" "UserLevel" NOT NULL DEFAULT 'LOBATO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "groupId" TEXT,
    "setId" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "UserLevel" NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "level" "UserLevel" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "groupId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_completions" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT,
    "groupId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earnedPoints" INTEGER NOT NULL,

    CONSTRAINT "activity_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "concept" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progressions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromLevel" "UserLevel" NOT NULL,
    "toLevel" "UserLevel" NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_groupId_idx" ON "users"("groupId");

-- CreateIndex
CREATE INDEX "sets_groupId_idx" ON "sets"("groupId");

-- CreateIndex
CREATE INDEX "activities_groupId_idx" ON "activities"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "activities_key_groupId_key" ON "activities"("key", "groupId");

-- CreateIndex
CREATE INDEX "activity_completions_groupId_idx" ON "activity_completions"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_completions_activityId_userId_key" ON "activity_completions"("activityId", "userId");

-- CreateIndex
CREATE INDEX "payments_groupId_idx" ON "payments"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "progressions_groupId_idx" ON "progressions"("groupId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_setId_fkey" FOREIGN KEY ("setId") REFERENCES "sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_setId_fkey" FOREIGN KEY ("setId") REFERENCES "sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progressions" ADD CONSTRAINT "progressions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progressions" ADD CONSTRAINT "progressions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progressions" ADD CONSTRAINT "progressions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Solo el SUPER_ADMIN de plataforma puede no pertenecer a un grupo
ALTER TABLE "users" ADD CONSTRAINT "users_group_required"
CHECK ("role" = 'SUPER_ADMIN' OR "groupId" IS NOT NULL);

-- Los dirigentes no pertenecen a una sección
ALTER TABLE "users" ADD CONSTRAINT "users_dirigente_no_set"
CHECK ("type" <> 'DIRIGENTE' OR "setId" IS NULL);

-- Una sección siempre es de una rama juvenil (los dirigentes no tienen sección)
ALTER TABLE "sets" ADD CONSTRAINT "sets_level_not_jefe"
CHECK ("level" <> 'JEFE');

