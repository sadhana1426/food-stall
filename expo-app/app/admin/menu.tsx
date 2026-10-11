import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { SearchBar } from '../../src/components/billing/SearchBar';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatMoney } from '../../src/utils/money';
import { menuApi } from '../../src/api/menuApi';
import { useFocusEffect } from 'expo-router';
import { MenuItem } from '../../src/types';

export default function ManageMenuScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await menuApi.getMenu();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load menu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMenu();
    }, [loadMenu])
  );

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await menuApi.updateAvailability(id, !current);
      // Optimistic update
      setItems(items.map(i => ((i.id || i._id) === id) ? { ...i, isAvailable: !current } : i));
    } catch (err) {
      alert('Failed to update availability. Connection required.');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: MenuItem }) => {
    const itemId = item.id || item._id || '';
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>{item.category} • ₹{formatMoney(item.pricePaise)}</Text>
        </View>
        <View style={styles.cardActions}>
          <Switch 
            value={item.isAvailable} 
            onValueChange={() => toggleAvailability(itemId, item.isAvailable)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            style={styles.switch}
          />
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/admin/item', params: { id: itemId } })}
          >
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/more')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Menu</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/admin/item')}
        >
          <MaterialIcons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <SearchBar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState icon="error-outline" title="Error" subtitle={error} />
          <TouchableOpacity style={styles.retryButton} onPress={loadMenu}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id || item._id || ''}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cardContent: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginRight: spacing.md,
  },
  editButton: {
    padding: spacing.xs,
    backgroundColor: colors.primary + '1A',
    borderRadius: radius.sm,
  },
});
