import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../src/theme';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { usePrinterStore } from '../../src/store/usePrinterStore';

export default function AppSettingsScreen() {
  const router = useRouter();
  
  const { defaultOrderType, setDefaultOrderType } = useSettingsStore();
  const { autoPrint, autoReconnect, updateConfig } = usePrinterStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: Order & Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order & Billing</Text>
          
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <MaterialIcons name="restaurant" size={20} color={colors.primary} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.itemTitle}>Default Order Type</Text>
                <Text style={styles.itemSubtitle}>Pre-selected type when starting a new bill</Text>
              </View>
            </View>

            <View style={styles.segmentedContainer}>
              <TouchableOpacity
                style={[
                  styles.segmentOption,
                  defaultOrderType === 'Dine In' && styles.segmentOptionActive,
                ]}
                onPress={() => setDefaultOrderType('Dine In')}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name="table-restaurant" 
                  size={18} 
                  color={defaultOrderType === 'Dine In' ? colors.white : colors.text.secondary} 
                />
                <Text
                  style={[
                    styles.segmentText,
                    defaultOrderType === 'Dine In' && styles.segmentTextActive,
                  ]}
                >
                  Dine In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentOption,
                  defaultOrderType === 'Takeaway' && styles.segmentOptionActive,
                ]}
                onPress={() => setDefaultOrderType('Takeaway')}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name="takeout-dining" 
                  size={18} 
                  color={defaultOrderType === 'Takeaway' ? colors.white : colors.text.secondary} 
                />
                <Text
                  style={[
                    styles.segmentText,
                    defaultOrderType === 'Takeaway' && styles.segmentTextActive,
                  ]}
                >
                  Takeaway
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 2: Receipt & Printing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt & Printing</Text>

          <View style={styles.card}>
            {/* Auto Print Row */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
                <MaterialIcons name="print" size={20} color={colors.accent} />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.itemTitle}>Auto-Print Receipts</Text>
                <Text style={styles.itemSubtitle}>Print receipt automatically when a bill is created</Text>
              </View>
              <Switch
                value={autoPrint}
                onValueChange={(val) => updateConfig({ autoPrint: val })}
                trackColor={{ false: '#E0E0E0', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.divider} />

            {/* Auto Reconnect Row */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconContainer, { backgroundColor: '#3B82F615' }]}>
                <MaterialIcons name="bluetooth-connected" size={20} color="#2563EB" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.itemTitle}>Auto-Reconnect</Text>
                <Text style={styles.itemSubtitle}>Connect to saved thermal printer on app launch</Text>
              </View>
              <Switch
                value={autoReconnect}
                onValueChange={(val) => updateConfig({ autoReconnect: val })}
                trackColor={{ false: '#E0E0E0', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Section 3: App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.appLogo} 
                resizeMode="contain" 
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.appName}>Tasty Bites POS</Text>
                <Text style={styles.appVersion}>Version 1.0.1 (Production)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Cloud Backend Connected</Text>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: radius.full,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...shadows.small,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    gap: spacing.xs,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  segmentOptionActive: {
    backgroundColor: colors.primary,
    ...shadows.small,
  },
  segmentText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semiBold,
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: typography.weight.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  appVersion: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
});
