CREATE TABLE "monday_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" varchar(255) NOT NULL,
	"column_id" varchar(255) NOT NULL,
	"column_title" text NOT NULL,
	"column_type" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monday_columns_column_id_unique" UNIQUE("column_id")
);
