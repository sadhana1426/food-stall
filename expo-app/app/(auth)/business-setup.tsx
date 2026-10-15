import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { ToggleRow } from '../../src/components/common/ToggleRow';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { colors, spacing, typography } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function BusinessSetupScreen() {
  const router = useRouter();
  const { hydrateSession } = useAuthStore();
  
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState('0');

  const [orderType, setOrderType] = useState('DINE_IN');
  const [paperWidth, setPaperWidth] = useState('58mm');
  const [receiptFooter, setReceiptFooter] = useState('Thank You! Visit Again.');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await apiClient('/settings/business', {
        method: 'PUT',
        body: JSON.stringify({
          taxEnabled,
          taxRate: parseFloat(taxRate) || 0,
          defaultDiscount: {
            type: 'NONE',
            value: 0
          },
          defaultOrderType: orderType,
          paperWidth,
          receiptFooter,
          setupCompleted: true
        })
      });

      await hydrateSession(); // refresh business context
      router.replace('/(auth)/setup-complete');
    } catch (err: any) {
      setError(err.message || 'Unable to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <AuthHero variant="business-setup" title="Business Setup" subtitle="Configure your billing preferences" />

        <View style={styles.form}>
          <InlineError message={error} />
          
          <Text style={styles.sectionTitle}>GST Settings</Text>
          <ToggleRow title="Enable GST" subtitle="Apply GST to orders" value={taxEnabled} onValueChange={setTaxEnabled} />
          {taxEnabled && (
            <AppTextInput label="GST Rate (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" />
          )}

          <View style={{marginTop: spacing.xl}}>
            <Text style={styles.sectionTitle}>Receipt Paper Width</Text>
            <SegmentedControl 
              options={[{label:'50mm (Standard)', value:'58mm'}, {label:'80mm (Wide)', value:'80mm'}]}
              selectedValue={paperWidth}
              onSelect={setPaperWidth}
            />
            <View style={{marginTop: spacing.md}}>
              <AppTextInput label="Receipt Footer" value={receiptFooter} onChangeText={setReceiptFooter} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
          label={isLoading ? "Saving..." : "Finish Business Setup"}
          onPress={handleFinish}
          disabled={isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  form: { marginTop: spacing.md },
  sectionTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.lg },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
