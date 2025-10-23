import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, RefreshControl, Modal, ScrollView, Alert } from 'react-native';
import { Search, Filter, Plus, X, Upload, Package, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplaceListing, InventoryItem } from '@/types/database';
import { MarketplaceItemDetailsModal } from '@/components/MarketplaceItemDetailsModal';
import { useRouter } from 'expo-router';

export default function ExchangeScreen() {
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [collectionItems, setCollectionItems] = useState<InventoryItem[]>([]);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MarketplaceListing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceListing | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'myListings'>('browse');
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'Good',
    asking_price: '',
    listing_type: 'sale',
    photo_url: '',
    inventory_item_id: null as string | null,
  });

  useEffect(() => {
    if (user) {
      loadMarketplaceItems();
    }
  }, [user, viewMode]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadMarketplaceItems = async () => {
    if (!user) return;

    let query = supabase
      .from('marketplace_listings')
      .select('*')
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false });

    if (viewMode === 'browse') {
      query = query.neq('user_id', user.id);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (data) {
      setItems(data);
    }
  };

  const loadCollectionItems = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted', null)
      .order('name');

    if (data) {
      setCollectionItems(data);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarketplaceItems();
    setRefreshing(false);
  };

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      condition: 'Good',
      asking_price: '',
      listing_type: 'sale',
      photo_url: '',
      inventory_item_id: null,
    });
    setShowAddModal(true);
  };

  const handleSelectFromCollection = async () => {
    await loadCollectionItems();
    setShowCollectionPicker(true);
  };

  const handleSelectCollectionItem = (item: InventoryItem) => {
    setFormData({
      title: item.name,
      description: item.description || '',
      category: item.category || '',
      condition: item.condition || 'Good',
      asking_price: item.current_value?.toString() || item.purchase_price?.toString() || '',
      listing_type: 'sale',
      photo_url: item.photo_url || '',
      inventory_item_id: item.id,
    });
    setShowCollectionPicker(false);
  };

  const handleAddListing = async () => {
    if (!user || !formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your listing');
      return;
    }

    if (editingItem) {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category || null,
          condition: formData.condition,
          asking_price: formData.asking_price ? parseFloat(formData.asking_price) : null,
          listing_type: formData.listing_type,
          photo_url: formData.photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (!error) {
        setShowAddModal(false);
        setEditingItem(null);
        setFormData({
          title: '',
          description: '',
          category: '',
          condition: 'Good',
          asking_price: '',
          listing_type: 'sale',
          photo_url: '',
          inventory_item_id: null,
        });
        loadMarketplaceItems();
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      } else {
        Alert.alert('Error', 'Failed to update listing');
      }
    } else {
      const { error } = await supabase
        .from('marketplace_listings')
        .insert([{
          user_id: user.id,
          inventory_item_id: formData.inventory_item_id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category || null,
          condition: formData.condition,
          asking_price: formData.asking_price ? parseFloat(formData.asking_price) : null,
          listing_type: formData.listing_type,
          listing_status: 'active',
          photo_url: formData.photo_url || null,
          view_count: 0,
        }]);

      if (!error) {
        setShowAddModal(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          condition: 'Good',
          asking_price: '',
          listing_type: 'sale',
          photo_url: '',
          inventory_item_id: null,
        });
        loadMarketplaceItems();
      } else {
        Alert.alert('Error', 'Failed to create listing');
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, photo_url: result.assets[0].uri });
    }
  };

  const categories = ['All', 'Jadeite', 'Pottery', 'Glass', 'Ceramics', 'Other'];
  const conditions = ['Mint', 'Excellent', 'Good', 'Fair', 'Poor'];

  const filteredCollectionItems = collectionItems.filter(item =>
    item.name.toLowerCase().includes(collectionSearchQuery.toLowerCase()) ||
    item.manufacturer?.toLowerCase().includes(collectionSearchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(collectionSearchQuery.toLowerCase())
  );

  const handleItemPress = async (item: MarketplaceListing) => {
    if (viewMode === 'browse') {
      await supabase
        .from('marketplace_listings')
        .update({ view_count: (item.view_count || 0) + 1 })
        .eq('id', item.id);
    }

    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleEditListing = (item: MarketplaceListing) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      condition: item.condition || 'Good',
      asking_price: item.asking_price?.toString() || '',
      listing_type: item.listing_type,
      photo_url: item.photo_url || '',
      inventory_item_id: item.inventory_item_id || null,
    });
    setShowDetailsModal(false);
    setShowAddModal(true);
  };

  const handleDeleteListing = async (itemId: string) => {
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ listing_status: 'deleted' })
      .eq('id', itemId);

    if (!error) {
      loadMarketplaceItems();
      setShowDetailsModal(false);
    } else {
      Alert.alert('Error', 'Failed to delete listing');
    }
  };

  const handleContactSeller = async (item: MarketplaceListing) => {
    if (!user) return;

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listing_id(*),
        user1:user1_id(*),
        user2:user2_id(*)
      `)
      .eq('listing_id', item.id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle();

    if (existingConversation) {
      setShowDetailsModal(false);
      router.push({
        pathname: '/(tabs)/messages',
        params: { conversationId: existingConversation.id }
      });
    } else {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert([{
          user1_id: user.id,
          user2_id: item.user_id,
          listing_id: item.id,
          last_message_at: new Date().toISOString(),
        }])
        .select(`
          *,
          listing:listing_id(*),
          user1:user1_id(*),
          user2:user2_id(*)
        `)
        .single();

      if (!error && newConversation) {
        setShowDetailsModal(false);
        router.push({
          pathname: '/(tabs)/messages',
          params: { conversationId: newConversation.id }
        });
      } else {
        Alert.alert('Error', 'Failed to start conversation');
      }
    }
  };

  const renderItem = ({ item }: { item: MarketplaceListing }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item)}>
      <View style={styles.cardImage}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}
        {viewMode === 'myListings' && (
          <View style={styles.myListingBadge}>
            <Text style={styles.myListingBadgeText}>Your Listing</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.itemName} numberOfLines={2}>{item.title}</Text>
        {viewMode === 'myListings' && item.view_count !== undefined && (
          <View style={styles.viewCountRow}>
            <View style={styles.viewCountBadge}>
              <Text style={styles.viewCountText}>{item.view_count} views</Text>
            </View>
          </View>
        )}
        {viewMode === 'browse' && item.users_name && (
          <Text style={styles.itemManufacturer}>{item.users_name}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.itemPrice}>
            ${item.asking_price?.toFixed(2) || '0.00'}
          </Text>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCollectionItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={styles.collectionCard}
      onPress={() => handleSelectCollectionItem(item)}
    >
      <View style={styles.collectionCardImage}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.collectionImage} />
        ) : (
          <View style={styles.collectionImagePlaceholder}>
            <Package size={24} color="#cbd5e0" />
          </View>
        )}
      </View>
      <View style={styles.collectionCardContent}>
        <Text style={styles.collectionItemName} numberOfLines={1}>{item.name}</Text>
        {item.manufacturer && (
          <Text style={styles.collectionItemManufacturer} numberOfLines={1}>{item.manufacturer}</Text>
        )}
        <Text style={styles.collectionItemCategory}>{item.category}</Text>
      </View>
      <ChevronRight size={20} color="#a0aec0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exchange</Text>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'browse' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('browse')}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'browse' && styles.viewModeButtonTextActive
              ]}
            >
              Browse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'myListings' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('myListings')}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'myListings' && styles.viewModeButtonTextActive
              ]}
            >
              My Listings
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} {viewMode === 'browse' ? 'available' : 'listed'}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={20} color="#a0aec0" />
          <TextInput
            style={styles.searchText}
            placeholder="Search marketplace..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#38a169" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === item && styles.filterChipActive
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === item && styles.filterChipTextActive
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {viewMode === 'browse' ? 'No items for sale' : 'No listings yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {viewMode === 'browse'
                ? 'Check back later for new listings'
                : 'Tap the + button to create your first listing'}
            </Text>
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
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              setEditingItem(null);
            }} style={styles.closeButton}>
              <X size={24} color="#2d3748" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Listing' : 'Create Listing'}</Text>
            <TouchableOpacity onPress={handleAddListing} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{editingItem ? 'Save' : 'Post'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.sourceSection}>
              <Text style={styles.sourceSectionTitle}>List an item</Text>
              <TouchableOpacity
                style={styles.collectionButton}
                onPress={handleSelectFromCollection}
              >
                <Package size={20} color="#38a169" />
                <Text style={styles.collectionButtonText}>Select from Collection</Text>
                <ChevronRight size={20} color="#38a169" />
              </TouchableOpacity>
              {formData.inventory_item_id && (
                <View style={styles.linkedBadge}>
                  <Text style={styles.linkedBadgeText}>Linked to collection item</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="What are you selling?"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
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
              <Text style={styles.label}>Condition</Text>
              <View style={styles.conditionOptions}>
                {conditions.map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionOption,
                      formData.condition === condition && styles.conditionOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, condition })}
                  >
                    <Text
                      style={[
                        styles.conditionOptionText,
                        formData.condition === condition && styles.conditionOptionTextActive
                      ]}
                    >
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Asking Price</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                keyboardType="decimal-pad"
                value={formData.asking_price}
                onChangeText={(text) => setFormData({ ...formData, asking_price: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Listing Type</Text>
              <View style={styles.typeOptions}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.listing_type === 'sale' && styles.typeOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, listing_type: 'sale' })}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.listing_type === 'sale' && styles.typeOptionTextActive
                    ]}
                  >
                    For Sale
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.listing_type === 'trade' && styles.typeOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, listing_type: 'trade' })}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.listing_type === 'trade' && styles.typeOptionTextActive
                    ]}
                  >
                    For Trade
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <Upload size={20} color="#38a169" />
                <Text style={styles.photoButtonText}>
                  {formData.photo_url ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              {formData.photo_url && (
                <Image source={{ uri: formData.photo_url }} style={styles.photoPreview} />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your item..."
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
        visible={showCollectionPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCollectionPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCollectionPicker(false)} style={styles.closeButton}>
              <X size={24} color="#2d3748" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select from Collection</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.collectionSearchBar}>
            <View style={styles.searchInput}>
              <Search size={20} color="#a0aec0" />
              <TextInput
                style={styles.searchText}
                placeholder="Search your collection..."
                value={collectionSearchQuery}
                onChangeText={setCollectionSearchQuery}
              />
            </View>
          </View>

          <FlatList
            data={filteredCollectionItems}
            renderItem={renderCollectionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.collectionList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Package size={64} color="#cbd5e0" />
                <Text style={styles.emptyStateText}>No items in collection</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add items to your collection first
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      <MarketplaceItemDetailsModal
        item={selectedItem}
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedItem(null);
        }}
        onEdit={handleEditListing}
        onDelete={handleDeleteListing}
        onContactSeller={handleContactSeller}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddModal}
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
    marginBottom: 12,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#38a169',
  },
  viewModeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#718096',
  },
  viewModeButtonTextActive: {
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
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
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#38a169',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  filterChipTextActive: {
    color: '#fff',
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
    position: 'relative',
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
  imagePlaceholderText: {
    fontSize: 14,
    color: '#a0aec0',
  },
  myListingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(56, 161, 105, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  myListingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38a169',
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
  viewCountRow: {
    marginBottom: 8,
  },
  viewCountBadge: {
    backgroundColor: '#f7fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0aec0',
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
    color: '#38a169',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sourceSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sourceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#d4f4e2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#38a169',
  },
  collectionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#38a169',
    marginLeft: 12,
  },
  linkedBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  linkedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
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
  conditionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  conditionOptionActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  conditionOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  conditionOptionTextActive: {
    color: '#0284c7',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#d4f4e2',
    borderColor: '#38a169',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  typeOptionTextActive: {
    color: '#38a169',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  collectionSearchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  collectionList: {
    padding: 16,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  collectionCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionCardContent: {
    flex: 1,
  },
  collectionItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  collectionItemManufacturer: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  collectionItemCategory: {
    fontSize: 12,
    color: '#a0aec0',
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
    backgroundColor: '#38a169',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
