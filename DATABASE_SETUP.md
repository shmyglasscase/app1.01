-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  listing_id uuid,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.profiles(id),
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.profiles(id),
  CONSTRAINT conversations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id)
);
CREATE TABLE public.ebay_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ebay_credentials_pkey PRIMARY KEY (id),
  CONSTRAINT ebay_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ebay_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  ebay_listing_id text NOT NULL UNIQUE,
  listing_url text NOT NULL,
  title text NOT NULL,
  start_price numeric NOT NULL,
  buy_it_now_price numeric,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ebay_listings_pkey PRIMARY KEY (id),
  CONSTRAINT ebay_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT ebay_listings_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE public.found_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wishlist_item_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['ebay'::text, 'facebook'::text])),
  listing_title text NOT NULL,
  listing_price numeric NOT NULL,
  listing_url text NOT NULL,
  listing_image_url text,
  found_at timestamp with time zone DEFAULT now(),
  notified boolean DEFAULT false,
  CONSTRAINT found_listings_pkey PRIMARY KEY (id),
  CONSTRAINT found_listings_wishlist_item_id_fkey FOREIGN KEY (wishlist_item_id) REFERENCES public.wishlist_items(id)
);
CREATE TABLE public.inventory (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  item_name text,
  category_id integer,
  manufacturer text,
  pattern text,
  year bigint,
  purchase_price real,
  current_value real,
  condition_id bigint,
  description text,
  user_id text,
  deleted boolean,
  photo_url text,
  location bigint,
  CONSTRAINT inventory_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  manufacturer text DEFAULT ''::text,
  pattern text DEFAULT ''::text,
  year_manufactured integer,
  purchase_price numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  location text DEFAULT ''::text,
  description text DEFAULT ''::text,
  condition text DEFAULT 'good'::text,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted integer,
  favorites integer,
  quantity integer DEFAULT 1,
  category_id uuid,
  condition_id uuid,
  purchase_date date,
  subcategory_id uuid,
  subcategory text DEFAULT ''::text,
  ai_identified boolean DEFAULT false,
  ai_confidence numeric DEFAULT NULL::numeric CHECK (ai_confidence IS NULL OR ai_confidence >= 0::numeric AND ai_confidence <= 1::numeric),
  ai_analysis_id text,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT inventory_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.user_custom_fields(id),
  CONSTRAINT inventory_items_condition_id_fkey FOREIGN KEY (condition_id) REFERENCES public.user_custom_fields(id),
  CONSTRAINT inventory_items_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.user_custom_fields(id)
);
CREATE TABLE public.inventory_photos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  inventory_id bigint NOT NULL,
  user_id text NOT NULL,
  photo_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_photos_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_photos_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id)
);
CREATE TABLE public.marketplace_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid,
  title text NOT NULL,
  description text DEFAULT ''::text,
  category text DEFAULT ''::text,
  subcategory text,
  condition text DEFAULT ''::text,
  photo_url text,
  listing_type text NOT NULL DEFAULT 'sale'::text CHECK (listing_type = ANY (ARRAY['sale'::text, 'trade'::text, 'both'::text])),
  asking_price numeric,
  trade_preferences text,
  listing_status text NOT NULL DEFAULT 'active'::text CHECK (listing_status = ANY (ARRAY['active'::text, 'sold'::text, 'completed'::text, 'removed'::text])),
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  users_name text,
  CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id),
  CONSTRAINT marketplace_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT marketplace_listings_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  subscription_status text DEFAULT 'inactive'::text CHECK (subscription_status = ANY (ARRAY['active'::text, 'inactive'::text, 'cancelled'::text, 'past_due'::text])),
  subscription_tier text DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'pro'::text, 'collector'::text])),
  subscription_expires_at timestamp with time zone,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  terms_version_agreed text,
  privacy_version_agreed text,
  policy_agreed_at timestamp with time zone,
  policy_ip_address text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.share_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unique_share_id text NOT NULL DEFAULT (gen_random_uuid())::text UNIQUE,
  settings jsonb DEFAULT '{"hide_location": false, "hide_description": false, "hide_purchase_date": false, "hide_personal_notes": false, "hide_purchase_price": true}'::jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT share_links_pkey PRIMARY KEY (id),
  CONSTRAINT fk_share_links_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.stripe_customers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  customer_id text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT stripe_customers_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.stripe_orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  checkout_session_id text NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text NOT NULL,
  amount_subtotal bigint NOT NULL,
  amount_total bigint NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::stripe_order_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT stripe_orders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stripe_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id text NOT NULL UNIQUE,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT stripe_subscriptions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_custom_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  field_type text NOT NULL CHECK (field_type = ANY (ARRAY['category'::text, 'condition'::text, 'subcategory'::text])),
  field_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_custom_fields_pkey PRIMARY KEY (id),
  CONSTRAINT user_custom_fields_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['new_message'::text, 'listing_inquiry'::text, 'listing_sold'::text])),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.wishlist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  ebay_search_term text DEFAULT ''::text,
  facebook_marketplace_url text DEFAULT ''::text,
  desired_price_max numeric DEFAULT NULL::numeric,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'found'::text])),
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  additional_search_terms text,
  category text DEFAULT ''::text,
  subcategory text DEFAULT ''::text,
  manufacturer text DEFAULT ''::text,
  pattern text DEFAULT ''::text,
  year_manufactured integer,
  condition text DEFAULT 'good'::text,
  location text DEFAULT ''::text,
  description text DEFAULT ''::text,
  photo_url text,
  quantity integer DEFAULT 1,
  CONSTRAINT wishlist_items_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);