import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import {
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Eye,
  ExternalLink,
  DollarSign,
  Calendar,
  Tag,
} from 'lucide-react-native';
import { useMarketAnalysis } from '@/hooks/useMarketAnalysis';
import { EbayMarketData } from '@/types/database';

interface MarketAnalysisSectionProps {
  inventoryItemId: string;
}

export function MarketAnalysisSection({
  inventoryItemId,
}: MarketAnalysisSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error, refresh } = useMarketAnalysis({
    inventoryItemId,
    autoFetch: true,
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  const handleOpenEbayLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const renderSummary = () => {
    if (!data) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryStatBox}>
          <DollarSign size={18} color="#38a169" />
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryValue}>${data.average_price.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryStatBox}>
          <Tag size={18} color="#718096" />
          <Text style={styles.summaryLabel}>Range</Text>
          <Text style={styles.summaryValue}>
            ${data.min_price.toFixed(0)} - ${data.max_price.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryStatBox}>
          <TrendingUp size={18} color="#2563eb" />
          <Text style={styles.summaryLabel}>Sample Size</Text>
          <Text style={styles.summaryValue}>{data.sample_size} sales</Text>
        </View>
      </View>
    );
  };

  const renderListing = (listing: EbayMarketData, index: number) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.listingCard}
        onPress={() => {
          if (listing.listing_url) {
            handleOpenEbayLink(listing.listing_url);
          }
        }}
      >
        <View style={styles.listingImage}>
          {listing.image_url ? (
            <Image
              source={{ uri: listing.image_url }}
              style={styles.listingImagePhoto}
            />
          ) : (
            <View style={styles.listingImagePlaceholder}>
              <Text style={styles.listingImagePlaceholderText}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {listing.title}
          </Text>

          <View style={styles.listingMeta}>
            <View style={styles.listingMetaRow}>
              <DollarSign size={14} color="#38a169" />
              <Text style={styles.listingSoldPrice}>
                ${listing.sold_price.toFixed(2)}
              </Text>
            </View>

            <View style={styles.listingMetaRow}>
              <Calendar size={12} color="#a0aec0" />
              <Text style={styles.listingDate}>
                {formatDate(listing.sold_date)}
              </Text>
            </View>
          </View>

          {listing.condition && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          )}
        </View>

        <View style={styles.listingAction}>
          <ExternalLink size={18} color="#718096" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <TrendingUp size={20} color="#38a169" />
          <Text style={styles.title}>Market Analysis</Text>
          {data?.cached && (
            <View style={styles.cachedBadge}>
              <Text style={styles.cachedText}>Cached</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {!loading && data && (
            <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
              <RefreshCw size={16} color="#718096" />
            </TouchableOpacity>
          )}
          <ChevronRight
            size={20}
            color="#718096"
            style={{
              transform: [{ rotate: expanded ? '90deg' : '0deg' }],
            }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#38a169" />
              <Text style={styles.loadingText}>Analyzing market data...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                <RefreshCw size={16} color="#fff" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && !data && (
            <View style={styles.emptyContainer}>
              <Eye size={32} color="#cbd5e0" />
              <Text style={styles.emptyText}>No market data available</Text>
              <Text style={styles.emptySubtext}>
                We couldn't find recent sales for similar items
              </Text>
            </View>
          )}

          {!loading && !error && data && (
            <>
              {renderSummary()}

              <View style={styles.listingsHeader}>
                <Text style={styles.listingsTitle}>Recent Sales</Text>
                {data.last_updated && (
                  <Text style={styles.lastUpdated}>
                    Updated {formatLastUpdated(data.last_updated)}
                  </Text>
                )}
              </View>

              {data.listings.map((listing, index) => renderListing(listing, index))}

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  Based on {data.sample_size} recent eBay sales. Actual value may vary.
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
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
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  cachedBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cachedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#718096',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#e53e3e',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38a169',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
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
    marginTop: 4,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryStatBox: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#718096',
    marginTop: 4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#a0aec0',
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  listingImagePhoto: {
    width: '100%',
    height: '100%',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingImagePlaceholderText: {
    fontSize: 11,
    color: '#a0aec0',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
  },
  listingMeta: {
    gap: 4,
    marginBottom: 6,
  },
  listingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingSoldPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38a169',
  },
  listingDate: {
    fontSize: 12,
    color: '#a0aec0',
  },
  conditionBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  listingAction: {
    justifyContent: 'center',
  },
  disclaimer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
});
