import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../src/theme';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { settingsApi } from '../../src/api/settingsApi';

import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const updateBusiness = useSettingsStore((state) => state.updateBusiness);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [footer, setFooter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsApi.getBusinessSettings()
      .then((data) => {
        setName(data.businessName || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setFooter(data.receiptFooter || '');
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load settings.');
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await settingsApi.updateBusinessSettings({
        businessName: name, address, phone, receiptFooter: footer
      });
      updateBusiness({ name, address, phone, receiptFooter: footer });
      handleBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Connection required.');
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
          <Text style={styles.headerTitle}>Business Details</Text>
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
          <Text style={styles.headerTitle}>Business Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppTextInput
            label="Business Name"
            value={name}
            onChangeText={setName}
            editable={!isSaving}
          />
          
          <AppTextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            editable={!isSaving}
          />
          
          <AppTextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isSaving}
          />
          
          <AppTextInput
            label="Receipt Footer Message"
            value={footer}
            onChangeText={setFooter}
            placeholder="e.g. Thank You! Visit Again."
            editable={!isSaving}
          />
        </ScrollView>
        
        <View style={styles.footer}>
          <PrimaryButton 
            label={isSaving ? "SAVING..." : "SAVE CHANGES"} 
            onPress={handleSave}
            disabled={!name.trim() || isSaving}
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
