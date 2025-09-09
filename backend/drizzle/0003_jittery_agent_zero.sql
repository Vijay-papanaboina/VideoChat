DROP TABLE "call_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "is_edited" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "edited_at" timestamp;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "created_at" timestamp DEFAULT now();