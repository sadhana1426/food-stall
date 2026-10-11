import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-reset-otp" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-signup-otp" />
      <Stack.Screen name="create-password" />
      <Stack.Screen name="business-setup" />
      <Stack.Screen name="setup-complete" />
    </Stack>
  );
}
