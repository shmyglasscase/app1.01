/*
  # Create Base Messaging Tables

  1. New Tables
    - `profiles` - User profiles table
    - `marketplace_listings` - Marketplace listings table
    - `conversations` - Conversations between users
    - `messages` - Messages in conversations
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for authenticated users
  
  3. Purpose
    - Create base schema for messaging functionality
    - Support conversations between users about marketplace listings
    - Track message read status and timestamps
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'collector')),
  subscription_expires_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  terms_version_agreed text,
  privacy_version_agreed text,
  policy_agreed_at timestamptz,
  policy_ip_address text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create inventory_items table (needed for marketplace_listings foreign key)
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  manufacturer text DEFAULT '',
  pattern text DEFAULT '',
  year_manufactured integer,
  purchase_price numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  location text DEFAULT '',
  description text DEFAULT '',
  condition text DEFAULT 'good',
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted integer,
  favorites integer,
  quantity integer DEFAULT 1,
  subcategory text DEFAULT '',
  ai_identified boolean DEFAULT false,
  ai_confidence numeric CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  ai_analysis_id text,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  subcategory text,
  condition text DEFAULT '',
  photo_url text,
  listing_type text NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'trade', 'both')),
  asking_price numeric,
  trade_preferences text,
  listing_status text NOT NULL DEFAULT 'active' CHECK (listing_status IN ('active', 'sold', 'completed', 'removed')),
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  users_name text,
  CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id),
  CONSTRAINT marketplace_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT marketplace_listings_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
);

-- Create conversations table with unread count tracking
CREATE TABLE IF NOT EXISTS conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  listing_id uuid,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  unread_count_user1 integer DEFAULT 0 NOT NULL,
  unread_count_user2 integer DEFAULT 0 NOT NULL,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT conversations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE SET NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  original_text text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread 
  ON messages(conversation_id, is_read, sender_id) 
  WHERE is_read = false AND is_deleted = false;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view own items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for marketplace_listings
CREATE POLICY "Anyone can view active listings"
  ON marketplace_listings FOR SELECT
  TO authenticated
  USING (listing_status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own listings"
  ON marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON marketplace_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  )
  WITH CHECK (auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Function to create or get profile for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();