ALTER TABLE "applications" ADD COLUMN "status_updated_by" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "status_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "flagged_by" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "flagged_at" timestamp with time zone;