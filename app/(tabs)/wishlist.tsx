import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, RefreshControl, Alert, Modal, ScrollView, Share } from 'react-native';
import { Search, Heart, Plus, X, DollarSign, Tag, Calendar, MapPin, Package, Edit, Trash2, Check, Share2, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { WishlistItem, MarketplaceListing } from '@/types/database';
import { EditWishlistItemModal } from '@/components/EditWishlistItemModal';
import { WishlistMatchesSection } from '@/components/WishlistMatchesSection';
import { MarketplaceItemDetailsModal } from '@/components/MarketplaceItemDetailsModal';
import { useWishlistMatchCounts } from '@/hooks/useWishlistMatchCounts';

export default function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [selectedMarketplaceListing, setSelectedMarketplaceListing] = useState<MarketplaceListing | null>(null);
  const { user } = useAuth();
  const { matchCounts } = useWishlistMatchCounts(items.map(item => item.id));

  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    manufacturer: '',
    pattern: '',
    desired_price_max: '',
    description: '',
    ebay_search_term: '',
  });

  useEffect(() => {
    loadItems();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery]);

  const loadItems = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!user || !formData.item_name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const { error } = await supabase
      .from('wishlist_items')
      .insert([{
        user_id: user.id,
        item_name: formData.item_name,
        category: formData.category || null,
        manufacturer: formData.manufacturer || null,
        pattern: formData.pattern || null,
        desired_price_max: formData.desired_price_max ? parseFloat(formData.desired_price_max) : null,
        description: formData.description || null,
        ebay_search_term: formData.ebay_search_term || null,
        status: 'active',
      }]);

    if (!error) {
      setShowAddModal(false);
      setFormData({
        item_name: '',
        category: '',
        manufacturer: '',
        pattern: '',
        desired_price_max: '',
        description: '',
        ebay_search_term: '',
      });
      loadItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Wishlist Item',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('wishlist_items')
              .delete()
              .eq('id', itemId);

            if (!error) {
              setShowDetailsModal(false);
              setSelectedItem(null);
              await loadItems();
            } else {
              Alert.alert('Error', 'Failed to delete wishlist item. Please try again.');
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleLongPress = (itemId: string) => {
    setSelectionMode(true);
    setSelectedItems(new Set([itemId]));
  };

  const handleItemPress = async (item: WishlistItem) => {
    if (selectionMode) {
      toggleItemSelection(item.id);
    } else {
      setSelectedItem(item);
      setShowDetailsModal(true);

      await supabase
        .from('wishlist_matches')
        .update({ match_status: 'viewed' })
        .eq('wishlist_item_id', item.id)
        .eq('match_status', 'new');
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      if (newSet.size === 0) {
        setSelectionMode(false);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    const count = selectedItems.size;
    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${count} ${count === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('wishlist_items')
              .delete()
              .in('id', Array.from(selectedItems));

            if (!error) {
              setSelectedItems(new Set());
              setSelectionMode(false);
              loadItems();
            }
          },
        },
      ]
    );
  };

  const handleShareSelected = async () => {
    if (!user) return;

    const itemIds = Array.from(selectedItems);
    const { data, error } = await supabase
      .from('shared_collections')
      .insert([{
        user_id: user.id,
        collection_type: 'wishlist',
        item_ids: itemIds,
        expires_at: null,
      }])
      .select()
      .single();

    if (data) {
      const shareUrl = `${process.env.EXPO_PUBLIC_APP_URL || 'https://site.myglasscase.com'}/shared/${data.share_token}`;

      try {
        await Share.share({
          message: `Check out my wishlist items: ${shareUrl}`, 
          url: shareUrl,
        });
        setSelectedItems(new Set());
        setSelectionMode(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to share items');
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const renderItem = ({ item }: { item: WishlistItem }) => {
    const isSelected = selectedItems.has(item.id);
    const matchCount = matchCounts[item.id] || 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          matchCount > 0 && styles.cardWithMatches,
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item.id)}
      >
        {selectionMode && (
          <View style={styles.selectionOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Check size={20} color="#fff" />}
            </View>
          </View>
        )}
        {matchCount > 0 && (
          <View style={styles.newMatchIndicator} />
        )}
        <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {item.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
            {matchCount > 0 && (
              <View style={styles.matchBadge}>
                <TrendingUp size={12} color="#38a169" />
                <Text style={styles.matchBadgeText}>{matchCount} {matchCount === 1 ? 'match' : 'matches'}</Text>
              </View>
            )}
          </View>
          <Heart size={20} color="#db2777" fill="#db2777" />
        </View>

        <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>

        {item.manufacturer && (
          <Text style={styles.itemManufacturer} numberOfLines={1}>{item.manufacturer}</Text>
        )}

        {item.pattern && (
          <View style={styles.metaItem}>
            <Tag size={14} color="#a0aec0" />
            <Text style={styles.metaText}>{item.pattern}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          {item.desired_price_max !== null && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Max Price</Text>
              <Text style={styles.priceValue}>${item.desired_price_max.toFixed(2)}</Text>
            </View>
          )}
          <Text style={styles.dateAdded}>Added {formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} you want to find
        </Text>
      </View>

      {selectionMode ? (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={handleCancelSelection} style={styles.cancelButton}>
            <X size={20} color="#718096" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedItems.size} selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={handleShareSelected} style={styles.selectionActionButton}>
              <Share2 size={20} color="#38a169" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteSelected} style={styles.selectionActionButton}>
              <Trash2 size={20} color="#e53e3e" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <Search size={20} color="#a0aec0" />
            <TextInput
              style={styles.searchText}
              placeholder="Search wishlist..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Heart size={64} color="#cbd5e0" />
            <Text style={styles.emptyStateText}>No wishlist items yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add items you want to find and track
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>Add Your First Item</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
              <X size={24} color="#2d3748" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add to Wishlist</Text>
            <TouchableOpacity onPress={handleAddItem} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="What are you looking for?"
                value={formData.item_name}
                onChangeText={(text) => setFormData({ ...formData, item_name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Jadeite, Pottery, Glass"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Manufacturer</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Fire-King, Anchor Hocking"
                value={formData.manufacturer}
                onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pattern</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Jane Ray, Shell"
                value={formData.pattern}
                onChangeText={(text) => setFormData({ ...formData, pattern: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Maximum Price</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                keyboardType="decimal-pad"
                value={formData.desired_price_max}
                onChangeText={(text) => setFormData({ ...formData, desired_price_max: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>eBay Search Term</Text>
              <TextInput
                style={styles.input}
                placeholder="Keywords for eBay search"
                value={formData.ebay_search_term}
                onChangeText={(text) => setFormData({ ...formData, ebay_search_term: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes or details..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={styles.closeButton}>
              <X size={24} color="#2d3748" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Wishlist Item</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.detailsSection}>
                  {selectedItem.category && (
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{selectedItem.category}</Text>
                    </View>
                  )}
                  <Text style={styles.detailsItemName}>{selectedItem.item_name}</Text>
                </View>

                {(selectedItem.manufacturer || selectedItem.pattern) && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    {selectedItem.manufacturer && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Manufacturer</Text>
                        <Text style={styles.detailValue}>{selectedItem.manufacturer}</Text>
                      </View>
                    )}
                    {selectedItem.pattern && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Pattern</Text>
                        <Text style={styles.detailValue}>{selectedItem.pattern}</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedItem.desired_price_max !== null && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Target Price</Text>
                    <View style={styles.priceBox}>
                      <DollarSign size={24} color="#38a169" />
                      <Text style={styles.priceBoxValue}>${selectedItem.desired_price_max.toFixed(2)}</Text>
                      <Text style={styles.priceBoxLabel}>or less</Text>
                    </View>
                  </View>
                )}

                {selectedItem.ebay_search_term && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>eBay Search</Text>
                    <View style={styles.searchTermBox}>
                      <Text style={styles.searchTermText}>{selectedItem.ebay_search_term}</Text>
                    </View>
                  </View>
                )}

                {selectedItem.description && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.descriptionText}>{selectedItem.description}</Text>
                  </View>
                )}

                <View style={styles.detailsSection}>
                  <WishlistMatchesSection
                    wishlistItemId={selectedItem.id}
                    onMatchPress={(listing) => {
                      setSelectedMarketplaceListing(listing);
                      setShowMarketplaceModal(true);
                    }}
                  />
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Metadata</Text>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Added</Text>
                    <Text style={styles.metadataValue}>{formatDate(selectedItem.created_at)}</Text>
                  </View>
                </View>

                <View style={styles.actionsSection}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setShowDetailsModal(false);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit size={20} color="#718096" />
                    <Text style={styles.actionButtonText}>
                      Edit Item
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteItem(selectedItem.id)}
                  >
                    <Trash2 size={20} color="#e53e3e" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      Remove from Wishlist
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <EditWishlistItemModal
        item={selectedItem}
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          loadItems();
          setSelectedItem(null);
        }}
      />

      <MarketplaceItemDetailsModal
        item={selectedMarketplaceListing}
        visible={showMarketplaceModal}
        onClose={() => {
          setShowMarketplaceModal(false);
          setSelectedMarketplaceListing(null);
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
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
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  categoryTag: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#db2777',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
  },
  itemManufacturer: {
    fontSize: 15,
    color: '#718096',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#a0aec0',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#718096',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38a169',
  },
  dateAdded: {
    fontSize: 12,
    color: '#a0aec0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#db2777',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  saveButton: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#db2777',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsItemName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3748',
  },
  priceBox: {
    backgroundColor: '#d4f4e2',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceBoxValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#38a169',
    marginTop: 8,
  },
  priceBoxLabel: {
    fontSize: 14,
    color: '#38a169',
    marginTop: 4,
  },
  searchTermBox: {
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#db2777',
  },
  searchTermText: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  metadataValue: {
    fontSize: 14,
    color: '#4a5568',
  },
  actionsSection: {
    paddingTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  deleteButton: {
    backgroundColor: '#fee',
  },
  deleteButtonText: {
    color: '#e53e3e',
  },
  bottomSpacing: {
    height: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#718096',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  selectionActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#db2777',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#db2777',
    borderColor: '#db2777',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d4f4e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38a169',
  },
  cardWithMatches: {
    borderWidth: 2,
    borderColor: '#d4f4e2',
    backgroundColor: '#fafffe',
  },
  newMatchIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#38a169',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
});
