CREATE TABLE "call_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"user_id" integer NOT NULL,
	"duration" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"is_active" boolean DEFAULT true,
	"call_quality" integer DEFAULT 0,
	"participants_count" integer DEFAULT 1,
	"connection_type" varchar(20) DEFAULT 'webrtc'
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"user_id" integer NOT NULL,
	"username" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"is_active" boolean DEFAULT true,
	"is_favorite" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_by" integer,
	"max_users" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rooms_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"room_name" varchar(100),
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"avatar" varchar(500),
	"bio" varchar(500),
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT true,
	"total_calls" integer DEFAULT 0,
	"total_duration" integer DEFAULT 0,
	"last_active" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;