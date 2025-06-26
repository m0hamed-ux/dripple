import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { databaseId, databases, postsCollectionId } from "../lib/appwrite";
import { PostType } from "../types/database.type";

export default function EditPost() {
    const { id: postID } = useLocalSearchParams<{ id: string }>();
    const [content, setContent] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [post, setPost] = useState<PostType | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchPost();
    }, [postID]);

    const fetchPost = async () => {
        if (!postID) return;
        setLoading(true);
        try {
            const postData = await databases.getDocument(databaseId, postsCollectionId, postID);
            setPost(postData as PostType);
            setTitle(postData.title || "");
            setContent(postData.content || "");
        } catch (error) {
            console.error('Error fetching post:', error);
            setError("حدث خطأ أثناء جلب المنشور");
        } finally {
            setLoading(false);
        }
    };

    const updatePost = async () => {
        if (!postID || !title.trim()) return;
        
        setSaving(true);
        setError(null);
        
        try {
            await databases.updateDocument(
                databaseId,
                postsCollectionId,
                postID,
                {
                    title: title.trim(),
                    content: content.trim(),
                }
            );
            
            router.back();
        } catch (error) {
            console.error('Error updating post:', error);
            setError("حدث خطأ أثناء تحديث المنشور. يرجى المحاولة مرة أخرى.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#0095f6" />
                <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>جاري التحميل...</Text>
            </View>
        );
    }

    if (!post) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 16, color: '#666' }}>لم يتم العثور على المنشور</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{backgroundColor: "#fff", flex: 1}}>
            <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
                <View style={{padding: 8, paddingTop: 14, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff"}}>
                    <Text style={{
                        fontSize: 26,
                        textAlign: "right",
                        color: "#222"
                    }}>تعديل المنشور</Text>
                    <TouchableOpacity 
                        onPress={updatePost} 
                        disabled={title.length < 3 || saving} 
                        activeOpacity={0.7}
                    >
                        <View style={{
                            backgroundColor: title.length < 3 || saving ? "#a3a3a3" : '#0095f6',
                            paddingHorizontal: 22,
                            paddingVertical: 5,
                            borderRadius: 20,
                            opacity: title.length < 3 || saving ? 0.7 : 1
                        }}>
                            <Text style={{
                                fontSize: 18,
                                color: "white",
                                textAlign: "center"
                            }}>
                                {saving ? "جاري الحفظ..." : "حفظ"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{padding: 0, backgroundColor: "#fff", borderRadius: 18, margin: 16, marginTop: 18, marginBottom: 0}}>
                    <TextInput 
                        value={title} 
                        onChangeText={setTitle} 
                        multiline 
                        placeholder="العنوان" 
                        maxLength={40}
                        placeholderTextColor="#b0b0b0"
                        style={{
                            fontSize: 17,
                            textAlign: "right",
                            borderWidth: 1,
                            borderColor: "#e0e0e0",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 10,
                            backgroundColor: "#fafbfc"
                        }}
                    />
                    
                    <TextInput
                        multiline
                        placeholder="محتوى المنشور (اختياري)"
                        maxLength={200}
                        value={content}
                        onChangeText={setContent}
                        placeholderTextColor="#b0b0b0"
                        style={{
                            fontSize: 15,
                            textAlign: "right",
                            borderWidth: 1,
                            borderColor: "#e0e0e0",
                            borderRadius: 12,
                            padding: 12,
                            backgroundColor: "#fafbfc"
                        }}
                    />

                    {/* Media Preview Section - Read Only */}
                    {post.link && (
                        <View style={{
                            marginTop: 18,
                            padding: 12,
                            backgroundColor: "#f8f9fa",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#e0e0e0"
                        }}>
                            <Text style={{
                                fontSize: 14,
                                color: "#666",
                                textAlign: "right",
                                marginBottom: 8
                            }}>الرابط:</Text>
                            <Text style={{
                                fontSize: 14,
                                color: "#007AFF",
                                textAlign: "right",
                                textDecorationLine: "underline"
                            }}>{post.link}</Text>
                        </View>
                    )}

                    {post.images && (
                        <View style={{
                            marginTop: 18,
                            padding: 12,
                            backgroundColor: "#f8f9fa",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#e0e0e0"
                        }}>
                            <Text style={{
                                fontSize: 14,
                                color: "#666",
                                textAlign: "right",
                                marginBottom: 8
                            }}>
                                {Array.isArray(post.images) ? `الصور (${post.images.length})` : "الصورة"}
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: "#999",
                                textAlign: "right"
                            }}>لا يمكن تعديل الوسائط</Text>
                        </View>
                    )}

                    {post.video && (
                        <View style={{
                            marginTop: 18,
                            padding: 12,
                            backgroundColor: "#f8f9fa",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#e0e0e0"
                        }}>
                            <Text style={{
                                fontSize: 14,
                                color: "#666",
                                textAlign: "right",
                                marginBottom: 8
                            }}>الفيديو</Text>
                            <Text style={{
                                fontSize: 12,
                                color: "#999",
                                textAlign: "right"
                            }}>لا يمكن تعديل الوسائط</Text>
                        </View>
                    )}

                    {error && (
                        <Text style={{
                            textAlign: "center",
                            color: '#0095f6',
                            marginBottom: 10,
                            padding: 10,
                            backgroundColor: "#ffe6e6",
                            borderRadius: 8,
                            marginTop: 18,
                            fontSize: 15
                        }}>{error}</Text>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
