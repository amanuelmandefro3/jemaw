CREATE TYPE "public"."bill_category" AS ENUM('breakfast', 'lunch', 'dinner', 'groceries', 'transportation', 'utilities', 'rent', 'entertainment', 'vacation', 'shopping', 'healthcare', 'other');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jemaw_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" "bill_category" DEFAULT 'other' NOT NULL,
	"paid_by_id" text NOT NULL,
	"status" "bill_status" DEFAULT 'pending' NOT NULL,
	"approved_by_id" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jemaw_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jemaw_id" uuid NOT NULL,
	"email" text NOT NULL,
	"invited_by_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jemaw_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "jemaw_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jemaw_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jemaws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jemaw_id" uuid NOT NULL,
	"payer_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"status" "settlement_status" DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_jemaw_id_jemaws_id_fk" FOREIGN KEY ("jemaw_id") REFERENCES "public"."jemaws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_paid_by_id_users_id_fk" FOREIGN KEY ("paid_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jemaw_invitations" ADD CONSTRAINT "jemaw_invitations_jemaw_id_jemaws_id_fk" FOREIGN KEY ("jemaw_id") REFERENCES "public"."jemaws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jemaw_invitations" ADD CONSTRAINT "jemaw_invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jemaw_members" ADD CONSTRAINT "jemaw_members_jemaw_id_jemaws_id_fk" FOREIGN KEY ("jemaw_id") REFERENCES "public"."jemaws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jemaw_members" ADD CONSTRAINT "jemaw_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jemaws" ADD CONSTRAINT "jemaws_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_jemaw_id_jemaws_id_fk" FOREIGN KEY ("jemaw_id") REFERENCES "public"."jemaws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bill_splits_bill_idx" ON "bill_splits" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_splits_user_idx" ON "bill_splits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bills_jemaw_idx" ON "bills" USING btree ("jemaw_id");--> statement-breakpoint
CREATE INDEX "bills_paid_by_idx" ON "bills" USING btree ("paid_by_id");--> statement-breakpoint
CREATE INDEX "bills_status_idx" ON "bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jemaw_invitations_email_idx" ON "jemaw_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "jemaw_invitations_token_idx" ON "jemaw_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "jemaw_members_jemaw_idx" ON "jemaw_members" USING btree ("jemaw_id");--> statement-breakpoint
CREATE INDEX "jemaw_members_user_idx" ON "jemaw_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "settlements_jemaw_idx" ON "settlements" USING btree ("jemaw_id");--> statement-breakpoint
CREATE INDEX "settlements_payer_idx" ON "settlements" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "settlements_receiver_idx" ON "settlements" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "settlements_status_idx" ON "settlements" USING btree ("status");