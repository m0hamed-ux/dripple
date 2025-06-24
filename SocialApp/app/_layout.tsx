import { SplashScreen, Stack, useRouter} from "expo-router";
import { useEffect, useState } from "react";
import { Auth } from "../lib/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Font from "expo-font";

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
        "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
        "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
      });
      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) return null;
  
  return ( 
      <Auth>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }}/>
            <Stack.Screen name="login" options={{ headerShown: false }}/>
            <Stack.Screen name="register" options={{ headerShown: false }}/>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
            <Stack.Screen name="addStory" options={{ headerShown: false }}/>
            <Stack.Screen name="configureAccount" options={{ headerShown: false }}/>
          </Stack>
        </SafeAreaView>
      </Auth>
    );
}
