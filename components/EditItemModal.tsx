import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { X, Upload, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem } from '@/types/database';

interface EditItemModalProps {
  item: InventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface CustomField {
  id: string;
  field_name: string;
}

export function EditItemModal({ item, visible, onClose, onSave }: EditItemModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [pattern, setPattern] = useState('');
  const [yearManufactured, setYearManufactured] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [condition, setCondition] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [categories, setCategories] = useState<CustomField[]>([]);
  const [subcategories, setSubcategories] = useState<CustomField[]>([]);
  const [conditions, setConditions] = useState<CustomField[]>([]);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    if (visible) {
      if (item) {
        setName(item.name || '');
        setCategory(item.category || '');
        setSubcategory(item.subcategory || '');
        setManufacturer(item.manufacturer || '');
        setPattern(item.pattern || '');
        setYearManufactured(item.year_manufactured?.toString() || '');
        setPurchasePrice(item.purchase_price?.toString() || '');
        setPurchaseDate(item.purchase_date || '');
        setCurrentValue(item.current_value?.toString() || '');
        setCondition(item.condition || '');
        setQuantity(item.quantity?.toString() || '1');
        setLocation(item.location || '');
        setDescription(item.description || '');
        setPhotoUrl(item.photo_url || '');
      } else {
        setName('');
        setCategory('');
        setSubcategory('');
        setManufacturer('');
        setPattern('');
        setYearManufactured('');
        setPurchasePrice('');
        setPurchaseDate('');
        setCurrentValue('');
        setCondition('');
        setQuantity('1');
        setLocation('');
        setDescription('');
        setPhotoUrl('');
      }
    }
  }, [item, visible]);

  useEffect(() => {
    if (user && visible) {
      loadCustomFields();
    }
  }, [user, visible]);

  const loadCustomFields = async () => {
    if (!user) return;

    const { data: fields, error } = await supabase
      .from('user_custom_fields')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('field_name');

    if (!error && fields) {
      setCategories(fields.filter(f => f.field_type === 'category'));
      setSubcategories(fields.filter(f => f.field_type === 'subcategory'));
      setConditions(fields.filter(f => f.field_type === 'condition'));
    }
  };

  const addCustomField = async (fieldType: string, fieldName: string) => {
    if (!user || !fieldName.trim()) return;

    const { error } = await supabase
      .from('user_custom_fields')
      .insert({
        user_id: user.id,
        field_type: fieldType,
        field_name: fieldName.trim(),
      });

    if (!error) {
      await loadCustomFields();

      if (fieldType === 'category') {
        setCategory(fieldName.trim());
        setNewCategory('');
        setShowCategoryDropdown(false);
      } else if (fieldType === 'subcategory') {
        setSubcategory(fieldName.trim());
        setNewSubcategory('');
        setShowSubcategoryDropdown(false);
      } else if (fieldType === 'condition') {
        setCondition(fieldName.trim());
        setNewCondition('');
        setShowConditionDropdown(false);
      }
    }
  };

  const deleteCustomField = async (fieldId: string, fieldType: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_custom_fields')
      .delete()
      .eq('id', fieldId)
      .eq('user_id', user.id);

    if (!error) {
      await loadCustomFields();
      Alert.alert('Success', 'Field deleted successfully');
    } else {
      Alert.alert('Error', 'Failed to delete field');
    }
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
          <Trash2 size={20} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  const handleSwipeOpen = (fieldId: string, fieldName: string, fieldType: string) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${fieldName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomField(fieldId, fieldType),
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setPhotoUrl('');
  };

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!category.trim()) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);

    const itemData = {
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory.trim() || null,
      manufacturer: manufacturer.trim() || null,
      pattern: pattern.trim() || null,
      year_manufactured: yearManufactured ? parseInt(yearManufactured) : null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_date: purchaseDate || null,
      current_value: currentValue ? parseFloat(currentValue) : null,
      condition: condition.trim() || null,
      quantity: quantity ? parseInt(quantity) : 1,
      location: location.trim() || null,
      description: description.trim() || null,
      photo_url: photoUrl || null,
    };

    let error;

    if (item) {
      const result = await supabase
        .from('inventory_items')
        .update({
          ...itemData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('inventory_items')
        .insert([{
          ...itemData,
          user_id: user.id,
        }]);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      Alert.alert('Error', item ? 'Failed to update item' : 'Failed to create item');
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
          <Text style={styles.headerTitle}>{item ? 'Edit Item' : 'Add Item'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Photo</Text>
          <View style={styles.photoSection}>
            {photoUrl ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUrl }} style={styles.photo} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Upload size={18} color="#38a169" />
              <Text style={styles.uploadButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter item name"
                placeholderTextColor="#a0aec0"
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowSubcategoryDropdown(false);
                  setShowConditionDropdown(false);
                }}
              >
                <Text style={category ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {category || 'Select category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {categories.map((cat) => (
                  <Swipeable
                    key={cat.id}
                    renderRightActions={renderRightActions}
                    onSwipeableOpen={() => handleSwipeOpen(cat.id, cat.field_name, 'category')}
                    overshootRight={false}
                    friction={2}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategory(cat.field_name);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{cat.field_name}</Text>
                    </TouchableOpacity>
                  </Swipeable>
                ))}
              </ScrollView>
              <View style={styles.addNewSection}>
                <TextInput
                  style={styles.addNewInput}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Add new category"
                  placeholderTextColor="#a0aec0"
                />
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => addCustomField('category', newCategory)}
                >
                  <Text style={styles.addNewButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.label}>Subcategory</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setShowSubcategoryDropdown(!showSubcategoryDropdown);
              setShowCategoryDropdown(false);
              setShowConditionDropdown(false);
            }}
          >
            <Text style={subcategory ? styles.dropdownText : styles.dropdownPlaceholder}>
              {subcategory || 'Select a subcategory'}
            </Text>
          </TouchableOpacity>

          {showSubcategoryDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {subcategories.map((sub) => (
                  <Swipeable
                    key={sub.id}
                    renderRightActions={renderRightActions}
                    onSwipeableOpen={() => handleSwipeOpen(sub.id, sub.field_name, 'subcategory')}
                    overshootRight={false}
                    friction={2}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSubcategory(sub.field_name);
                        setShowSubcategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{sub.field_name}</Text>
                    </TouchableOpacity>
                  </Swipeable>
                ))}
              </ScrollView>
              <View style={styles.addNewSection}>
                <TextInput
                  style={styles.addNewInput}
                  value={newSubcategory}
                  onChangeText={setNewSubcategory}
                  placeholder="Add new subcategory"
                  placeholderTextColor="#a0aec0"
                />
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => addCustomField('subcategory', newSubcategory)}
                >
                  <Text style={styles.addNewButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Manufacturer</Text>
              <TextInput
                style={styles.input}
                value={manufacturer}
                onChangeText={setManufacturer}
                placeholder="e.g., Anchor Hocking, Fire-King"
                placeholderTextColor="#a0aec0"
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Pattern</Text>
              <TextInput
                style={styles.input}
                value={pattern}
                onChangeText={setPattern}
                placeholder="Pattern name"
                placeholderTextColor="#a0aec0"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.thirdField}>
              <Text style={styles.label}>Year Manufactured</Text>
              <TextInput
                style={styles.input}
                value={yearManufactured}
                onChangeText={setYearManufactured}
                placeholder="e.g., 1950"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.thirdField}>
              <Text style={styles.label}>Purchase Price ($)</Text>
              <TextInput
                style={styles.input}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="Enter price"
                placeholderTextColor="#a0aec0"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.thirdField}>
              <Text style={styles.label}>Purchase Date</Text>
              <TextInput
                style={styles.input}
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#a0aec0"
              />
            </View>
          </View>

          <Text style={styles.label}>Current Value ($)</Text>
          <TextInput
            style={styles.input}
            value={currentValue}
            onChangeText={setCurrentValue}
            placeholder="Enter value"
            placeholderTextColor="#a0aec0"
            keyboardType="decimal-pad"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Condition</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowConditionDropdown(!showConditionDropdown);
                  setShowCategoryDropdown(false);
                  setShowSubcategoryDropdown(false);
                }}
              >
                <Text style={condition ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {condition || 'Select condition'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
              />
            </View>
          </View>

          {showConditionDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {conditions.map((cond) => (
                  <Swipeable
                    key={cond.id}
                    renderRightActions={renderRightActions}
                    onSwipeableOpen={() => handleSwipeOpen(cond.id, cond.field_name, 'condition')}
                    overshootRight={false}
                    friction={2}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCondition(cond.field_name);
                        setShowConditionDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{cond.field_name}</Text>
                    </TouchableOpacity>
                  </Swipeable>
                ))}
              </ScrollView>
              <View style={styles.addNewSection}>
                <TextInput
                  style={styles.addNewInput}
                  value={newCondition}
                  onChangeText={setNewCondition}
                  placeholder="Add new condition"
                  placeholderTextColor="#a0aec0"
                />
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => addCustomField('condition', newCondition)}
                >
                  <Text style={styles.addNewButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Display cabinet, Storage room"
            placeholderTextColor="#a0aec0"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter item description..."
            placeholderTextColor="#a0aec0"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Updating...' : 'Update Item'}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    marginTop: 16,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#38a169',
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38a169',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#2d3748',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#a0aec0',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#2d3748',
  },
  addNewSection: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addNewInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2d3748',
  },
  addNewButton: {
    backgroundColor: '#38a169',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  saveButton: {
    backgroundColor: '#38a169',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 40,
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  deleteAction: {
    backgroundColor: '#e53e3e',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});
