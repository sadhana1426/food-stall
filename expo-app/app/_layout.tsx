import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';

export default function RootLayout() {
  const { isHydrating, isAuthenticated, business, hydrateSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    hydrateSession();
  }, []);

  // Initial routing is now handled safely via Redirect in app/index.tsx.
  // We can leave _layout to just provide the stack.

  if (isHydrating) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="bill-preview" />
        <Stack.Screen name="bill-success" />
        <Stack.Screen name="bill-details/[id]" />
        <Stack.Screen name="admin/pin" options={{ presentation: 'modal' }} />
        <Stack.Screen name="admin/menu" />
        <Stack.Screen name="admin/item" />
        <Stack.Screen name="settings/printer" />
      </Stack>
    </>
  );
}
