import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionProvider } from "@/lib/session-context";

export default function RootLayout() {
  return (
    // `SafeAreaView` from react-native itself is deprecated and warns on
    // every launch; the screens use the one from
    // `react-native-safe-area-context` instead, which needs this provider
    // above them. The package is already here as a dependency of
    // expo-router, so this adds nothing to install.
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
