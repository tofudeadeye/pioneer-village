CREATE TABLE "WorldObjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"model" varchar NOT NULL,
	"x" numeric NOT NULL,
	"y" numeric NOT NULL,
	"z" numeric NOT NULL,
	"rotX" numeric DEFAULT '0.0',
	"rotY" numeric DEFAULT '0.0',
	"rotZ" numeric DEFAULT '0.0',
	"networked" boolean DEFAULT true,
	"state" json DEFAULT '{}',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	CONSTRAINT "WorldObjects_name_unique" UNIQUE("name")
);
