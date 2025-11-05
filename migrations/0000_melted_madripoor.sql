CREATE TABLE "monday_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"monday_item_id" varchar(255) NOT NULL,
	"board_id" varchar(255) NOT NULL,
	"item_name" text NOT NULL,
	"column_values" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monday_items_monday_item_id_unique" UNIQUE("monday_item_id")
);
