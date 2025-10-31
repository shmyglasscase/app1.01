export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  subscription_status?: string;
  subscription_tier?: string;
  subscription_expires_at?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
  terms_version_agreed?: string;
  privacy_version_agreed?: string;
  policy_agreed_at?: string;
  policy_ip_address?: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  category: string;
  name: string;
  manufacturer?: string;
  pattern?: string;
  year_manufactured?: number;
  purchase_price?: number;
  current_value?: number;
  location?: string;
  description?: string;
  condition?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  deleted?: number;
  favorites?: number;
  quantity?: number;
  category_id?: string;
  condition_id?: string;
  purchase_date?: string;
  subcategory_id?: string;
  subcategory?: string;
  ai_identified?: boolean;
  ai_confidence?: number;
  ai_analysis_id?: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  item_name: string;
  facebook_marketplace_url?: string;
  desired_price_max?: number;
  status?: string;
  last_checked_at?: string;
  created_at: string;
  updated_at: string;
  additional_search_terms?: string;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
  pattern?: string;
  year_manufactured?: number;
  condition?: string;
  location?: string;
  description?: string;
  photo_url?: string;
  quantity?: number;
}

export interface MarketplaceListing {
  id: string;
  user_id: string;
  inventory_item_id?: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  condition?: string;
  photo_url?: string;
  listing_type: string;
  asking_price?: number;
  trade_preferences?: string;
  listing_status: string;
  view_count?: number;
  created_at: string;
  updated_at: string;
  users_name?: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  listing_id?: string;
  last_message_at?: string;
  created_at: string;
  unread_count_user1: number;
  unread_count_user2: number;
  last_message_preview?: string;
  last_message_sender_id?: string;
  user1?: Profile;
  user2?: Profile;
  listing?: MarketplaceListing;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  original_text?: string;
  sender?: Profile;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: 'new_message' | 'listing_inquiry' | 'listing_sold' | 'wishlist_match';
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface WishlistMatch {
  id: string;
  wishlist_item_id: string;
  marketplace_listing_id: string;
  match_score: number;
  match_status: 'new' | 'viewed' | 'dismissed' | 'interested';
  match_details: {
    name_score: number;
    category_score: number;
    manufacturer_score: number;
    pattern_score: number;
    description_score: number;
  };
  created_at: string;
  updated_at: string;
}

export interface EbayMarketData {
  id: string;
  inventory_item_id: string;
  ebay_item_id: string;
  title: string;
  sold_price: number;
  sold_date: string;
  condition?: string;
  listing_url?: string;
  image_url?: string;
  seller_info?: Record<string, unknown>;
  shipping_cost?: number;
  created_at: string;
}

export interface MarketAnalysisCache {
  id: string;
  inventory_item_id: string;
  analysis_data: {
    average_price?: number;
    min_price?: number;
    max_price?: number;
    sample_size?: number;
    trending?: 'up' | 'down' | 'stable';
    listings?: EbayMarketData[];
  };
  last_updated: string;
  expires_at: string;
  created_at: string;
}

export interface MarketAnalysisResult {
  average_price: number;
  min_price: number;
  max_price: number;
  sample_size: number;
  trending?: 'up' | 'down' | 'stable';
  listings: EbayMarketData[];
  cached: boolean;
  last_updated: string;
}

export interface CategoryUsageTracking {
  id: string;
  user_id: string;
  marketplace_listing_id?: string;
  category_raw: string;
  category_normalized: string;
  category_type: 'category' | 'subcategory';
  created_at: string;
}

export interface PopularCategory {
  id: string;
  category_normalized: string;
  category_display: string;
  category_type: 'category' | 'subcategory';
  unique_user_count: number;
  total_usage_count: number;
  is_active: boolean;
  first_seen_at: string;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryGroup {
  id: string;
  canonical_category_id: string;
  category_variation: string;
  similarity_score: number;
  created_at: string;
}

export interface UserSearchHistory {
  id: string;
  user_id?: string;
  search_query?: string;
  filters_applied: Record<string, unknown>;
  results_count: number;
  created_at: string;
}
