CREATE TYPE "public"."Gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."PaymentType" AS ENUM('HOURLY', 'PER_TASK', 'COMMISSION', 'SALARY', 'CALLBACK');--> statement-breakpoint
CREATE TYPE "public"."PermissionType" AS ENUM('JOB', 'TASK');--> statement-breakpoint
CREATE TYPE "public"."PregnantStatus" AS ENUM('ACTIVE', 'BIRTHED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."RepeatType" AS ENUM('COOLDOWN', 'BURST', 'WINDOW', 'UNLIMITED');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('USER', 'DEVELOPER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."Sealed" AS ENUM('NONE', 'SEALED', 'BROKEN');--> statement-breakpoint
CREATE TYPE "public"."TaskStatus" AS ENUM('AVAILABLE', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "Accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"allowed" boolean DEFAULT true,
	"priority" integer DEFAULT 10,
	"identifier_steam" varchar NOT NULL,
	"identifier_fivem" varchar,
	"identifier_discord" varchar,
	"identifier_ip" varchar,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"bannedAt" timestamp,
	"role" "Role" DEFAULT 'USER',
	CONSTRAINT "Accounts_identifier_steam_unique" UNIQUE("identifier_steam"),
	CONSTRAINT "Accounts_identifier_fivem_unique" UNIQUE("identifier_fivem"),
	CONSTRAINT "Accounts_identifier_discord_unique" UNIQUE("identifier_discord")
);
--> statement-breakpoint
CREATE TABLE "Brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"identifier" varchar NOT NULL,
	"ownerId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "Brands_ownerId_unique" UNIQUE("ownerId")
);
--> statement-breakpoint
CREATE TABLE "Characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"accountId" integer NOT NULL,
	"firstName" varchar NOT NULL,
	"lastName" varchar NOT NULL,
	"dateOfBirth" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"deletedAt" timestamp,
	"lastX" numeric DEFAULT '0.0',
	"lastY" numeric DEFAULT '0.0',
	"lastZ" numeric DEFAULT '0.0',
	"food" numeric DEFAULT '100.0',
	"drink" numeric DEFAULT '100.0',
	"currencies" json DEFAULT '{"dollars": 20, "gold": 0}',
	"healthMetadata" json DEFAULT '{"health": 100, "stamina": 100, "litersOfBlood": 5, "boneHealth": [], "activeTonic": false, "sick": false, "boneStatus": []}',
	"components" json DEFAULT '[]',
	"model" varchar DEFAULT 'mp_male',
	"whistle" json DEFAULT '{"pitch": 0.5, "shape": 5, "clarity": 0.5}',
	"features" json DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "Container" (
	"id" serial PRIMARY KEY NOT NULL,
	"locked" boolean DEFAULT false,
	"sealed" "Sealed" DEFAULT 'NONE'
);
--> statement-breakpoint
CREATE TABLE "Door" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" integer NOT NULL,
	"state" smallint DEFAULT -1
);
--> statement-breakpoint
CREATE TABLE "Faces" (
	"id" serial PRIMARY KEY NOT NULL,
	"characterId" integer NOT NULL,
	"noseHeight" numeric DEFAULT '0.0',
	"lowerLipWidth" numeric DEFAULT '0.0',
	"upperLipHeight" numeric DEFAULT '0.0',
	"earlobeSize" numeric DEFAULT '0.0',
	"lowerLipHeight" numeric DEFAULT '0.0',
	"eyebrowHeight" numeric DEFAULT '0.0',
	"jawHeight" numeric DEFAULT '0.0',
	"eyesDistance" numeric DEFAULT '0.0',
	"mouthDepth" numeric DEFAULT '0.0',
	"mouthWidth" numeric DEFAULT '0.0',
	"noseCurvature" numeric DEFAULT '0.0',
	"eyebrowDepth" numeric DEFAULT '0.0',
	"earsHeight" numeric DEFAULT '0.0',
	"noseSize" numeric DEFAULT '0.0',
	"headWidth" numeric DEFAULT '0.0',
	"eyelidWidth" numeric DEFAULT '0.0',
	"mouthYPos" numeric DEFAULT '0.0',
	"earsWidth" numeric DEFAULT '0.0',
	"jawWidth" numeric DEFAULT '0.0',
	"nostrilsDistance" numeric DEFAULT '0.0',
	"noseWidth" numeric DEFAULT '0.0',
	"eyesHeight" numeric DEFAULT '0.0',
	"chinHeight" numeric DEFAULT '0.0',
	"upperLipWidth" numeric DEFAULT '0.0',
	"eyebrowWidth" numeric DEFAULT '0.0',
	"cheekBoneWidth" numeric DEFAULT '0.0',
	"chinWidth" numeric DEFAULT '0.0',
	"eyesAngle" numeric DEFAULT '0.0',
	"earsAngle" numeric DEFAULT '0.0',
	"jawDepth" numeric DEFAULT '0.0',
	"eyelidHeight" numeric DEFAULT '0.0',
	"cheekBoneHeight" numeric DEFAULT '0.0',
	"chinDepth" numeric DEFAULT '0.0',
	"cheekBoneDepth" numeric DEFAULT '0.0',
	"upperLipDepth" numeric DEFAULT '0.0',
	"noseAngle" numeric DEFAULT '0.0',
	"mouthXPos" numeric DEFAULT '0.0',
	"lowerLipDepth" numeric DEFAULT '0.0',
	"eyesDepth" numeric DEFAULT '0.0',
	"overlays" json,
	CONSTRAINT "Faces_characterId_unique" UNIQUE("characterId")
);
--> statement-breakpoint
CREATE TABLE "HorsePregnancy" (
	"id" serial PRIMARY KEY NOT NULL,
	"motherHorseId" integer NOT NULL,
	"fatherHorseId" integer NOT NULL,
	"foalHorseId" integer NOT NULL,
	"conceivedAt" timestamp DEFAULT now() NOT NULL,
	"status" "PregnantStatus" DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Horses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"ownerId" integer NOT NULL,
	"stable" varchar,
	"brandId" integer,
	"breeds" json NOT NULL,
	"components" json DEFAULT '[]',
	"model" integer NOT NULL,
	"gender" "Gender" NOT NULL,
	"age" integer NOT NULL,
	"agingPaused" boolean DEFAULT false,
	"agingLastUpdate" timestamp DEFAULT now() NOT NULL,
	"pelts" json DEFAULT '[]',
	"weight" numeric NOT NULL,
	"food" numeric DEFAULT '100.0',
	"water" numeric DEFAULT '100.0',
	"health" numeric DEFAULT '100.0',
	"cleanliness" numeric DEFAULT '100.0',
	"neuteredFixed" boolean DEFAULT false,
	"dna" json NOT NULL,
	"statBonding" json,
	"hooves" numeric NOT NULL,
	"horseshoes" numeric DEFAULT '0.0',
	"metadata" json,
	"lastX" numeric NOT NULL,
	"lastY" numeric NOT NULL,
	"lastZ" numeric NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar NOT NULL,
	"metadata" json DEFAULT '{}',
	"containerId" integer NOT NULL,
	CONSTRAINT "Inventory_identifier_unique" UNIQUE("identifier"),
	CONSTRAINT "Inventory_containerId_unique" UNIQUE("containerId")
);
--> statement-breakpoint
CREATE TABLE "Item" (
	"id" serial PRIMARY KEY NOT NULL,
	"metadata" json DEFAULT '{}',
	"containerId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"deletedAt" timestamp,
	"identifier" integer NOT NULL,
	"slot" integer,
	"durability" integer
);
--> statement-breakpoint
CREATE TABLE "JobEmployees" (
	"id" serial PRIMARY KEY NOT NULL,
	"characterId" integer NOT NULL,
	"jobId" integer NOT NULL,
	"position" varchar DEFAULT 'Employee',
	"salary" numeric DEFAULT '0.0',
	"clockedInAt" timestamp,
	"totalHoursWorked" numeric DEFAULT '0.0',
	"hiredAt" timestamp DEFAULT now(),
	"firedAt" timestamp,
	"metadata" json DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "JobPermissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"characterId" integer NOT NULL,
	"type" "PermissionType" NOT NULL,
	"typeId" varchar NOT NULL,
	"grantedAt" timestamp DEFAULT now(),
	"grantedBy" integer,
	"revokedAt" timestamp,
	"metadata" json DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "JobTaskCooldowns" (
	"id" serial PRIMARY KEY NOT NULL,
	"characterId" integer NOT NULL,
	"taskId" integer NOT NULL,
	"lastCompletedAt" timestamp NOT NULL,
	"completionCount" integer DEFAULT 1,
	"hourlyResetAt" timestamp NOT NULL,
	"hourlyCount" integer DEFAULT 1,
	"dailyResetAt" timestamp NOT NULL,
	"dailyCount" integer DEFAULT 1,
	"metadata" json DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "JobTaskInstances" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"assignedTo" integer,
	"status" "TaskStatus" DEFAULT 'AVAILABLE',
	"progress" json DEFAULT '{}',
	"createdAt" timestamp DEFAULT now(),
	"assignedAt" timestamp,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"scheduledFor" timestamp,
	"expiresAt" timestamp,
	"metadata" json DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "JobTasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" integer NOT NULL,
	"handle" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"taskType" varchar NOT NULL,
	"requirements" json DEFAULT '{}',
	"rewards" json DEFAULT '{}',
	"timeConstraints" json DEFAULT '{}',
	"repeatConfig" json DEFAULT '{}',
	"rateLimits" json DEFAULT '{}',
	"metadata" json DEFAULT '{}',
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"handle" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"paymentType" "PaymentType" DEFAULT 'HOURLY',
	"paymentAmount" numeric DEFAULT '0.0',
	"requirements" json DEFAULT '{}',
	"inventory" json DEFAULT '{}',
	"clockInConstraints" json DEFAULT '{}',
	"metadata" json DEFAULT '{}',
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	CONSTRAINT "Jobs_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "Livestock" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"ownerId" integer NOT NULL,
	"model" integer NOT NULL,
	"brandId" integer NOT NULL,
	"lastX" numeric NOT NULL,
	"lastY" numeric NOT NULL,
	"lastZ" numeric NOT NULL,
	CONSTRAINT "Livestock_ownerId_unique" UNIQUE("ownerId")
);
--> statement-breakpoint
CREATE TABLE "Outfits" (
	"id" serial PRIMARY KEY NOT NULL,
	"characterId" integer NOT NULL,
	"name" varchar NOT NULL,
	"components" json DEFAULT '[]'
);
