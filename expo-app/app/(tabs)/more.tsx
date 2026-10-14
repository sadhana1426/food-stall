import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function MoreScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Management</Text>
          <SettingsRow 
            icon="restaurant-menu" 
            title="Manage Items" 
            subtitle="Add, edit, or disable menu items"
            onPress={() => router.push({ pathname: '/admin/pin', params: { next: '/admin/menu' } })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Settings</Text>
          <SettingsRow 
            icon="storefront" 
            title="Business Details" 
            subtitle="Name, address, receipt footer"
            onPress={() => router.push('/settings/business')}
          />
          <SettingsRow 
            icon="receipt" 
            title="Tax & Discount" 
            subtitle="Configure default tax and discounts"
            onPress={() => router.push('/settings/tax-discount')}
          />
          <SettingsRow 
            icon="print" 
            title="Printer Setup" 
            subtitle="Connect to receipt printer"
            onPress={() => router.push('/settings/printer')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <SettingsRow 
            icon="settings" 
            title="App Settings" 
            subtitle="Order defaults and printing preferences"
            onPress={() => router.push('/settings/app')}
          />
          <SettingsRow 
            icon="logout" 
            title="Log Out" 
            subtitle="Sign out of your business account"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
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
  title: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
