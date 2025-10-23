import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X, Search } from 'lucide-react-native';

export interface AdvancedSearchFilters {
  searchText: string;
  manufacturer: string;
  pattern: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  valueFrom: string;
  valueTo: string;
  purchaseDateFrom: string;
  purchaseDateTo: string;
  location: string;
  quantityFrom: string;
  quantityTo: string;
}

interface AdvancedSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedSearchFilters) => void;
  initialFilters: AdvancedSearchFilters;
}

export function AdvancedSearchModal({ visible, onClose, onApply, initialFilters }: AdvancedSearchModalProps) {
  const [searchText, setSearchText] = useState(initialFilters.searchText);
  const [manufacturer, setManufacturer] = useState(initialFilters.manufacturer);
  const [pattern, setPattern] = useState(initialFilters.pattern);
  const [yearFrom, setYearFrom] = useState(initialFilters.yearFrom);
  const [yearTo, setYearTo] = useState(initialFilters.yearTo);
  const [priceFrom, setPriceFrom] = useState(initialFilters.priceFrom);
  const [priceTo, setPriceTo] = useState(initialFilters.priceTo);
  const [valueFrom, setValueFrom] = useState(initialFilters.valueFrom);
  const [valueTo, setValueTo] = useState(initialFilters.valueTo);
  const [purchaseDateFrom, setPurchaseDateFrom] = useState(initialFilters.purchaseDateFrom);
  const [purchaseDateTo, setPurchaseDateTo] = useState(initialFilters.purchaseDateTo);
  const [location, setLocation] = useState(initialFilters.location);
  const [quantityFrom, setQuantityFrom] = useState(initialFilters.quantityFrom);
  const [quantityTo, setQuantityTo] = useState(initialFilters.quantityTo);

  useEffect(() => {
    if (visible) {
      setSearchText(initialFilters.searchText);
      setManufacturer(initialFilters.manufacturer);
      setPattern(initialFilters.pattern);
      setYearFrom(initialFilters.yearFrom);
      setYearTo(initialFilters.yearTo);
      setPriceFrom(initialFilters.priceFrom);
      setPriceTo(initialFilters.priceTo);
      setValueFrom(initialFilters.valueFrom);
      setValueTo(initialFilters.valueTo);
      setPurchaseDateFrom(initialFilters.purchaseDateFrom);
      setPurchaseDateTo(initialFilters.purchaseDateTo);
      setLocation(initialFilters.location);
      setQuantityFrom(initialFilters.quantityFrom);
      setQuantityTo(initialFilters.quantityTo);
    }
  }, [visible, initialFilters]);

  const handleClear = () => {
    setSearchText('');
    setManufacturer('');
    setPattern('');
    setYearFrom('');
    setYearTo('');
    setPriceFrom('');
    setPriceTo('');
    setValueFrom('');
    setValueTo('');
    setPurchaseDateFrom('');
    setPurchaseDateTo('');
    setLocation('');
    setQuantityFrom('');
    setQuantityTo('');
  };

  const handleApply = () => {
    onApply({
      searchText,
      manufacturer,
      pattern,
      yearFrom,
      yearTo,
      priceFrom,
      priceTo,
      valueFrom,
      valueTo,
      purchaseDateFrom,
      purchaseDateTo,
      location,
      quantityFrom,
      quantityTo,
    });
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
          <Text style={styles.headerTitle}>Advanced Search</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>General Search</Text>
          <Text style={styles.label}>Search Text</Text>
          <View style={styles.searchInput}>
            <Search size={20} color="#a0aec0" />
            <TextInput
              style={styles.searchTextInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search name, manufacturer, description..."
              placeholderTextColor="#a0aec0"
            />
          </View>

          <Text style={styles.sectionTitle}>Item Details</Text>
          <Text style={styles.label}>Manufacturer</Text>
          <TextInput
            style={styles.input}
            value={manufacturer}
            onChangeText={setManufacturer}
            placeholder="e.g., Fire-King, Anchor Hocking"
            placeholderTextColor="#a0aec0"
          />

          <Text style={styles.label}>Pattern</Text>
          <TextInput
            style={styles.input}
            value={pattern}
            onChangeText={setPattern}
            placeholder="e.g., Jadeite, Swirl"
            placeholderTextColor="#a0aec0"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Display cabinet"
            placeholderTextColor="#a0aec0"
          />

          <Text style={styles.sectionTitle}>Year Manufactured</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>From</Text>
              <TextInput
                style={styles.input}
                value={yearFrom}
                onChangeText={setYearFrom}
                placeholder="e.g., 1940"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>To</Text>
              <TextInput
                style={styles.input}
                value={yearTo}
                onChangeText={setYearTo}
                placeholder="e.g., 1960"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Purchase Price ($)</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>From</Text>
              <TextInput
                style={styles.input}
                value={priceFrom}
                onChangeText={setPriceFrom}
                placeholder="Min price"
                placeholderTextColor="#a0aec0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>To</Text>
              <TextInput
                style={styles.input}
                value={priceTo}
                onChangeText={setPriceTo}
                placeholder="Max price"
                placeholderTextColor="#a0aec0"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Current Value ($)</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>From</Text>
              <TextInput
                style={styles.input}
                value={valueFrom}
                onChangeText={setValueFrom}
                placeholder="Min value"
                placeholderTextColor="#a0aec0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>To</Text>
              <TextInput
                style={styles.input}
                value={valueTo}
                onChangeText={setValueTo}
                placeholder="Max value"
                placeholderTextColor="#a0aec0"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Purchase Date</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>From</Text>
              <TextInput
                style={styles.input}
                value={purchaseDateFrom}
                onChangeText={setPurchaseDateFrom}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#a0aec0"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>To</Text>
              <TextInput
                style={styles.input}
                value={purchaseDateTo}
                onChangeText={setPurchaseDateTo}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#a0aec0"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>From</Text>
              <TextInput
                style={styles.input}
                value={quantityFrom}
                onChangeText={setQuantityFrom}
                placeholder="Min qty"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>To</Text>
              <TextInput
                style={styles.input}
                value={quantityTo}
                onChangeText={setQuantityTo}
                placeholder="Max qty"
                placeholderTextColor="#a0aec0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.applyButton]} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    marginTop: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  applyButton: {
    backgroundColor: '#38a169',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 40,
  },
});
