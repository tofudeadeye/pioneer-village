CREATE TYPE "public"."PigeonState" AS ENUM('DELIVERING', 'WAITING_REPLY', 'RETURNING');--> statement-breakpoint
CREATE TABLE "JobPaySlips" (
	"id" serial PRIMARY KEY NOT NULL,
	"characterId" integer NOT NULL,
	"jobId" integer NOT NULL,
	"amount" numeric NOT NULL,
	"reason" varchar NOT NULL,
	"jobHandle" varchar NOT NULL,
	"redeemed" boolean DEFAULT false,
	"redeemedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"metadata" json DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "PigeonDeliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"pigeonItemId" integer NOT NULL,
	"birdType" varchar NOT NULL,
	"state" "PigeonState" NOT NULL,
	"ownerId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"letterItemId" integer,
	"originX" numeric NOT NULL,
	"originY" numeric NOT NULL,
	"originZ" numeric NOT NULL,
	"destX" numeric NOT NULL,
	"destY" numeric NOT NULL,
	"destZ" numeric NOT NULL,
	"totalDistance" numeric NOT NULL,
	"distanceCovered" numeric DEFAULT '0',
	"lastTickAt" timestamp DEFAULT now() NOT NULL,
	"stateChangedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Horses" ALTER COLUMN "corpses" SET DEFAULT '{}';