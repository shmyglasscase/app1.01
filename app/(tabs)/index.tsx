import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, Package, Star, Plus, Eye, Heart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem } from '@/types/database';
import { ItemDetailsModal } from '@/components/ItemDetailsModal';
import { AnalyticsModal } from '@/components/AnalyticsModal';
import { EditItemModal } from '@/components/EditItemModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    favorites: 0,
  });
  const [favorites, setFavorites] = useState<InventoryItem[]>([]);
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Loading data for user:', user.id);

    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted', null);

    if (error) {
      console.error('Error loading items:', error);
      return;
    }

    console.log('Items loaded:', items?.length || 0);

    if (items) {
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + (item.current_value || 0), 0);
      const favorites = items.filter(item => item.favorites === 1).length;

      setStats({ totalItems, totalValue, favorites });

      const favoriteItems = items.filter(item => item.favorites === 1).slice(0, 5);
      setFavorites(favoriteItems);

      const recent = items.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 3);
      setRecentItems(recent);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleItemPress = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setModalVisible(false);
    setSelectedItem(item);
    setEditModalVisible(true);
  };

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ deleted: new Date().toISOString() })
      .eq('id', itemId);

    if (!error) {
      await loadData();
    }
  };

  const renderFavoriteItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity style={styles.favoriteCard} onPress={() => handleItemPress(item)}>
      <View style={styles.favoriteImageContainer}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.favoriteImage} />
        ) : (
          <View style={styles.favoriteImagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.favoriteBadge}>
          <Star size={12} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.favoriteBadgeText}>Favorite</Text>
        </View>
      </View>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.favoriteManufacturer} numberOfLines={1}>
          {item.manufacturer || 'Unknown'}
        </Text>
        <Text style={styles.favoritePrice}>${item.current_value?.toFixed(2) || '0.00'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: InventoryItem }) => {
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <TouchableOpacity style={styles.recentCard} onPress={() => handleItemPress(item)}>
        <View style={styles.recentImageContainer}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.recentImage} />
          ) : (
            <View style={styles.recentImagePlaceholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        </View>
        <View style={styles.recentInfo}>
          <Text style={styles.recentName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.recentDate}>{formattedDate}</Text>
          <Text style={styles.recentPrice}>${item.current_value?.toFixed(2) || '0.00'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38a169" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Collection</Text>
          <Text style={styles.headerSubtitle}>Discover and organize your treasures</Text>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(tabs)/collection')}>
            <View style={[styles.statIconContainer, { backgroundColor: '#d4f4e2' }]}>
              <Package size={20} color="#38a169" />
            </View>
            <Text style={styles.statValue}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => setAnalyticsVisible(true)}>
            <View style={[styles.statIconContainer, { backgroundColor: '#d4f4e2' }]}>
              <TrendingUp size={20} color="#38a169" />
            </View>
            <Text style={styles.statValue}>${stats.totalValue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </TouchableOpacity>

          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Star size={20} color="#fbbf24" />
            </View>
            <Text style={styles.statValue}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {favorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your favorites</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/collection')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={favorites}
              renderItem={renderFavoriteItem}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesList}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            />
          </View>
        )}

        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent additions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/collection')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentGrid}>
              {recentItems.map((item) => (
                <View key={item.id} style={styles.recentItemWrapper}>
                  {renderRecentItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}

        {stats.totalItems === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color="#cbd5e0" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No items yet</Text>
            <Text style={styles.emptyStateText}>
              Start building your collection by adding your first item
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitleCentered}>Quick actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#d4f4e2' }]}
              onPress={() => router.push('/(tabs)/collection')}
            >
              <View style={styles.quickActionIcon}>
                <Plus size={24} color="#38a169" />
              </View>
              <Text style={styles.quickActionTitle}>Create item</Text>
              <Text style={styles.quickActionSubtitle}>Add a new item to your collection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#e0f2fe' }]}
              onPress={() => router.push('/(tabs)/collection')}
            >
              <View style={styles.quickActionIcon}>
                <Eye size={24} color="#0284c7" />
              </View>
              <Text style={styles.quickActionTitle}>Browse collection</Text>
              <Text style={styles.quickActionSubtitle}>Explore all your items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#fce7f3' }]}
              onPress={() => router.push('/(tabs)/wishlist')}
            >
              <View style={styles.quickActionIcon}>
                <Heart size={24} color="#db2777" />
              </View>
              <Text style={styles.quickActionTitle}>Wishlist</Text>
              <Text style={styles.quickActionSubtitle}>Track items you want to find</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <ItemDetailsModal
        item={selectedItem}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFavoriteChange={loadData}
      />

      <AnalyticsModal
        visible={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
      />

      <EditItemModal
        item={selectedItem}
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  sectionTitleCentered: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  favoritesList: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  favoriteCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#a0aec0',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  favoriteBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  favoriteInfo: {
    padding: 16,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  favoriteManufacturer: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  favoritePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38a169',
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  recentItemWrapper: {
    width: (width - 56) / 3,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  recentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  recentImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#38a169',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  recentInfo: {
    padding: 10,
  },
  recentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
    minHeight: 32,
  },
  recentDate: {
    fontSize: 11,
    color: '#a0aec0',
    marginBottom: 4,
  },
  recentPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38a169',
  },
  quickActionsGrid: {
    paddingHorizontal: 24,
    gap: 16,
  },
  quickActionCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
});
