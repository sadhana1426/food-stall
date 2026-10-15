import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../src/theme';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { ToggleRow } from '../../src/components/common/ToggleRow';
import { settingsApi } from '../../src/api/settingsApi';

export default function TaxDiscountSettingsScreen() {
  const router = useRouter();
  const { setDefaultDiscountPercent } = useSettingsStore();
  
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState('0');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsApi.getBillingSettings()
      .then(data => {
        setTaxEnabled(data.taxEnabled);
        setTaxRate(data.taxRate.toString());
        setDefaultDiscountPercent(0);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unable to load settings.');
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    const rate = parseFloat(taxRate) || 0;
    try {
      await settingsApi.updateBillingSettings({
        taxEnabled,
        taxRate: rate,
        defaultDiscount: {
          type: 'NONE',
          value: 0
        }
      });
      setDefaultDiscountPercent(0);
      useSettingsStore.getState().updateTax({ isEnabled: taxEnabled, rate });
      handleBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save. Connection required.');
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GST Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={isSaving}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GST Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GST Settings</Text>
            <ToggleRow
              title="Enable GST"
              subtitle="Automatically apply GST to orders"
              value={taxEnabled}
              onValueChange={(val) => !isSaving && setTaxEnabled(val)}
            />
            {taxEnabled && (
              <AppTextInput
                label="Default GST Rate (%)"
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
                editable={!isSaving}
              />
            )}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <PrimaryButton 
            label={isSaving ? "SAVING..." : "SAVE SETTINGS"} 
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    fontSize: typography.size.sm,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
