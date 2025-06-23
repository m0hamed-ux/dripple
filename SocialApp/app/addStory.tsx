import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from "expo-router";
import { Images, Play, Video, X } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { ID } from 'react-native-appwrite';
import { account, databaseId, databases, imagesStorageId, storage, storiesCollectionId } from "../lib/appwrite";

export default function AddStory() {
  const [media, setMedia] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading]);

  // Image picker
  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      setIsLoading(true);

      if (result?.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      if (file && file.mimeType?.startsWith('image/')) {
        // Check file size (50MB = 50 * 1024 * 1024 bytes)
        if (file.size && file.size > 50 * 1024 * 1024) {
          setError("حجم الملف يجب أن يكون أقل من 50 ميجابايت");
          setTimeout(() => setError(null), 3000);
          setIsLoading(false);
          return;
        }
        
        setMediaType('image');
        await uploadMedia(file);
      }
    } catch (error) {
      alert('Error picking image: ' + error);
      setIsLoading(false);
    }
  };

  // Video picker
  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result?.canceled) {
        return;
      }

      const file = result.assets[0];
      if (file && file.mimeType?.startsWith('video/')) {
        // Check file size (50MB = 50 * 1024 * 1024 bytes)
        if (file.size && file.size > 50 * 1024 * 1024) {
          setError("حجم الملف يجب أن يكون أقل من 50 ميجابايت");
          setTimeout(() => setError(null), 3000);
          return;
        }
        
        setIsLoading(true);
        setMediaType('video');
        await uploadMedia(file);
      }
    } catch (error) {
      alert('Error picking video: ' + error);
    }
  };

  // Upload media
  const uploadMedia = async (file: any) => {
    try {
      const response = await storage.createFile(
        imagesStorageId,
        ID.unique(),
        {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size,
        }
      );
      
      const url = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${imagesStorageId}/files/${response.$id}/view?project=6854346600203ab09001&mode=admin`;
      setMedia(url);
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading media:', error);
      setError("حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.");
      setTimeout(() => setError(null), 3000);
      setIsLoading(false);
    }
  };

  // Add story
  const addStory = async () => {
    if (!media) {
      setError("يرجى اختيار صورة أو فيديو");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const user = await account.get();
      await databases.createDocument(
        databaseId,
        storiesCollectionId,
        ID.unique(),
        {
          userID: user.$id,
          image: mediaType === "image" ? media : null,
          video: mediaType === "video" ? media : null,
          text: text || null,
        }
      );
      
      // Reset form
      setMedia("");
      setText("");
      setMediaType("none");
      router.push("/(tabs)/home");
    } catch (error) {
      console.error('Error adding story:', error);
      setError("حدث خطأ أثناء إضافة القصة. يرجى المحاولة مرة أخرى.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{backgroundColor: "#000", height: "100%"}}
    >
      {/* Header */}
      <View style={{
        display: "flex", 
        padding: 15, 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderBottomColor: "#333"
      }}>
        <Pressable onPress={() => router.back()}>
          <X size={24} color="#fff" weight="bold" />
        </Pressable>
        <Text style={{
          fontSize: 18,
          fontFamily: "Rubik-Medium",
          color: "#fff",
        }}>قصة جديدة</Text>
        <Pressable 
          onPress={addStory} 
          disabled={!media}
          style={{
            opacity: media ? 1 : 0.5
          }}
        >
          <Text style={{
            fontSize: 16,
            fontFamily: "Rubik-Medium",
            color: "#0095f6",
          }}>مشاركة</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={{flex: 1, padding: 20}}>
        {/* Media Preview */}
        {media && !isLoading && (
          <View style={{
            width: "100%",
            height: 400,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#1a1a1a",
            marginBottom: 20,
            position: "relative"
          }}>
            <Image
              source={{ uri: media }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {mediaType === "video" && (
              <View style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.3)",
              }}>
                <Play size={48} color="#fff" weight="fill" />
              </View>
            )}
            <Pressable
              onPress={() => {
                setMedia("");
                setMediaType("none");
              }}
              style={{
                position: "absolute",
                top: 15,
                right: 15,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="#fff" weight="bold" />
            </Pressable>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <Animated.View style={{
            width: "100%",
            height: 400,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#1a1a1a",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pulseAnim }],
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#0095f6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
            <Text style={{
              color: "#fff",
              fontSize: 16,
              fontFamily: "Rubik-Medium",
              textAlign: "center"
            }}>
              جاري رفع {mediaType === "image" ? "الصورة" : "الفيديو"}...
            </Text>
          </Animated.View>
        )}

        {/* Media Selection */}
        {!media && !isLoading && (
          <View style={{
            width: "100%",
            height: 400,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#333",
            borderStyle: "dashed",
            backgroundColor: "#1a1a1a",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <View style={{
              display: "flex",
              flexDirection: "row",
              gap: 30,
              alignItems: "center",
            }}>
              <Pressable
                onPress={pickImage}
                style={{
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#0095f6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}>
                  <Images size={32} color="#fff" weight="bold" />
                </View>
                <Text style={{
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "Rubik-Medium",
                }}>صورة</Text>
              </Pressable>

              <Pressable
                onPress={pickVideo}
                style={{
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#0095f6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}>
                  <Video size={32} color="#fff" weight="bold" />
                </View>
                <Text style={{
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "Rubik-Medium",
                }}>فيديو</Text>
              </Pressable>
            </View>
            <Text style={{
              color: "#666",
              fontSize: 12,
              fontFamily: "Rubik-Regular",
              textAlign: "center",
              marginTop: 20,
            }}>
              الحد الأقصى لحجم الملف: 50 ميجابايت
            </Text>
          </View>
        )}

        {/* Text Input */}
        {media && (
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="أضف نص إلى قصتك..."
            placeholderTextColor="#666"
            multiline
            maxLength={100}
            style={{
              fontFamily: "Rubik-Regular",
              fontSize: 16,
              color: "#fff",
              backgroundColor: "#1a1a1a",
              borderRadius: 15,
              padding: 15,
              textAlign: "right",
              minHeight: 100,
              borderWidth: 1,
              borderColor: "#333",
            }}
          />
        )}

        {/* Error Message */}
        {error && (
          <Text style={{
            fontFamily: "Rubik-Regular",
            textAlign: "center",
            color: '#0095f6',
            marginTop: 15,
            padding: 10,
            backgroundColor: "rgba(255, 60, 0, 0.1)",
            borderRadius: 10,
          }}>{error}</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}