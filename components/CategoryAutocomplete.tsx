import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Keyboard } from 'react-native';
import { useCategorySuggestions } from '@/hooks/usePopularCategories';
import { TrendingUp } from 'lucide-react-native';

interface CategoryAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'category' | 'subcategory';
  label?: string;
}

export function CategoryAutocomplete({
  value,
  onChangeText,
  placeholder = 'e.g., Jadeite, Pottery, Glass',
  type = 'category',
  label = 'Category',
}: CategoryAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useCategorySuggestions(value, type);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isFocused && value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [isFocused, value, suggestions]);

  const handleSelectSuggestion = (categoryDisplay: string) => {
    onChangeText(categoryDisplay);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="words"
        autoComplete="off"
        autoCorrect={false}
      />

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <TrendingUp size={14} color="#38a169" />
            <Text style={styles.suggestionsHeaderText}>Popular {type === 'category' ? 'Categories' : 'Subcategories'}</Text>
          </View>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item.category_display)}
              >
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>{item.category_display}</Text>
                  <View style={styles.suggestionBadge}>
                    <Text style={styles.suggestionBadgeText}>
                      {item.unique_user_count} {item.unique_user_count === 1 ? 'user' : 'users'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.suggestionUsageCount}>
                  Used {item.total_usage_count}x
                </Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.suggestionFooter}>
            <Text style={styles.suggestionFooterText}>
              Or type a custom {type}
            </Text>
          </View>
        </View>
      )}

      {value.length >= 2 && !loading && suggestions.length === 0 && isFocused && (
        <View style={styles.noSuggestionsContainer}>
          <Text style={styles.noSuggestionsText}>
            No popular {type === 'category' ? 'categories' : 'subcategories'} match "{value}"
          </Text>
          <Text style={styles.noSuggestionsSubtext}>
            You can still use this custom {type}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1000,
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
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#38a169',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
    maxHeight: 280,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#d4f4e2',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    gap: 8,
  },
  suggestionsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38a169',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  suggestionBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  suggestionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  suggestionUsageCount: {
    fontSize: 12,
    color: '#a0aec0',
  },
  suggestionFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f7fafc',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  suggestionFooterText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noSuggestionsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  noSuggestionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9a3412',
    marginBottom: 4,
  },
  noSuggestionsSubtext: {
    fontSize: 12,
    color: '#c2410c',
  },
});
