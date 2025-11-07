/*
  # Create Subscription Management Tables

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text) - active, trial, expired, cancelled, refunded
      - `subscription_tier` (text) - premium, pro (for future expansion)
      - `trial_start` (timestamptz) - when trial started
      - `trial_end` (timestamptz) - when trial ends
      - `subscription_start` (timestamptz) - when paid subscription starts
      - `subscription_end` (timestamptz) - when subscription expires
      - `apple_transaction_id` (text) - Apple's transaction ID
      - `apple_original_transaction_id` (text) - Original transaction ID
      - `apple_product_id` (text) - Product ID from App Store
      - `auto_renew` (boolean) - whether subscription auto-renews
      - `cancelled_at` (timestamptz) - when user cancelled
      - `refunded_at` (timestamptz) - when refund was issued
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `subscription_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subscription_id` (uuid, foreign key to subscriptions)
      - `event_type` (text) - trial_started, trial_expired, subscribed, renewed, cancelled, refunded
      - `event_data` (jsonb) - additional event details
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view and update their own subscription data
    - System can insert and update all subscription data

  3. Indexes
    - Index on user_id for fast lookups
    - Index on status for filtering active subscriptions
    - Index on subscription_end for expiration checks
    - Index on apple_transaction_id for receipt verification

  4. Important Notes
    - Only one active subscription per user (enforced by unique constraint)
    - Subscription status must be checked before granting access to premium features
    - Trial period is 3 days by default
    - History table maintains audit trail of all subscription events
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'trial',
  subscription_tier text NOT NULL DEFAULT 'premium',
  trial_start timestamptz,
  trial_end timestamptz,
  subscription_start timestamptz,
  subscription_end timestamptz,
  apple_transaction_id text,
  apple_original_transaction_id text,
  apple_product_id text,
  auto_renew boolean DEFAULT true,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  CHECK (status IN ('trial', 'active', 'expired', 'cancelled', 'refunded'))
);

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CHECK (event_type IN ('trial_started', 'trial_expired', 'subscribed', 'renewed', 'cancelled', 'refunded', 'restored'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end ON subscriptions(subscription_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_apple_transaction ON subscriptions(apple_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON subscription_history(created_at DESC);

-- Add subscription_tier to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'free';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for subscription_history
CREATE POLICY "Users can view their own subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscription history"
  ON subscription_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Function to create subscription history entry
CREATE OR REPLACE FUNCTION create_subscription_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO subscription_history (user_id, subscription_id, event_type, event_data)
    VALUES (NEW.user_id, NEW.id, 'trial_started', jsonb_build_object(
      'trial_start', NEW.trial_start,
      'trial_end', NEW.trial_end
    ));
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != NEW.status) THEN
      INSERT INTO subscription_history (user_id, subscription_id, event_type, event_data)
      VALUES (NEW.user_id, NEW.id, 
        CASE NEW.status
          WHEN 'active' THEN 'subscribed'
          WHEN 'expired' THEN 'trial_expired'
          WHEN 'cancelled' THEN 'cancelled'
          WHEN 'refunded' THEN 'refunded'
          ELSE 'subscribed'
        END,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'subscription_start', NEW.subscription_start,
          'subscription_end', NEW.subscription_end
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create history entries
DROP TRIGGER IF EXISTS create_subscription_history ON subscriptions;
CREATE TRIGGER create_subscription_history
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_history_entry();

-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_user_subscription_status(check_user_id uuid)
RETURNS TABLE (
  has_access boolean,
  status text,
  days_remaining integer,
  is_trial boolean
) AS $$
DECLARE
  sub_record subscriptions%ROWTYPE;
  current_time timestamptz := now();
BEGIN
  SELECT * INTO sub_record FROM subscriptions WHERE user_id = check_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'none'::text, 0, false;
    RETURN;
  END IF;
  
  IF sub_record.status = 'trial' AND sub_record.trial_end > current_time THEN
    RETURN QUERY SELECT 
      true, 
      'trial'::text, 
      EXTRACT(days FROM (sub_record.trial_end - current_time))::integer,
      true;
  ELSIF sub_record.status = 'active' AND sub_record.subscription_end > current_time THEN
    RETURN QUERY SELECT 
      true, 
      'active'::text, 
      EXTRACT(days FROM (sub_record.subscription_end - current_time))::integer,
      false;
  ELSE
    RETURN QUERY SELECT false, 'expired'::text, 0, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start trial for new user
CREATE OR REPLACE FUNCTION start_user_trial(trial_user_id uuid)
RETURNS uuid AS $$
DECLARE
  new_subscription_id uuid;
  trial_duration_days integer := 3;
BEGIN
  INSERT INTO subscriptions (
    user_id,
    status,
    trial_start,
    trial_end
  ) VALUES (
    trial_user_id,
    'trial',
    now(),
    now() + (trial_duration_days || ' days')::interval
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO new_subscription_id;
  
  RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
