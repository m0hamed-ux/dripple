import { useFonts } from 'expo-font';
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../lib/auth";

export default function Home() {
    const [fontsLoaded] = useFonts({
        'logoFont': require('../assets/fonts/ArbFONTS-Al-Jazeera-Arabic-Bold.ttf'),
    });
    const router = useRouter();
    const {user, isLoadingUser} = useAuth();
    useEffect(() => {
        let Times = 0
        const timeout = setInterval(() => {
            if (user && !isLoadingUser) {
                router.replace("../(tabs)/home");
                return;
            } else if (!user && !isLoadingUser) {
                router.replace("../login");
                return;
            }
            if (Times > 5) {
                router.replace("../login");
                return;
            }
            Times++;
        }, 1000);

        return () => clearTimeout(timeout);
    }, [router, user]);

    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            backgroundColor: "#0095f6",
        }}>
            <Text style={{
                fontSize: 24,
                width: "100%",
                textAlign: "center",
                fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold",
                color: "white",
                height: 100,
            }}>تريبل بوك</Text>
        </View>
    );
}