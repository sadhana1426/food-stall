import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { SearchBar } from '../../src/components/billing/SearchBar';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatMoney } from '../../src/utils/money';
import { menuApi } from '../../src/api/menuApi';
import { useMenuStore } from '../../src/store/useMenuStore';
import { MenuItem } from '../../src/types';

export default function ManageMenuScreen() {
  const router = useRouter();
  const { 
    items, 
    isLoading, 
    isRefreshing, 
    error, 
    fetchMenu, 
    refreshMenu, 
    updateAvailabilityInStore, 
    removeItem 
  } = useMenuStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshMenu();
    }, [refreshMenu])
  );

  const toggleAvailability = async (id: string, current: boolean) => {
    updateAvailabilityInStore(id, !current);
    try {
      await menuApi.updateAvailability(id, !current);
    } catch (err) {
      updateAvailabilityInStore(id, current);
      Alert.alert('Error', 'Failed to update availability. Connection required.');
    }
  };

  const confirmDeleteItem = (item: MenuItem) => {
    const itemId = item.id || item._id || '';
    Alert.alert(
      `Delete "${item.name}"?`,
      'This will remove the item from your active menu. Past bills will remain unchanged.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Item', 
          style: 'destructive', 
          onPress: () => handleDeleteItem(itemId) 
        }
      ]
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      await menuApi.deleteMenuItem(itemId);
      removeItem(itemId);
    } catch (err: any) {
      Alert.alert('Delete Failed', err.message || 'Unable to delete item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: MenuItem }) => {
    const itemId = item.id || item._id || '';
    const isDeleting = deletingId === itemId;

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
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => confirmDeleteItem(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            )}
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

      {isLoading && items.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState icon="error-outline" title="Error" subtitle={error} />
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchMenu(true)}>
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
          refreshing={isRefreshing}
          onRefresh={refreshMenu}
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
    marginRight: spacing.sm,
  },
  editButton: {
    padding: spacing.xs,
    backgroundColor: colors.primary + '1A',
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
    backgroundColor: colors.error + '1A',
    borderRadius: radius.sm,
  },
});
