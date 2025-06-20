import { Stack, useRouter} from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  return ( 
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }}/>
        <Stack.Screen name="login" options={{ headerShown: false }}/>
        <Stack.Screen name="register" options={{ headerShown: false }}/>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      </Stack>
    );
}
