CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"username" varchar(50) NOT NULL,
	"user_id" integer,
	"message" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'text',
	"timestamp" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "room_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_message_at" timestamp,
	"message_count" integer DEFAULT 0,
	CONSTRAINT "room_chat_sessions_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;