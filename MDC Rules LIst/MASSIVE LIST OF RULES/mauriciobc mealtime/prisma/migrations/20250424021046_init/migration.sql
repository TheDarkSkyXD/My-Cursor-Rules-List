-- CreateTable
CREATE TABLE "public"."cats" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "birth_date" DATE,
    "weight" DECIMAL(5,2),
    "household_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "cats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."household_members" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."households" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "username" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "email" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "id" UUID NOT NULL,
    "cat_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "interval" INTEGER,
    "times" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feeding_logs" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cat_id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "meal_type" TEXT NOT NULL,
    "amount" DECIMAL(5,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "fed_by" UUID,
    "fed_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feeding_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schema_migrations" (
    "version" VARCHAR(255) NOT NULL,
    "dirty" BOOLEAN NOT NULL DEFAULT false,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "public"."cat_weight_logs" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(5,2) NOT NULL,
    "date" DATE NOT NULL,
    "cat_id" UUID NOT NULL,
    "notes" TEXT,
    "measured_by" UUID,

    CONSTRAINT "cat_weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weight_goals" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cat_id" UUID NOT NULL,
    "target_weight" DECIMAL(5,2) NOT NULL,
    "target_date" DATE,
    "start_weight" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_by" UUID NOT NULL,

    CONSTRAINT "weight_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weight_goal_milestones" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goal_id" UUID NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,

    CONSTRAINT "weight_goal_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cats_created_at_idx" ON "public"."cats"("created_at");

-- CreateIndex
CREATE INDEX "cats_household_id_idx" ON "public"."cats"("household_id");

-- CreateIndex
CREATE INDEX "cats_name_idx" ON "public"."cats"("name");

-- CreateIndex
CREATE INDEX "cats_owner_id_idx" ON "public"."cats"("owner_id");

-- CreateIndex
CREATE INDEX "cats_updated_at_idx" ON "public"."cats"("updated_at");

-- CreateIndex
CREATE INDEX "cats_weight_idx" ON "public"."cats"("weight");

-- CreateIndex
CREATE INDEX "household_members_household_id_idx" ON "public"."household_members"("household_id");

-- CreateIndex
CREATE INDEX "household_members_role_idx" ON "public"."household_members"("role");

-- CreateIndex
CREATE INDEX "household_members_user_id_idx" ON "public"."household_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_household_id_user_id_key" ON "public"."household_members"("household_id", "user_id");

-- CreateIndex
CREATE INDEX "households_created_at_idx" ON "public"."households"("created_at");

-- CreateIndex
CREATE INDEX "households_owner_id_idx" ON "public"."households"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "public"."profiles"("username");

-- CreateIndex
CREATE INDEX "profiles_username_idx" ON "public"."profiles"("username");

-- CreateIndex
CREATE INDEX "schedules_cat_id_idx" ON "public"."schedules"("cat_id");

-- CreateIndex
CREATE INDEX "schedules_enabled_idx" ON "public"."schedules"("enabled");

-- CreateIndex
CREATE INDEX "feeding_logs_cat_id_idx" ON "public"."feeding_logs"("cat_id");

-- CreateIndex
CREATE INDEX "feeding_logs_household_id_idx" ON "public"."feeding_logs"("household_id");

-- CreateIndex
CREATE INDEX "feeding_logs_fed_by_idx" ON "public"."feeding_logs"("fed_by");

-- CreateIndex
CREATE INDEX "feeding_logs_fed_at_idx" ON "public"."feeding_logs"("fed_at");

-- CreateIndex
CREATE UNIQUE INDEX "schema_migrations_version_idx" ON "public"."schema_migrations"("version");

-- CreateIndex
CREATE INDEX "cat_weight_logs_cat_id_idx" ON "public"."cat_weight_logs"("cat_id");

-- CreateIndex
CREATE INDEX "cat_weight_logs_date_idx" ON "public"."cat_weight_logs"("date");

-- CreateIndex
CREATE INDEX "cat_weight_logs_cat_id_date_idx" ON "public"."cat_weight_logs"("cat_id", "date");

-- CreateIndex
CREATE INDEX "weight_goals_cat_id_idx" ON "public"."weight_goals"("cat_id");

-- CreateIndex
CREATE INDEX "weight_goals_target_date_idx" ON "public"."weight_goals"("target_date");

-- CreateIndex
CREATE INDEX "weight_goals_status_idx" ON "public"."weight_goals"("status");

-- CreateIndex
CREATE INDEX "weight_goals_cat_id_status_idx" ON "public"."weight_goals"("cat_id", "status");

-- CreateIndex
CREATE INDEX "weight_goal_milestones_goal_id_idx" ON "public"."weight_goal_milestones"("goal_id");

-- CreateIndex
CREATE INDEX "weight_goal_milestones_date_idx" ON "public"."weight_goal_milestones"("date");

-- CreateIndex
CREATE INDEX "weight_goal_milestones_goal_id_date_idx" ON "public"."weight_goal_milestones"("goal_id", "date");

-- AddForeignKey
ALTER TABLE "public"."cats" ADD CONSTRAINT "cats_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cats" ADD CONSTRAINT "cats_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedules" ADD CONSTRAINT "schedules_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feeding_logs" ADD CONSTRAINT "feeding_logs_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feeding_logs" ADD CONSTRAINT "feeding_logs_fed_by_fkey" FOREIGN KEY ("fed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feeding_logs" ADD CONSTRAINT "feeding_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cat_weight_logs" ADD CONSTRAINT "cat_weight_logs_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cat_weight_logs" ADD CONSTRAINT "cat_weight_logs_measured_by_fkey" FOREIGN KEY ("measured_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weight_goals" ADD CONSTRAINT "weight_goals_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "public"."cats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weight_goals" ADD CONSTRAINT "weight_goals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weight_goal_milestones" ADD CONSTRAINT "weight_goal_milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."weight_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
