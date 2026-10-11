import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { AuthHero } from '../../src/components/auth/AuthHero';
import { InlineError } from '../../src/components/auth/InlineError';
import { OtpInput } from '../../src/components/auth/OtpInput';
import { colors, spacing, typography } from '../../src/theme';
import { authApi } from '../../src/api/authApi';

export default function VerifyResetOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setError('');
    
    try {
      const data = await authApi.verifyResetOtp({ email, otp });
      router.push({ 
        pathname: '/(auth)/reset-password', 
        params: { token: data.token } 
      });
    } catch (err: any) {
      setError(err.message || 'Verification code is incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email });
      setTimeLeft(30);
    } catch (err: any) {
      setError(err.message || 'Unable to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthHero variant="reset-otp" title="Verify Email" subtitle={`Enter the 6-digit code sent to\n${email}`} />

        <View style={styles.form}>
          <InlineError message={error} />
          
          <OtpInput value={otp} onChange={setOtp} error={!!error} />
          
          <View style={styles.resendContainer}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>Resend code in 00:{timeLeft.toString().padStart(2, '0')}</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label={isLoading ? "Verifying..." : "Verify Code"}
          onPress={handleVerify}
          disabled={otp.length !== 6 || isLoading}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  form: { marginTop: spacing.md },
  resendContainer: { alignItems: 'center', marginTop: spacing.xl },
  timerText: { color: colors.text.secondary, fontWeight: typography.weight.medium },
  resendText: { color: colors.primary, fontWeight: typography.weight.bold },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  secondaryText: { color: colors.text.secondary, fontWeight: typography.weight.medium },
});
