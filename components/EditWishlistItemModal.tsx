import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { X, Upload, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { WishlistItem } from '@/types/database';

interface EditWishlistItemModalProps {
  item: WishlistItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditWishlistItemModal({ item, visible, onClose, onSave }: EditWishlistItemModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    manufacturer: '',
    pattern: '',
    desired_price_max: '',
    description: '',
    photo_url: '',
  });

  useEffect(() => {
    if (visible && item) {
      setFormData({
        item_name: item.item_name || '',
        category: item.category || '',
        manufacturer: item.manufacturer || '',
        pattern: item.pattern || '',
        desired_price_max: item.desired_price_max?.toString() || '',
        description: item.description || '',
        photo_url: item.photo_url || '',
      });
    }
  }, [item, visible]);

  const pickImage = async () => {
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

  const removeImage = () => {
    setFormData({ ...formData, photo_url: '' });
  };

  const handleSave = async () => {
    if (!user || !item) return;

    if (!formData.item_name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('wishlist_items')
      .update({
        item_name: formData.item_name.trim(),
        category: formData.category.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        pattern: formData.pattern.trim() || null,
        desired_price_max: formData.desired_price_max ? parseFloat(formData.desired_price_max) : null,
        description: formData.description.trim() || null,
        photo_url: formData.photo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update wishlist item');
      return;
    }

    onSave();
    onClose();
  };

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
          <Text style={styles.headerTitle}>Edit Wishlist Item</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.label}>Photo</Text>
            {formData.photo_url ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: formData.photo_url }} style={styles.image} />
                <View style={styles.imageActions}>
                  <TouchableOpacity onPress={pickImage} style={styles.imageActionButton}>
                    <Upload size={20} color="#38a169" />
                    <Text style={styles.imageActionText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={removeImage} style={styles.imageActionButton}>
                    <Trash2 size={20} color="#e53e3e" />
                    <Text style={[styles.imageActionText, styles.imageActionTextDanger]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
                <Upload size={24} color="#a0aec0" />
                <Text style={styles.uploadButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
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
              textAlignVertical="top"
            />
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
  content: {
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
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    gap: 6,
  },
  imageActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  imageActionTextDanger: {
    color: '#e53e3e',
  },
  uploadButton: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 8,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});
