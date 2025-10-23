import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { ChevronRight, TrendingUp, X, Eye } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { MarketplaceListing } from '@/types/database';

interface WishlistMatch {
  id: string;
  wishlist_item_id: string;
  marketplace_listing_id: string;
  match_score: number;
  match_status: string;
  match_details: {
    name_score: number;
    category_score: number;
    manufacturer_score: number;
    pattern_score: number;
    description_score: number;
  };
  created_at: string;
  marketplace_listing?: MarketplaceListing;
}

interface WishlistMatchesSectionProps {
  wishlistItemId: string;
  onMatchPress: (listing: MarketplaceListing) => void;
}

export function WishlistMatchesSection({
  wishlistItemId,
  onMatchPress,
}: WishlistMatchesSectionProps) {
  const [matches, setMatches] = useState<WishlistMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [wishlistItemId]);

  const loadMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlist_matches')
      .select(`
        *,
        marketplace_listing:marketplace_listings(*)
      `)
      .eq('wishlist_item_id', wishlistItemId)
      .neq('match_status', 'dismissed')
      .order('match_score', { ascending: false })
      .limit(10);

    if (data) {
      setMatches(data as any);
    }
    setLoading(false);
  };

  const handleDismissMatch = async (matchId: string) => {
    await supabase
      .from('wishlist_matches')
      .update({ match_status: 'dismissed' })
      .eq('id', matchId);

    setMatches(matches.filter((m) => m.id !== matchId));
  };

  const handleMarkViewed = async (matchId: string) => {
    await supabase
      .from('wishlist_matches')
      .update({ match_status: 'viewed' })
      .eq('id', matchId);
  };

  const getMatchColor = (score: number) => {
    if (score >= 95) return '#10b981';
    if (score >= 90) return '#38a169';
    if (score >= 85) return '#f59e0b';
    return '#f97316';
  };

  const renderMatch = ({ item }: { item: WishlistMatch }) => {
    const listing = item.marketplace_listing;
    if (!listing) return null;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => {
          handleMarkViewed(item.id);
          onMatchPress(listing);
        }}
      >
        <View style={styles.matchHeader}>
          <View style={styles.matchScoreContainer}>
            <TrendingUp size={16} color={getMatchColor(item.match_score)} />
            <Text
              style={[
                styles.matchScore,
                { color: getMatchColor(item.match_score) },
              ]}
            >
              {item.match_score}%
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDismissMatch(item.id)}
            style={styles.dismissButton}
          >
            <X size={18} color="#a0aec0" />
          </TouchableOpacity>
        </View>

        <View style={styles.matchContent}>
          {listing.photo_url && (
            <Image
              source={{ uri: listing.photo_url }}
              style={styles.matchImage}
            />
          )}
          <View style={styles.matchInfo}>
            <Text style={styles.matchTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            {listing.asking_price && (
              <Text style={styles.matchPrice}>
                ${listing.asking_price.toFixed(2)}
              </Text>
            )}
            {listing.category && (
              <Text style={styles.matchCategory}>{listing.category}</Text>
            )}
          </View>
          <ChevronRight size={20} color="#a0aec0" />
        </View>

        {item.match_status === 'new' && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Potential Matches</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#db2777" />
        </View>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Potential Matches</Text>
        </View>
        <View style={styles.emptyState}>
          <Eye size={32} color="#cbd5e0" />
          <Text style={styles.emptyText}>No matches found yet</Text>
          <Text style={styles.emptySubtext}>
            We'll notify you when we find items similar to this
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <TrendingUp size={20} color="#db2777" />
          <Text style={styles.title}>Potential Matches</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{matches.length}</Text>
          </View>
        </View>
        <ChevronRight
          size={20}
          color="#718096"
          style={{
            transform: [{ rotate: expanded ? '90deg' : '0deg' }],
          }}
        />
      </TouchableOpacity>

      {expanded && (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.matchesList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  badge: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#db2777',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 4,
  },
  matchesList: {
    padding: 8,
  },
  matchCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  matchPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38a169',
    marginBottom: 2,
  },
  matchCategory: {
    fontSize: 12,
    color: '#718096',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#db2777',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
