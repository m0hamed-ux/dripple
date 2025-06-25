import { useFonts } from 'expo-font';
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useAuth } from "../lib/auth";

export default function Login() {
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
            router.replace("/configureAccount");
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
                <Text style={{color: "#0095f6", fontSize: 26, width: "100%", textAlign: "right", fontFamily: "Rubik-Medium"}}> {isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}</Text>
                <Text style={{
                    
                    textAlign: "right",
                    marginBottom: 5,
                    paddingLeft: "20%",
                    paddingRight: 5,
                    marginTop: 0,
                    color: "gray",
                    fontSize: 14,
                    fontFamily: "Rubik-Regular"
                }}>
                    {isSignUp ? "مرحبًا بك مرة أخرى! أدخل بياناتك لتسجيل الدخول." : "مرحبًا بك في تطبيقنا! أدخل بياناتك لإنشاء حساب جديد."}
                </Text>
                <TextInput
                    label="البريد الإلكتروني"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    mode="outlined"
                    activeOutlineColor="#0095f6"
                    textAlign="center"
                    style={{ width: "100%", marginBottom: 10, fontFamily: "Rubik-Regular"}}
                    onChangeText={(text) => (setEmail(text), setError(null))}
                />
                <TextInput
                    label="كلمة المرور"
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry={true}
                    mode="outlined"
                    activeOutlineColor="#0095f6"
                    style={{ width: "100%", marginBottom: 15, fontFamily: "Rubik-Regular"}}
                    onChangeText={(text) => (setPassword(text), setError(null))}
                />
                {!isSignUp && (
                    <TextInput
                        label="تأكيد كلمة المرور"
                        autoCapitalize="none"
                        keyboardType="default"
                        secureTextEntry={true}
                        mode="outlined"
                        activeOutlineColor="#0095f6"
                        style={{ width: "100%", marginBottom: 15, fontFamily: "Rubik-Regular"}}
                        onChangeText={(text) => (setConfirmPassword(text), setError(null))}
                    />
                )}
                {isSignUp && (
                    <Text style={{
                        fontFamily: "Rubik-Regular",
                        textAlign: "right",
                        marginBottom: 10,
                        color: "#0095f6",
                        fontSize: 14,
                        marginTop: -10,
                    }} onPress={() => {
                        const router = useRouter();
                        // router.replace("./forgot-password");
                    }}>نسيت كلمة المرور؟</Text>
                )}
                
                <Button style={{
                    width: "100%",
                    backgroundColor: "#0095f6",
                    borderRadius: 5,
                    borderBlockColor: "#0095f6",
                    borderWidth: 2,
                    marginTop: 0,
                }} mode="contained" 
                onPress={() => {
                    handleAuth();
                }}>
                    <Text style={{ color: "white", fontFamily: "Rubik-Regular"}}>{isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}</Text>
                </Button>
                {error && (
                    <Text style={{
                        fontFamily: "Rubik-Regular",
                        textAlign: "center",
                        color: '#0095f6',
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
                        style={{ color: "#0095f6", fontFamily: "Rubik-Regular"}}
                        onPress={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? "إنشاء حساب" : "تسجيل الدخول"}
                    </Text>
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}