import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { useCartStore } from '../../src/store/useCartStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { MenuItemCard } from '../../src/components/billing/MenuItemCard';
import { CategoryChip } from '../../src/components/billing/CategoryChip';
import { SearchBar } from '../../src/components/billing/SearchBar';
import { CartSummaryBar } from '../../src/components/cart/CartSummaryBar';
import { EmptyState } from '../../src/components/common/EmptyState';
import { menuApi } from '../../src/api/menuApi';
import { MenuItem } from '../../src/types';

export default function BillingScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { items: cartItems, addItem, decreaseQuantity, getTotalQuantity, getSubtotalPaise } = useCartStore();
  const { business } = useSettingsStore();

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await menuApi.getMenu({ available: true });
      setMenuItems(items);
    } catch (err: any) {
      setError(err.message || 'Unable to load menu. Check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return Array.from(cats);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.isAvailable) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const totalItems = getTotalQuantity();
  const totalPricePaise = getSubtotalPaise();

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const itemId = item.id || item._id || '';
    const cartItem = cartItems.find(i => i.menuItem.id === itemId);
    const quantity = cartItem ? cartItem.quantity : 0;
    // Map _id to id if coming from Mongo
    const normalizedItem: MenuItem = { ...item, id: itemId };

    return (
      <MenuItemCard 
        item={normalizedItem} 
        quantity={quantity} 
        onAdd={() => addItem(normalizedItem)} 
        onDecrease={() => decreaseQuantity(normalizedItem.id)} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{business.name || 'Tasty Bites'}</Text>
        <Text style={styles.headerSubtitle}>{business.address || 'Address not set'}</Text>
      </View>

      <SearchBar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <CategoryChip 
            category="All" 
            isSelected={selectedCategory === 'All'} 
            onPress={() => setSelectedCategory('All')} 
          />
          {categories.map(category => (
            <CategoryChip 
              key={category} 
              category={category} 
              isSelected={selectedCategory === category} 
              onPress={() => setSelectedCategory(category)} 
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState icon="error-outline" title="Connection Error" subtitle={error} />
          <TouchableOpacity style={styles.retryButton} onPress={loadMenu}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          icon="restaurant-menu" 
          title="No items found" 
          subtitle="Try another search or category." 
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredItems}
          keyExtractor={item => item.id || item._id || ''}
          renderItem={renderMenuItem}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: totalItems > 0 ? 96 : spacing.xl }
          ]}
          columnWrapperStyle={styles.listColumn}
          showsVerticalScrollIndicator={false}
        />
      )}

      {totalItems > 0 && (
        <CartSummaryBar 
          totalItems={totalItems} 
          totalPricePaise={totalPricePaise} 
          onViewCart={() => router.push('/cart')} 
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 4,
  },
  categoriesContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  listColumn: {
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
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
  }
});
