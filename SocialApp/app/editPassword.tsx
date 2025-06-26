import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { account } from "../lib/appwrite";
import { useAuth } from "../lib/auth";

export default function EditPassword() {
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleUpdatePassword = async () => {
        // Reset messages
        setError(null);
        setSuccess(null);

        // Validation
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError("يرجى ملء جميع الحقول");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError("كلمات المرور الجديدة غير متطابقة");
            return;
        }

        if (newPassword.length < 8) {
            setError("يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل");
            return;
        }

        if (currentPassword === newPassword) {
            setError("كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية");
            return;
        }

        setLoading(true);

        try {
            // Update password using Appwrite with current password verification
            await account.updatePassword(newPassword, currentPassword);
            
            setSuccess("تم تحديث كلمة المرور بنجاح");
            
            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            
            // Navigate back after a short delay
            setTimeout(() => {
                router.back();
            }, 2000);
            
        } catch (error: any) {
            console.error('Password update error:', error);
            
            // Handle specific error cases
            if (error.code === 401) {
                setError("كلمة المرور الحالية غير صحيحة");
            } else if (error.code === 400) {
                setError("كلمة المرور الجديدة لا تلبي متطلبات الأمان");
            } else if (error.message?.includes('Network')) {
                setError("خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت");
            } else {
                setError(error.message || "حدث خطأ أثناء تحديث كلمة المرور");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={{
                padding: 20,
                height: "100%",
                justifyContent: "center",
                backgroundColor: "white",
            }}>
                <Text style={{
                    color: "#0095f6", 
                    fontSize: 26, 
                    width: "100%", 
                    textAlign: "right", 
                    fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold",
                    marginBottom: 5
                }}>
                    تغيير كلمة المرور
                </Text>
                <Text style={{
                    textAlign: "right",
                    marginBottom: 30,
                    paddingLeft: "20%",
                    paddingRight: 5,
                    marginTop: 0,
                    color: "gray",
                    fontSize: 14,
                    fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
                }}>
                    أدخل كلمة المرور الحالية وكلمة المرور الجديدة لتحديث كلمة المرور.
                </Text>

                <TextInput
                    label="كلمة المرور الحالية"
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry={true}
                    mode="outlined"
                    activeOutlineColor="#0095f6"
                    outlineColor="#e9ecef"
                    textAlign="right"
                    style={{ 
                        width: "100%", 
                        marginBottom: 15,
                        fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
                    }}
                    contentStyle={{ fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}
                    onChangeText={(text) => {
                        setCurrentPassword(text);
                        setError(null);
                        setSuccess(null);
                    }}
                />

                <TextInput
                    label="كلمة المرور الجديدة"
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry={true}
                    mode="outlined"
                    activeOutlineColor="#0095f6"
                    outlineColor="#e9ecef"
                    textAlign="right"
                    style={{ 
                        width: "100%", 
                        marginBottom: 15,
                        fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
                    }}
                    contentStyle={{ fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}
                    onChangeText={(text) => {
                        setNewPassword(text);
                        setError(null);
                        setSuccess(null);
                    }}
                />

                <TextInput
                    label="تأكيد كلمة المرور الجديدة"
                    autoCapitalize="none"
                    keyboardType="default"
                    secureTextEntry={true}
                    mode="outlined"
                    activeOutlineColor="#0095f6"
                    outlineColor="#e9ecef"
                    textAlign="right"
                    style={{ 
                        width: "100%", 
                        marginBottom: 20,
                        fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
                    }}
                    contentStyle={{ fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}
                    onChangeText={(text) => {
                        setConfirmNewPassword(text);
                        setError(null);
                        setSuccess(null);
                    }}
                />

                {/* Error Display */}
                {error && (
                    <View style={{
                        backgroundColor: "#fff5f5",
                        borderWidth: 1,
                        borderColor: "#fed7d7",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            textAlign: "center",
                            color: '#dc3545',
                            fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular",
                            fontSize: 14,
                        }}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* Success Display */}
                {success && (
                    <View style={{
                        backgroundColor: "#f0fff4",
                        borderWidth: 1,
                        borderColor: "#9ae6b4",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            textAlign: "center",
                            color: '#38a169',
                            fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular",
                            fontSize: 14,
                        }}>
                            {success}
                        </Text>
                    </View>
                )}

                <Button 
                    style={{
                        width: "100%",
                        backgroundColor: "#0095f6",
                        borderRadius: 8,
                        marginTop: 10,
                        paddingVertical: 8,
                    }} 
                    mode="contained" 
                    onPress={handleUpdatePassword}
                    loading={loading}
                    disabled={loading}
                    contentStyle={{ paddingVertical: 8 }}
                >
                    <Text style={{ 
                        color: "white", 
                        fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold",
                        fontSize: 16
                    }}>
                        {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                    </Text>
                </Button>

                <Button 
                    style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        borderRadius: 8,
                        marginTop: 15,
                        borderWidth: 1,
                        borderColor: "#0095f6",
                    }} 
                    mode="outlined" 
                    onPress={() => router.back()}
                    disabled={loading}
                >
                    <Text style={{ 
                        color: "#0095f6", 
                        fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular",
                        fontSize: 16
                    }}>
                        إلغاء
                    </Text>
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}
