import { Text, View } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Home() {
    const [fontsLoaded] = useFonts({
        'logoFont': require('../assets/fonts/Rubik-LightItalic.ttf'),
    });
    const router = useRouter();
    const isAuth = false;

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isAuth) {
                router.replace("../(tabs)/home");
                return;
            } else {
                router.replace("../login");
                return;
            }
        }, 3000);

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            backgroundColor: "#ff3c00",
        }}>
            <Text style={{
                fontSize: 24,
                color: "white",
                textAlign: "center",
                fontFamily: "logoFont",
            }}>Dripple</Text>
        </View>
    );
}