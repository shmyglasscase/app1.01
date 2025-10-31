import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, RefreshControl, Share, Alert, Platform } from 'react-native';
import { Search, Filter, Star, X, SlidersHorizontal, Calendar, MapPin, Package, Plus, Check, Share2, Trash2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem } from '@/types/database';
import { ItemDetailsModal } from '@/components/ItemDetailsModal';
import { EditItemModal } from '@/components/EditItemModal';
import { AdvancedSearchModal, AdvancedSearchFilters } from '@/components/AdvancedSearchModal';

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
}

const emptyFilters: AdvancedSearchFilters = {
  searchText: '',
  manufacturer: '',
  pattern: '',
  yearFrom: '',
  yearTo: '',
  priceFrom: '',
  priceTo: '',
  valueFrom: '',
  valueTo: '',
  purchaseDateFrom: '',
  purchaseDateTo: '',
  location: '',
  quantityFrom: '',
  quantityTo: '',
};

export default function CollectionScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>(emptyFilters);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadItems();
    loadCustomFields();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, selectedSubcategory, advancedFilters]);

  const loadItems = async () => {
    if (!user) {
      console.log('Collection: No user found');
      return;
    }

    console.log('Collection: Loading items for user:', user.id);

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Collection: Error loading items:', error);
      return;
    }

    console.log('Collection: Items loaded:', data?.length || 0);

    if (data) {
      setItems(data);
    }
  };

  const loadCustomFields = async () => {
    if (!user) return;

    const { data: fields, error } = await supabase
      .from('user_custom_fields')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('field_name');

    if (!error && fields) {
      const cats = fields
        .filter((f: CustomField) => f.field_type === 'category')
        .map((f: CustomField) => f.field_name);
      const subs = fields
        .filter((f: CustomField) => f.field_type === 'subcategory')
        .map((f: CustomField) => f.field_name);

      setCategories(['All', ...cats]);
      setSubcategories(['All', ...subs]);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter(item => item.subcategory === selectedSubcategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.manufacturer?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.pattern?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.condition?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.subcategory?.toLowerCase().includes(query) ||
        item.year_manufactured?.toString().includes(query) ||
        item.purchase_price?.toString().includes(query) ||
        item.current_value?.toString().includes(query) ||
        item.quantity?.toString().includes(query) ||
        item.purchase_date?.toLowerCase().includes(query)
      );
    }

    if (advancedFilters.searchText) {
      const query = advancedFilters.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.manufacturer?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.pattern?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.condition?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.subcategory?.toLowerCase().includes(query) ||
        item.year_manufactured?.toString().includes(query) ||
        item.purchase_price?.toString().includes(query) ||
        item.current_value?.toString().includes(query) ||
        item.quantity?.toString().includes(query) ||
        item.purchase_date?.toLowerCase().includes(query)
      );
    }

    if (advancedFilters.manufacturer) {
      filtered = filtered.filter(item =>
        item.manufacturer?.toLowerCase().includes(advancedFilters.manufacturer.toLowerCase())
      );
    }

    if (advancedFilters.pattern) {
      filtered = filtered.filter(item =>
        item.pattern?.toLowerCase().includes(advancedFilters.pattern.toLowerCase())
      );
    }

    if (advancedFilters.location) {
      filtered = filtered.filter(item =>
        item.location?.toLowerCase().includes(advancedFilters.location.toLowerCase())
      );
    }

    if (advancedFilters.yearFrom) {
      const yearFrom = parseInt(advancedFilters.yearFrom);
      filtered = filtered.filter(item => item.year_manufactured && item.year_manufactured >= yearFrom);
    }

    if (advancedFilters.yearTo) {
      const yearTo = parseInt(advancedFilters.yearTo);
      filtered = filtered.filter(item => item.year_manufactured && item.year_manufactured <= yearTo);
    }

    if (advancedFilters.priceFrom) {
      const priceFrom = parseFloat(advancedFilters.priceFrom);
      filtered = filtered.filter(item => item.purchase_price && item.purchase_price >= priceFrom);
    }

    if (advancedFilters.priceTo) {
      const priceTo = parseFloat(advancedFilters.priceTo);
      filtered = filtered.filter(item => item.purchase_price && item.purchase_price <= priceTo);
    }

    if (advancedFilters.valueFrom) {
      const valueFrom = parseFloat(advancedFilters.valueFrom);
      filtered = filtered.filter(item => item.current_value && item.current_value >= valueFrom);
    }

    if (advancedFilters.valueTo) {
      const valueTo = parseFloat(advancedFilters.valueTo);
      filtered = filtered.filter(item => item.current_value && item.current_value <= valueTo);
    }

    if (advancedFilters.quantityFrom) {
      const qtyFrom = parseInt(advancedFilters.quantityFrom);
      filtered = filtered.filter(item => item.quantity && item.quantity >= qtyFrom);
    }

    if (advancedFilters.quantityTo) {
      const qtyTo = parseInt(advancedFilters.quantityTo);
      filtered = filtered.filter(item => item.quantity && item.quantity <= qtyTo);
    }

    setFilteredItems(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    await loadCustomFields();
    setRefreshing(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    await supabase.from('inventory_items').delete().eq('id', itemId);
    loadItems();
  };

  const handleLongPress = (itemId: string) => {
    setSelectionMode(true);
    setSelectedItems(new Set([itemId]));
  };

  const handleItemPress = (item: InventoryItem) => {
    if (selectionMode) {
      toggleItemSelection(item.id);
    } else {
      setSelectedItem(item);
      setShowItemModal(true);
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
              .from('inventory_items')
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

    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select items to share');
      return;
    }

    const itemIds = Array.from(selectedItems);
    const { data, error } = await supabase
      .from('shared_collections')
      .insert([{
        user_id: user.id,
        collection_type: 'collection',
        item_ids: itemIds,
        expires_at: null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating share:', error);
      Alert.alert('Error', 'Failed to create shareable link');
      return;
    }

    if (data) {
      const shareUrl = `https://site.myglasscase.com/shared/${data.share_token}`;

      // Use clipboard for web, native share for mobile
      if (Platform.OS === 'web') {
        try {
          await Clipboard.setStringAsync(shareUrl);
          Alert.alert(
            'Link Copied!', 
            `Share link has been copied to clipboard!\n\n${shareUrl}`,
            [{ 
              text: 'OK',
              onPress: () => {
                setSelectedItems(new Set());
                setSelectionMode(false);
              }
            }]
          );
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
          Alert.alert(
            'Share Link', 
            shareUrl,
            [{ 
              text: 'OK',
              onPress: () => {
                setSelectedItems(new Set());
                setSelectionMode(false);
              }
            }]
          );
        }
      } else {
        // Mobile: use native share
        try {
          const result = await Share.share({
            message: `Check out my collection! I'm sharing ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} with you: ${shareUrl}`,
            title: 'Share Collection Items',
          });

          if (result.action === Share.sharedAction) {
            Alert.alert('Success', 'Items shared successfully!');
            setSelectedItems(new Set());
            setSelectionMode(false);
          }
        } catch (shareError) {
          console.error('Error sharing:', shareError);
          Alert.alert('Error', 'Failed to share items');
        }
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setSearchQuery('');
    setAdvancedFilters(emptyFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubcategory !== 'All') count++;
    if (Object.values(advancedFilters).some(v => v !== '')) count++;
    return count;
  }, [selectedCategory, selectedSubcategory, advancedFilters]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const profit = (item.current_value || 0) - (item.purchase_price || 0);
    const hasProfitData = item.current_value !== null && item.purchase_price !== null;
    const isSelected = selectedItems.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
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
        <View style={styles.cardImage}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
          {item.favorites === 1 && (
            <View style={styles.favoriteBadge}>
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
            </View>
          )}
          {item.quantity && item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Package size={12} color="#fff" />
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            {item.subcategory && (
              <View style={styles.subcategoryTag}>
                <Text style={styles.subcategoryText}>{item.subcategory}</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          {item.manufacturer && (
            <Text style={styles.itemManufacturer} numberOfLines={1}>{item.manufacturer}</Text>
          )}
          <View style={styles.cardMeta}>
            {item.purchase_date && (
              <View style={styles.metaItem}>
                <Calendar size={12} color="#a0aec0" />
                <Text style={styles.metaText}>{formatDate(item.purchase_date)}</Text>
              </View>
            )}
            {item.location && (
              <View style={styles.metaItem}>
                <MapPin size={12} color="#a0aec0" />
                <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.itemValue}>
                ${item.current_value?.toFixed(2) || '0.00'}
              </Text>
              {hasProfitData && (
                <Text style={[styles.profitText, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                  {`${profit >= 0 ? '+' : ''}${profit.toFixed(2)}`}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Collection</Text>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          {items.length !== filteredItems.length && ` of ${items.length}`}
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
              placeholder="Search items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.iconButton, showFilters && styles.iconButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={showFilters ? "#fff" : "#38a169"} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowAdvancedSearch(true)}
          >
            <SlidersHorizontal size={20} color="#38a169" />
          </TouchableOpacity>
        </View>
      )}

      {showFilters && (
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.filterLabel}>Category</Text>
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

          <Text style={styles.filterLabel}>Subcategory</Text>
          <FlatList
            horizontal
            data={subcategories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedSubcategory === item && styles.filterChipActive
                ]}
                onPress={() => setSelectedSubcategory(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSubcategory === item && styles.filterChipTextActive
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
              {activeFilterCount > 0 ? 'No items match your filters' : 'No items in your collection'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeFilterCount > 0
                ? 'Try adjusting your search criteria'
                : 'Tap the + button to add your first item'}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ItemDetailsModal
        item={selectedItem}
        visible={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
        }}
        onEdit={(item) => {
          setShowItemModal(false);
          setSelectedItem(item);
          setShowEditModal(true);
        }}
        onDelete={handleDeleteItem}
        onFavoriteChange={loadItems}
      />

      <EditItemModal
        item={selectedItem}
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSave={() => {
          setShowEditModal(false);
          setSelectedItem(null);
          loadItems();
        }}
      />

      <AdvancedSearchModal
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApply={setAdvancedFilters}
        initialFilters={advancedFilters}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setSelectedItem(null);
          setShowEditModal(true);
        }}
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
  iconButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonActive: {
    backgroundColor: '#38a169',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 12,
    marginBottom: 8,
  },
  filterList: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#38a169',
    borderColor: '#38a169',
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
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2d3748',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    padding: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#d4f4e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38a169',
  },
  subcategoryTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subcategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  itemManufacturer: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 6,
  },
  cardMeta: {
    gap: 4,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#a0aec0',
    flex: 1,
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
  profitText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  profitPositive: {
    color: '#38a169',
  },
  profitNegative: {
    color: '#e53e3e',
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#38a169',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
    borderColor: '#38a169',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    backgroundColor: '#38a169',
    borderColor: '#38a169',
  },
});