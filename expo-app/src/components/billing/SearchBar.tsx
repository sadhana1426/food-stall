import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';

interface Props {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const SearchBar = ({ searchQuery, onSearchQueryChange }: Props) => {
  return (
    <View style={styles.searchContainer}>
      <MaterialIcons name="search" size={24} color={colors.text.secondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search menu items..."
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        placeholderTextColor={colors.text.secondary}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => onSearchQueryChange('')}>
          <MaterialIcons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
});
