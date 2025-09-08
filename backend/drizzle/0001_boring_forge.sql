ALTER TABLE "call_sessions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD COLUMN "username" varchar(50) NOT NULL;