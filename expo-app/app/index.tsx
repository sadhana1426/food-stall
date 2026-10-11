import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';

export default function Index() {
  const { isHydrating, isAuthenticated, business } = useAuthStore();

  if (isHydrating) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (business && !business.setupCompleted) {
    return <Redirect href="/(auth)/business-setup" />;
  }

  return <Redirect href="/(tabs)/billing" />;
}
