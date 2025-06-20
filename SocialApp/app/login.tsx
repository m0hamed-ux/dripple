import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useFonts } from 'expo-font';
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
    const [fontsLoaded] = useFonts({
        'Rubik-Black': require('../assets/fonts/Rubik-Black.ttf'),
        'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
    });
    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const {signUp, signIn} = useAuth();
    const router = useRouter();
    const handleAuth = async () => {
        if(!email || !password) {
            setError("يرجى ملء جميع الحقول");
            return;
        }
        if (!isSignUp && password !== confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            return;
        }
        if (!isSignUp && !confirmPassword) {
            setError("يرجى تأكيد كلمة المرور");
            return;
        }
        if (!isSignUp && password.length < 8) {
            setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
            return;
        }
        if (!email.includes("@")) {
            setError("يرجى إدخال بريد إلكتروني صالح");
            return;
        }
        setError(null);
        
        if(!isSignUp) {
            const error = await signUp(email, password);
            if (error) {
                setError(error);
                return;
            }
            router.replace("/(tabs)/home");
        } else {
            const error = await signIn(email, password);
            if (error) {
                setError(error);
                return;
            }
            router.replace("/(tabs)/home");
        }
    }
    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={{
                padding: 20,
                height: "100%",
                justifyContent: "center",
                backgroundColor: "white",
            }}>
                <Text style={{fontFamily: "Rubik-Black",color: "#ff3c00", fontSize: 26, width: "100%", textAlign: "right"}}> {isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}</Text>
                <Text style={{
                    fontFamily: "Rubik-Regular",
                    textAlign: "right",
                    marginBottom: 5,
                    paddingLeft: "20%",
                    paddingRight: 5,
                    marginTop: 0,
                    color: "gray",
                    fontSize: 14,
                }}>
                    {isSignUp ? "مرحبًا بك مرة أخرى! أدخل بياناتك لتسجيل الدخول." : "مرحبًا بك في تطبيقنا! أدخل بياناتك لإنشاء حساب جديد."}
                </Text>
                <TextInput
                    label="البريد الإلكتروني"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    mode="outlined"
                    activeOutlineColor="#ff3c00"
                    textAlign="center"
                    style={{fontFamily: "Rubik-Regular", width: "100%", marginBottom: 10}}
                    onChangeText={(text) => (setEmail(text), setError(null))}
                />
                <TextInput
                    label="كلمة المرور"
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry={true}
                    mode="outlined"
                    activeOutlineColor="#ff3c00"
                    style={{fontFamily: "Rubik-Regular", width: "100%", marginBottom: 15}}
                    onChangeText={(text) => (setPassword(text), setError(null))}
                />
                {!isSignUp && (
                    <TextInput
                        label="تأكيد كلمة المرور"
                        autoCapitalize="none"
                        keyboardType="default"
                        secureTextEntry={true}
                        mode="outlined"
                        activeOutlineColor="#ff3c00"
                        style={{fontFamily: "Rubik-Regular", width: "100%", marginBottom: 15}}
                        onChangeText={(text) => (setConfirmPassword(text), setError(null))}
                    />
                )}
                {isSignUp && (
                    <Text style={{
                        fontFamily: "Rubik-Regular",
                        textAlign: "right",
                        marginBottom: 10,
                        color: "#ff3c00",
                        fontSize: 14,
                        marginTop: -10,
                    }} onPress={() => {
                        const router = useRouter();
                        // router.replace("./forgot-password");
                    }}>نسيت كلمة المرور؟</Text>
                )}
                
                <Button style={{
                    width: "100%",
                    backgroundColor: "#ff3c00",
                    borderRadius: 5,
                    borderBlockColor: "#ff3c00",
                    borderWidth: 2,
                    marginTop: 0,
                }} mode="contained" 
                onPress={() => {
                    handleAuth();
                }}>
                    <Text style={{fontFamily: "Rubik-Regular", color: "white"}}>{isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}</Text>
                </Button>
                {error && (
                    <Text style={{
                        fontFamily: "Rubik-Regular",
                        textAlign: "center",
                        color: "red",
                        marginBottom: 10,
                        padding: 10,
                        backgroundColor: "#ffe6e6",
                        borderRadius: 5,
                        marginTop: 10,
                    }}>{error}</Text>
                )}
                <Text style={{
                    fontFamily: "Rubik-Regular",
                    textAlign: "center",
                    marginTop: 40,
                }}>
                    {isSignUp ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
                    <Text
                        style={{ color: "#ff3c00" }}
                        onPress={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? "إنشاء حساب" : "تسجيل الدخول"}
                    </Text>
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}