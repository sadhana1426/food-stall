import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '../../src/theme';
import { useEffect } from 'react';
import { settingsApi } from '../../src/api/settingsApi';
import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function TabsLayout() {
  const updateBusiness = useSettingsStore((state) => state.updateBusiness);

  useEffect(() => {
    settingsApi.getBusinessSettings().then((data: any) => {
      updateBusiness({
        name: data.businessName,
        address: data.address,
        phone: data.phone,
        receiptFooter: data.receiptFooter,
      });
    }).catch(() => {});

    settingsApi.getBillingSettings().then((data: any) => {
      useSettingsStore.getState().updateTax({
        isEnabled: data.taxEnabled,
        rate: data.taxRate,
      });
      useSettingsStore.getState().setDefaultDiscountPercent(0);
      if (data.defaultOrderType) {
        useSettingsStore.getState().setDefaultOrderType(data.defaultOrderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine In');
      }
    }).catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontWeight: typography.weight.medium,
          fontSize: typography.size.xs,
        }
      }}
    >
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color }) => <MaterialIcons name="shopping-cart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <MaterialIcons name="menu" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
