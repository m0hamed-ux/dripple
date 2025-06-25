import * as Font from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Auth } from "../lib/auth";

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
            <Stack.Screen name="postDetails" options={{ headerShown: false }}/>
            <Stack.Screen name="community" options={{ headerShown: false }}/>
            <Stack.Screen name="userProfile" options={{ headerShown: false }}/>
            <Stack.Screen name="createCommunity" options={{ headerShown: false }}/>
            <Stack.Screen name="mycommunities" options={{ headerShown: false }}/>
            <Stack.Screen name="addPostToCommunity" options={{ headerShown: false }}/>
            <Stack.Screen name="appInfo" options={{ headerShown: false }}/>
            <Stack.Screen name="privacy_terms" options={{ headerShown: false }}/>
            <Stack.Screen name="reqVer" options={{ headerShown: false }}/>
          </Stack>
        </SafeAreaView>
      </Auth>
    );
}
