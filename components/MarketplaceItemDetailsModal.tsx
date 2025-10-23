import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { X, MessageSquare, Edit, Trash2, Calendar, DollarSign, Tag, User, Eye } from 'lucide-react-native';
import { MarketplaceListing } from '@/types/database';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MarketplaceItemDetailsModalProps {
  item: MarketplaceListing | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (item: MarketplaceListing) => void;
  onDelete?: (itemId: string) => void;
  onContactSeller?: (item: MarketplaceListing) => void;
}

export function MarketplaceItemDetailsModal({
  item,
  visible,
  onClose,
  onEdit,
  onDelete,
  onContactSeller
}: MarketplaceItemDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isOwnListing = user && item && item.user_id === user.id;

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item && onDelete) {
              onDelete(item.id);
              onClose();
            }
          },
        },
      ]
    );
  };

  const handleContactSeller = async () => {
    if (!item || !user || !onContactSeller) return;

    setLoading(true);
    onContactSeller(item);
    setLoading(false);
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
          <Text style={styles.headerTitle}>Listing Details</Text>
          <View style={styles.closeButton} />
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
                {item.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
                <View style={[
                  styles.typeBadge,
                  item.listing_type === 'trade' && styles.tradeBadge
                ]}>
                  <Text style={[
                    styles.typeText,
                    item.listing_type === 'trade' && styles.tradeText
                  ]}>
                    {item.listing_type === 'sale' ? 'For Sale' : 'For Trade'}
                  </Text>
                </View>
                {item.subcategory && (
                  <View style={styles.subcategoryBadge}>
                    <Text style={styles.subcategoryText}>{item.subcategory}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.itemName}>{item.title}</Text>
            {item.asking_price && item.listing_type === 'sale' && (
              <Text style={styles.itemPrice}>${item.asking_price.toFixed(2)}</Text>
            )}
          </View>

          {item.condition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condition</Text>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
            </View>
          )}

          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {item.trade_preferences && item.listing_type === 'trade' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trade Preferences</Text>
              <Text style={styles.description}>{item.trade_preferences}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <User size={24} color="#38a169" />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {item.users_name || 'Anonymous Seller'}
                </Text>
                {isOwnListing && (
                  <View style={styles.ownListingBadge}>
                    <Text style={styles.ownListingText}>Your Listing</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listing Details</Text>
            <View style={styles.metadataGrid}>
              <View style={styles.infoRow}>
                <Calendar size={16} color="#718096" />
                <Text style={styles.infoLabel}>Posted:</Text>
                <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
              </View>
              {item.view_count !== undefined && (
                <View style={styles.infoRow}>
                  <Eye size={16} color="#718096" />
                  <Text style={styles.infoLabel}>Views:</Text>
                  <Text style={styles.infoValue}>{item.view_count}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Tag size={16} color="#718096" />
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>
                  {item.listing_status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          {isOwnListing ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit && onEdit(item)}
              >
                <Edit size={20} color="#718096" />
                <Text style={styles.actionButtonText}>Edit Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="#e53e3e" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  Delete Listing
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactSeller}
                disabled={loading}
              >
                <MessageSquare size={20} color="#fff" />
                <Text style={styles.contactButtonText}>
                  {loading ? 'Loading...' : 'Contact Seller'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
    marginBottom: 12,
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
  typeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tradeBadge: {
    backgroundColor: '#fef3c7',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  tradeText: {
    color: '#d97706',
  },
  subcategoryBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  itemName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: 36,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#38a169',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  conditionBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
  },
  description: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d4f4e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  ownListingBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ownListingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  metadataGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#38a169',
    borderRadius: 12,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 40,
  },
});
