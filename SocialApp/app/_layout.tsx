import { Stack, useRouter} from "expo-router";
import { useEffect } from "react";
import { Auth } from "../lib/auth";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  
  return ( 
      <Auth>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }}/>
            <Stack.Screen name="login" options={{ headerShown: false }}/>
            <Stack.Screen name="register" options={{ headerShown: false }}/>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
          </Stack>
        </SafeAreaView>
      </Auth>
    );
}
