CREATE TYPE "public"."asset_type" AS ENUM('front', 'back', 'mask', 'glb', 'gltf');--> statement-breakpoint
CREATE TYPE "public"."fit_cut" AS ENUM('slim', 'regular', 'relaxed');--> statement-breakpoint
CREATE TYPE "public"."garment_type" AS ENUM('bottom', 'top', 'dress');--> statement-breakpoint
CREATE TYPE "public"."tryon_status" AS ENUM('queued', 'processing', 'waiting', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('size_mismatch', 'damaged', 'not_as_described', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'seller', 'admin');--> statement-breakpoint
CREATE TYPE "public"."body_shape" AS ENUM('hourglass', 'pear', 'apple', 'rectangle', 'athletic', 'unspecified');--> statement-breakpoint
CREATE TABLE "body_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"height_cm" double precision NOT NULL,
	"weight_kg" double precision NOT NULL,
	"chest_cm" double precision NOT NULL,
	"waist_cm" double precision NOT NULL,
	"hips_cm" double precision NOT NULL,
	"inseam_cm" double precision NOT NULL,
	"outseam_cm" double precision NOT NULL,
	"shoulder_width_cm" double precision NOT NULL,
	"body_shape_type" "body_shape" DEFAULT 'unspecified' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "body_profiles_bounds" CHECK ("body_profiles"."height_cm" between 80 and 250 and "body_profiles"."weight_kg" between 15 and 350
    and "body_profiles"."chest_cm" between 30 and 250 and "body_profiles"."waist_cm" between 25 and 250 and "body_profiles"."hips_cm" between 30 and 250
    and "body_profiles"."inseam_cm" between 20 and 130 and "body_profiles"."outseam_cm" between "body_profiles"."inseam_cm" and "body_profiles"."height_cm"
    and "body_profiles"."shoulder_width_cm" between 15 and 90 and "body_profiles"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fit_analysis_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid,
	"variant_id" uuid NOT NULL,
	"profile_revision" integer NOT NULL,
	"algorithm_version" text NOT NULL,
	"score" integer NOT NULL,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fit_score_bounds" CHECK ("fit_analysis_logs"."score" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "fitting_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" "asset_type" NOT NULL,
	"url" text NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_measurements" (
	"variant_id" uuid PRIMARY KEY NOT NULL,
	"waist_circumference_cm" double precision,
	"hips_circumference_cm" double precision,
	"chest_circumference_cm" double precision,
	"inseam_cm" double precision,
	"outseam_cm" double precision,
	"total_length_cm" double precision,
	"hem_flat_width_cm" double precision,
	"shoulder_width_cm" double precision,
	"source" text DEFAULT 'manual' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_positive" CHECK (("product_measurements"."waist_circumference_cm" is null or "product_measurements"."waist_circumference_cm" between 20 and 300)
    and ("product_measurements"."hips_circumference_cm" is null or "product_measurements"."hips_circumference_cm" between 20 and 300) and ("product_measurements"."chest_circumference_cm" is null or "product_measurements"."chest_circumference_cm" between 20 and 300)
    and ("product_measurements"."inseam_cm" is null or "product_measurements"."inseam_cm" between 10 and 150) and ("product_measurements"."outseam_cm" is null or "product_measurements"."outseam_cm" between 10 and 250)
    and ("product_measurements"."total_length_cm" is null or "product_measurements"."total_length_cm" between 10 and 250)
    and ("product_measurements"."hem_flat_width_cm" is null or "product_measurements"."hem_flat_width_cm" between 1 and 150)
    and ("product_measurements"."shoulder_width_cm" is null or "product_measurements"."shoulder_width_cm" between 10 and 100) and "product_measurements"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"sku" text NOT NULL,
	"size" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"commission_bps" integer NOT NULL,
	"body_snapshot" jsonb,
	"measurement_snapshot" jsonb,
	"fit_snapshot" jsonb,
	CONSTRAINT "order_item_bounds" CHECK ("order_items"."quantity" > 0 and "order_items"."unit_price_cents" > 0 and "order_items"."commission_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"total_cents" integer NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"payload_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_total" CHECK ("orders"."total_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_fabrics" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"cotton_pct" integer DEFAULT 0 NOT NULL,
	"elastane_pct" integer DEFAULT 0 NOT NULL,
	"polyester_pct" integer DEFAULT 0 NOT NULL,
	"other_pct" integer DEFAULT 0 NOT NULL,
	"elasticity_ratio" double precision DEFAULT 0 NOT NULL,
	"elasticity_source" text DEFAULT 'measured' NOT NULL,
	CONSTRAINT "fabric_composition" CHECK ("product_fabrics"."cotton_pct" between 0 and 100 and "product_fabrics"."elastane_pct" between 0 and 100
  and "product_fabrics"."polyester_pct" between 0 and 100 and "product_fabrics"."other_pct" between 0 and 100
  and "product_fabrics"."cotton_pct" + "product_fabrics"."elastane_pct" + "product_fabrics"."polyester_pct" + "product_fabrics"."other_pct" = 100),
	CONSTRAINT "elasticity_bounds" CHECK ("product_fabrics"."elasticity_ratio" between 0 and 0.5)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"garment_type" "garment_type" NOT NULL,
	"cut" "fit_cut" DEFAULT 'regular' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"reason" "return_reason" NOT NULL,
	"mismatch_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_status" CHECK ("returns"."status" in ('requested', 'approved', 'rejected', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "store_metrics" (
	"store_id" uuid PRIMARY KEY NOT NULL,
	"delivered_items" integer DEFAULT 0 NOT NULL,
	"returned_items" integer DEFAULT 0 NOT NULL,
	"size_mismatch_items" integer DEFAULT 0 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metrics_bounds" CHECK ("store_metrics"."delivered_items" >= 0 and "store_metrics"."returned_items" >= 0
  and "store_metrics"."returned_items" <= "store_metrics"."delivered_items" and "store_metrics"."size_mismatch_items" between 0 and "store_metrics"."returned_items")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"commission_bps" integer DEFAULT 1500 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_bounds" CHECK ("stores"."commission_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "tryon_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid,
	"variant_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"status" "tryon_status" DEFAULT 'queued' NOT NULL,
	"cache_key" text NOT NULL,
	"payload_hash" text NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb,
	"error_code" text,
	"provider_job_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tryon_mode" CHECK ("tryon_jobs"."mode" in ('ai', '3d'))
);
--> statement-breakpoint
CREATE TABLE "tryon_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" varchar(128) NOT NULL,
	"payload_hash" text NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"size" text NOT NULL,
	"color" text NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "variant_bounds" CHECK ("product_variants"."price_cents" > 0 and "product_variants"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"tax_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "body_profiles" ADD CONSTRAINT "body_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_analysis_logs" ADD CONSTRAINT "fit_analysis_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_analysis_logs" ADD CONSTRAINT "fit_analysis_logs_profile_id_body_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."body_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_analysis_logs" ADD CONSTRAINT "fit_analysis_logs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitting_assets" ADD CONSTRAINT "fitting_assets_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_measurements" ADD CONSTRAINT "product_measurements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_fabrics" ADD CONSTRAINT "product_fabrics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_metrics" ADD CONSTRAINT "store_metrics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_jobs" ADD CONSTRAINT "tryon_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_jobs" ADD CONSTRAINT "tryon_jobs_profile_id_body_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."body_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_jobs" ADD CONSTRAINT "tryon_jobs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_requests" ADD CONSTRAINT "tryon_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_requests" ADD CONSTRAINT "tryon_requests_job_id_tryon_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."tryon_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_job_id_tryon_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."tryon_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "body_profiles_user_idx" ON "body_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "body_profiles_default_uq" ON "body_profiles" USING btree ("user_id") WHERE "body_profiles"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "brands_name_uq" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "fit_logs_user_created_idx" ON "fit_analysis_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "fit_logs_variant_idx" ON "fit_analysis_logs" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "fit_logs_profile_idx" ON "fit_analysis_logs" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_variant_type_uq" ON "fitting_assets" USING btree ("variant_id","type");--> statement-breakpoint
CREATE INDEX "assets_variant_idx" ON "fitting_assets" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "measurements_feed_idx" ON "product_measurements" USING btree ("waist_circumference_cm","inseam_cm");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_store_idx" ON "order_items" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_user_idempotency_uq" ON "orders" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_feed_idx" ON "products" USING btree ("active","garment_type","id");--> statement-breakpoint
CREATE INDEX "products_store_idx" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "returns_item_uq" ON "returns" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "returns_reason_idx" ON "returns" USING btree ("reason");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_slug_uq" ON "stores" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stores_vendor_idx" ON "stores" USING btree ("vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tryon_user_cache_uq" ON "tryon_jobs" USING btree ("user_id","cache_key");--> statement-breakpoint
CREATE INDEX "tryon_dispatch_idx" ON "tryon_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "tryon_profile_idx" ON "tryon_jobs" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "tryon_variant_idx" ON "tryon_jobs" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tryon_requests_user_key_uq" ON "tryon_requests" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "tryon_requests_job_idx" ON "tryon_requests" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_sku_uq" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_size_color_uq" ON "product_variants" USING btree ("product_id","size","color");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_owner_uq" ON "vendors" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_tax_uq" ON "vendors" USING btree ("tax_id");--> statement-breakpoint
CREATE INDEX "webhook_job_idx" ON "webhook_events" USING btree ("job_id");