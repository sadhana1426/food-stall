import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

interface Props {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

export const OtpInput = ({ length = 6, value, onChange, error }: Props) => {
  const inputRef = useRef<TextInput>(null);
  
  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(numericText);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.boxContainer} onPress={handlePress}>
        {Array(length).fill(0).map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.box, 
              value.length === index && styles.boxActive,
              error && styles.boxError
            ]}
          >
            <Text style={styles.boxText}>{value[index] || ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        style={styles.hiddenInput}
        maxLength={length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  box: {
    flex: 1,
    aspectRatio: 0.8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: colors.error,
  },
  boxText: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
});
