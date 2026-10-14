import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../../src/theme';
import { AppTextInput } from '../../src/components/common/AppTextInput';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { ToggleRow } from '../../src/components/common/ToggleRow';
import { parseMoney, formatMoney } from '../../src/utils/money';
import { menuApi } from '../../src/api/menuApi';
import { useMenuStore } from '../../src/store/useMenuStore';

export default function ItemFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isEditing = !!id;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>();
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      // Find item
      menuApi.getMenu().then(items => {
        const existingItem = items.find(i => (i.id === id || i._id === id));
        if (existingItem) {
          setName(existingItem.name);
          setPrice(formatMoney(existingItem.pricePaise));
          setCategory(existingItem.category);
          setIsAvailable(existingItem.isAvailable);
          if (existingItem.image?.url) {
            setExistingImageUrl(existingItem.image.url);
          }
        } else {
          router.replace('/admin/menu');
        }
        setIsLoading(false);
      }).catch(() => {
        router.replace('/admin/menu');
      });
    }
  }, [isEditing, id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin/menu');
    }
  };

  const confirmDelete = () => {
    if (!id) return;
    Alert.alert(
      `Delete "${name}"?`,
      'This will remove the item from your active menu. Past bills will remain unchanged.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Item', 
          style: 'destructive', 
          onPress: handleDelete 
        }
      ]
    );
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await menuApi.deleteMenuItem(id);
      useMenuStore.getState().removeItem(id);
      handleBack();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.message || 'Unable to delete item. Please try again.');
      setIsSaving(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "Please allow camera access to take a photo.");
          return;
        }
        
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImageUri(result.assets[0].uri);
          setIsImageRemoved(false);
        }
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "Please allow gallery access to pick a photo.");
          return;
        }
        
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImageUri(result.assets[0].uri);
          setIsImageRemoved(false);
        }
      }
    } catch (E) {
      console.log(E);
    }
  };

  const removeImage = () => {
    setImageUri(undefined);
    setIsImageRemoved(true);
  };

  const handleImagePick = () => {
    const options: any[] = [
      { text: "Take Photo", onPress: () => pickImage(true) },
      { text: "Choose from Gallery", onPress: () => pickImage(false) },
    ];
    
    if (imageUri || (!isImageRemoved && existingImageUrl)) {
      options.push({ text: "Remove Photo", onPress: removeImage, style: 'destructive' });
    }
    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Add Photo", "Choose an option", options);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    const pricePaise = parseMoney(price);
    if (pricePaise <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = { name, pricePaise, category, isAvailable };
      
      if (isEditing && id) {
        const updated = await menuApi.updateMenuItem(id, payload, imageUri, isImageRemoved);
        if (updated) {
          useMenuStore.getState().upsertItem(updated);
        } else {
          useMenuStore.getState().refreshMenu();
        }
      } else {
        const created = await menuApi.createMenuItem(payload, imageUri);
        if (created) {
          useMenuStore.getState().upsertItem(created);
        } else {
          useMenuStore.getState().refreshMenu();
        }
      }
      handleBack();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Unsupported FormDataPart') || msg.includes('Network request failed')) {
        console.error('Image upload form data error:', err);
        setError('Unable to upload image. Please try again.');
      } else {
        setError(msg || 'Failed to save item. Connection required.');
      }
      setIsSaving(false);
    }
  };


  const categoryOptions = [
    { label: 'Snacks', value: 'Snacks' },
    { label: 'Meals', value: 'Meals' },
    { label: 'Beverages', value: 'Beverages' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>
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
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <AppTextInput
            label="Item Name"
            value={name}
            onChangeText={(t) => { setName(t); setError(''); }}
            placeholder="e.g. Samosa"
            editable={!isSaving}
          />
          
          <AppTextInput
            label="Price (₹)"
            value={price}
            onChangeText={(t) => { setPrice(t); setError(''); }}
            placeholder="0.00"
            keyboardType="numeric"
            editable={!isSaving}
          />

          <Text style={styles.label}>Food Image</Text>
          <TouchableOpacity style={styles.imagePickerContainer} onPress={handleImagePick} disabled={isSaving}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.foodImage} />
            ) : (!isImageRemoved && existingImageUrl) ? (
              <Image source={{ uri: existingImageUrl }} style={styles.foodImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={32} color={colors.text.secondary} />
                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.label}>Category</Text>
          <SegmentedControl 
            options={categoryOptions} 
            selectedValue={category} 
            onSelect={setCategory} 
          />
          
          <View style={{ height: spacing.md }} />
          
          <ToggleRow
            title="Available"
            subtitle="Show this item in the menu"
            value={isAvailable}
            onValueChange={setIsAvailable}
          />
        </ScrollView>
        
        <View style={styles.footer}>
          <PrimaryButton 
            label={isSaving ? "SAVING..." : "SAVE ITEM"} 
            onPress={handleSave}
            disabled={isSaving}
          />
          {isEditing && (
            <TouchableOpacity 
              style={styles.deleteItemBtn} 
              onPress={confirmDelete}
              disabled={isSaving}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
              <Text style={styles.deleteItemBtnText}>Delete Item</Text>
            </TouchableOpacity>
          )}
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
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  imagePickerContainer: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  deleteItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteItemBtnText: {
    color: colors.error,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
    fontSize: typography.size.md,
  },
});
