import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Package, DollarSign, Calendar, User, ArrowLeft, LogIn } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SharedItem {
  id: string;
  name?: string;
  item_name?: string;
  category?: string;
  manufacturer?: string;
  photo_url?: string;
  current_value?: number;
  desired_price_max?: number;
  condition?: string;
  description?: string;
  pattern?: string;
}

interface SharedData {
  collection: {
    collection_type: string;
    created_at: string;
    view_count: number;
  };
  items: SharedItem[];
  owner: {
    full_name?: string;
    email?: string;
  };
}

export default function SharedCollectionScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SharedItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadSharedCollection();
  }, [token]);

  const loadSharedCollection = async () => {
    try {
      const response = await fetch(`/shared/${token}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to load shared collection');
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
    } catch (err) {
      setError('Failed to load shared collection');
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: SharedItem }) => {
    const itemName = item.name || item.item_name || 'Untitled Item';
    const isWishlist = data?.collection.collection_type === 'wishlist';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedItem(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.cardImage}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={32} color="#cbd5e0" />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          {item.category && (
            <View style={[styles.categoryTag, isWishlist && styles.categoryTagWishlist]}>
              <Text style={[styles.categoryText, isWishlist && styles.categoryTextWishlist]}>
                {item.category}
              </Text>
            </View>
          )}
          <Text style={styles.itemName} numberOfLines={2}>{itemName}</Text>
          {item.manufacturer && (
            <Text style={styles.itemManufacturer} numberOfLines={1}>{item.manufacturer}</Text>
          )}
          <View style={styles.cardFooter}>
            {item.current_value !== undefined && item.current_value !== null && (
              <Text style={styles.itemValue}>${item.current_value.toFixed(2)}</Text>
            )}
            {item.desired_price_max !== undefined && item.desired_price_max !== null && (
              <Text style={styles.itemValue}>${item.desired_price_max.toFixed(2)}</Text>
            )}
            {item.condition && (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38a169" />
        <Text style={styles.loadingText}>Loading shared collection...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Package size={64} color="#cbd5e0" />
        <Text style={styles.errorTitle}>Unable to Load Collection</Text>
        <Text style={styles.errorText}>{error || 'This shared collection could not be found.'}</Text>
        {!user && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <LogIn size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const isWishlist = data.collection.collection_type === 'wishlist';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2d3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shared {isWishlist ? 'Wishlist' : 'Collection'}</Text>
        <View style={styles.backButton} />
      </View>

      {!user && (
        <View style={styles.ctaBanner}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Like what you see?</Text>
            <Text style={styles.ctaText}>Create an account to start your own collection</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.ctaButtonText}>Sign Up Free</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.ownerSection}>
        <View style={styles.ownerAvatar}>
          <User size={20} color="#38a169" />
        </View>
        <View style={styles.ownerInfo}>
          <Text style={styles.ownerName}>
            {data.owner.full_name || 'Anonymous Collector'}
          </Text>
          <Text style={styles.ownerMeta}>
            {data.items.length} {data.items.length === 1 ? 'item' : 'items'} •
            {data.collection.view_count} {data.collection.view_count === 1 ? 'view' : 'views'}
          </Text>
        </View>
      </View>

      <FlatList
        data={data.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={64} color="#cbd5e0" />
            <Text style={styles.emptyStateText}>No items in this collection</Text>
          </View>
        }
      />

      {selectedItem && showDetailModal && (
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDetailModal(false)}
          />
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalImageContainer}>
                {selectedItem.photo_url ? (
                  <Image source={{ uri: selectedItem.photo_url }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Package size={48} color="#cbd5e0" />
                  </View>
                )}
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>
                  {selectedItem.name || selectedItem.item_name || 'Untitled'}
                </Text>

                {selectedItem.manufacturer && (
                  <Text style={styles.modalManufacturer}>{selectedItem.manufacturer}</Text>
                )}

                {selectedItem.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalDescription}>{selectedItem.description}</Text>
                  </View>
                )}

                {(selectedItem.current_value || selectedItem.desired_price_max) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Price</Text>
                    <Text style={styles.modalPrice}>
                      ${(selectedItem.current_value || selectedItem.desired_price_max)?.toFixed(2)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f7fafc',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38a169',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  ctaBanner: {
    backgroundColor: '#38a169',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaContent: {
    flex: 1,
    marginRight: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  ctaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4f4e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  ownerMeta: {
    fontSize: 14,
    color: '#718096',
  },
  list: {
    padding: 12,
  },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f7fafc',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 12,
  },
  categoryTag: {
    backgroundColor: '#d4f4e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryTagWishlist: {
    backgroundColor: '#fce7f3',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38a169',
  },
  categoryTextWishlist: {
    color: '#db2777',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  itemManufacturer: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38a169',
  },
  conditionBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginTop: 16,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f7fafc',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  modalManufacturer: {
    fontSize: 18,
    color: '#718096',
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#38a169',
  },
  closeModalButton: {
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
});
