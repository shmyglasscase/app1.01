import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { X, Star, TrendingUp, Edit, Trash2, Calendar, Package, MapPin, DollarSign, Tag, Layers } from 'lucide-react-native';
import { InventoryItem } from '@/types/database';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MarketAnalysisSection } from './MarketAnalysisSection';

interface ItemDetailsModalProps {
  item: InventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
  onFavoriteChange?: () => void;
}

export function ItemDetailsModal({ item, visible, onClose, onEdit, onDelete, onFavoriteChange }: ItemDetailsModalProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (item) {
      setIsFavorited(item.favorites === 1);
    }
  }, [item]);

  const toggleFavorite = async () => {
    if (!item) return;

    const newValue = isFavorited ? 0 : 1;
    const { error } = await supabase
      .from('inventory_items')
      .update({ favorites: newValue })
      .eq('id', item.id);

    if (!error) {
      setIsFavorited(newValue === 1);
      if (onFavoriteChange) {
        onFavoriteChange();
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (item) {
              onDelete(item.id);
              onClose();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!item) return null;

  const profit = (item.current_value || 0) - (item.purchase_price || 0);
  const hasProfitData = item.current_value !== null && item.purchase_price !== null;
  const profitPercentage = item.purchase_price && item.purchase_price > 0
    ? ((profit / item.purchase_price) * 100).toFixed(1)
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Star
              size={24}
              color={isFavorited ? '#fbbf24' : '#cbd5e0'}
              fill={isFavorited ? '#fbbf24' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.titleRow}>
              <View style={styles.badges}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                {item.subcategory && (
                  <View style={styles.subcategoryBadge}>
                    <Text style={styles.subcategoryText}>{item.subcategory}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>

          {(item.manufacturer || item.pattern || item.year_manufactured) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identification</Text>
              <View style={styles.detailsGrid}>
                {item.manufacturer && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Manufacturer</Text>
                    <Text style={styles.detailValue}>{item.manufacturer}</Text>
                  </View>
                )}
                {item.pattern && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Pattern</Text>
                    <Text style={styles.detailValue}>{item.pattern}</Text>
                  </View>
                )}
                {item.year_manufactured && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Year Manufactured</Text>
                    <Text style={styles.detailValue}>{item.year_manufactured}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Information</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <DollarSign size={20} color="#38a169" />
                <Text style={styles.statLabel}>Current Value</Text>
                <Text style={styles.statValue}>${item.current_value?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.statBox}>
                <DollarSign size={20} color="#718096" />
                <Text style={styles.statLabel}>Purchase Price</Text>
                <Text style={styles.statValue}>${item.purchase_price?.toFixed(2) || '0.00'}</Text>
              </View>
              {hasProfitData && (
                <>
                  <View style={styles.statBox}>
                    <TrendingUp size={20} color={profit >= 0 ? '#38a169' : '#e53e3e'} />
                    <Text style={styles.statLabel}>Profit/Loss</Text>
                    <Text style={[styles.statValue, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                      {profit >= 0 ? '+' : ''}${Math.abs(profit).toFixed(2)}
                    </Text>
                  </View>
                  {profitPercentage !== null && (
                    <View style={styles.statBox}>
                      <Tag size={20} color={profit >= 0 ? '#38a169' : '#e53e3e'} />
                      <Text style={styles.statLabel}>Return</Text>
                      <Text style={[styles.statValue, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                        {profit >= 0 ? '+' : ''}{profitPercentage}%
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
            {item.purchase_date && (
              <View style={styles.infoRow}>
                <Calendar size={16} color="#718096" />
                <Text style={styles.infoLabel}>Purchased:</Text>
                <Text style={styles.infoValue}>{formatDate(item.purchase_date)}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <MarketAnalysisSection inventoryItemId={item.id} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Details</Text>
            <View style={styles.detailsGrid}>
              {item.quantity && (
                <View style={styles.infoRow}>
                  <Package size={16} color="#718096" />
                  <Text style={styles.infoLabel}>Quantity:</Text>
                  <Text style={styles.infoValue}>{item.quantity}</Text>
                </View>
              )}
              {item.condition && (
                <View style={styles.infoRow}>
                  <Layers size={16} color="#718096" />
                  <Text style={styles.infoLabel}>Condition:</Text>
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionText}>{item.condition}</Text>
                  </View>
                </View>
              )}
              {item.location && (
                <View style={styles.infoRow}>
                  <MapPin size={16} color="#718096" />
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoValue}>{item.location}</Text>
                </View>
              )}
            </View>
          </View>

          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {item.ai_identified && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Analysis</Text>
              <View style={styles.aiInfo}>
                <Text style={styles.aiText}>This item was identified using AI technology</Text>
                {item.ai_confidence && (
                  <Text style={styles.aiConfidence}>
                    Confidence: {(item.ai_confidence * 100).toFixed(0)}%
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metadata</Text>
            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Added</Text>
                <Text style={styles.metadataValue}>{formatDateTime(item.created_at)}</Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Last Updated</Text>
                <Text style={styles.metadataValue}>{formatDateTime(item.updated_at)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(item)}
            >
              <Edit size={20} color="#718096" />
              <Text style={styles.actionButtonText}>Edit Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#e53e3e" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Delete Item
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
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
  imagePlaceholderText: {
    fontSize: 16,
    color: '#a0aec0',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleRow: {
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#d4f4e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  subcategoryBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  itemName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: 36,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
  },
  profitPositive: {
    color: '#38a169',
  },
  profitNegative: {
    color: '#e53e3e',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  infoValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
  },
  conditionBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  description: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  aiInfo: {
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  aiText: {
    fontSize: 14,
    color: '#5b21b6',
    marginBottom: 4,
  },
  aiConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  metadataGrid: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actions: {
    padding: 20,
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
});
