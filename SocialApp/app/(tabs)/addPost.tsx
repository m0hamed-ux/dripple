import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from "expo-router";
import { Images, Link, Play, Plus, SpinnerGap, Video, XCircle } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ID } from 'react-native-appwrite';
import { account, databaseId, databases, imagesStorageId, postsCollectionId, storage } from "../../lib/appwrite";


export default function AppPost() {
    const [link, setLink] = useState<string>("");
    const [video, setVideo] = useState<string>("");
    const [image, setImage] = useState<Array<string>>([]);
    const [content, setContent] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [mediaType, setMediaType] = useState<"image" | "video" | "link" | "none">("none");
    const [error, setError] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
    const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
    const router = useRouter();

    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (isVideoLoading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isVideoLoading]);

    // Image
    const pickImage = async () => {
        if(image.length >= 4) {
            setError("يمكنك إضافة 4 صور كحد أقصى");
            setTimeout(() => {
                setError(null);
            }, 3000);
            return;
        }
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                copyToCacheDirectory: true,
                multiple: false,
            });
            setIsImageLoading(true);

            if (result?.canceled) {
                setIsImageLoading(false);
                return;
            }

            const file = result.assets[0];
            if (file && file.mimeType?.startsWith('image/')) {
                setMediaType('image');
                await uploadImage(file);
            }
        } catch (error) {
            alert('Error picking image: ' + error);
            setIsImageLoading(false);
        }
    };
    const uploadImage = async (image: any) => {
        await storage.createFile(
            imagesStorageId,
            ID.unique(),
            {
                uri: image.uri,
                name: image.name,
                type: image.mimeType,
                size: image.size,
            }
        ).then((response) => {
            const url = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${imagesStorageId}/files/${response.$id}/view?project=6854346600203ab09001&mode=admin`;
            setImage((prev) => [...prev, url]);
            setIsImageLoading(false);
        })
    }
    

    // Video
    
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
                setIsVideoLoading(true);
                setMediaType('video');
                try{
                    await uploadVideo(file);
                }catch(error) {
                    alert(error)
                }
            }
        } catch (error) {
            alert('Error picking video: ' + error);
        }
    };
    const uploadVideo = async (video: any) => {
        await storage.createFile(
            imagesStorageId,
            ID.unique(),
            {
                uri: video.uri,
                name: video.name,
                type: video.mimeType,
                size: video.size,
            }
        ).then((response) => {
            const url = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${imagesStorageId}/files/${response.$id}/view?project=6854346600203ab09001&mode=admin`;
            setIsVideoLoading(false);
            setVideo(url);
        })
    }

    const addPost = async (content: String, title: String) => {
        try {
            await databases.createDocument(
                databaseId,
                postsCollectionId,
                ID.unique(),
                {
                    user: await account.get().then((user) => user.$id),
                    title: title,
                    content: content,
                    link: mediaType === "link" ? link : null,
                    images: mediaType === "image" && image.length > 0 ? image : null,
                    video: mediaType === "video" && video.length > 1 ? video : null,
                }
            );
            setContent("");
            setTitle("");
            setLink("");
            setMediaType("none");
            setVideo("");
            setImage([]);
            router.push("/(tabs)/home");
            return true;
        } catch (error) {
            console.error('Error adding post:', error);
            setError("حدث خطأ أثناء إضافة المنشور. يرجى المحاولة مرة أخرى.");
            setTimeout(() => {
                setError(null);
            }, 3000);
            return false;
        }
    }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{backgroundColor: "#fff", flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
        <View style={{padding: 8, paddingTop: 14, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff"}}>
          <Text style={{
            fontSize: 26,
            
            textAlign: "right",
            color: "#222"
          }}>منشور جديد</Text>
          <TouchableOpacity onPress={async ()=>{await addPost(content, title)}} disabled={title.length < 3 || (mediaType == "link" && link == "")} activeOpacity={0.7}>
            <View style={{
              backgroundColor: title.length < 3 || (mediaType == "link" && link == "") ? "#a3a3a3" : '#0095f6',
              paddingHorizontal: 22,
              paddingVertical: 5,
              borderRadius: 20,
              opacity: title.length < 3 || (mediaType == "link" && link == "") ? 0.7 : 1
            }}>
              <Text style={{
                fontSize: 18,
                
                color: "white",
                textAlign: "center"
              }}>نشر</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{padding: 0, backgroundColor: "#fff", borderRadius: 18, margin: 16, marginTop: 18, marginBottom: 0}}>
          <TextInput value={title} onChangeText={setTitle} multiline placeholder="العنوان" maxLength={40}
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
          {mediaType === "link" && (
            <TextInput
              placeholder="رابط"
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor="#b0b0b0"
              style={{
                
                fontSize: 15,
                textAlign: "right",
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 12,
                padding: 12,
                marginTop: 10,
                backgroundColor: "#fafbfc"
              }}
            />
          )}
          <View style={{flexDirection: "row-reverse", justifyContent: "flex-end", gap: 18, marginTop: 18}}>
            <TouchableOpacity onPress={pickImage} style={{padding: 8, borderRadius: 50, backgroundColor: mediaType === "image" ? "#e6f2fb" : "#f2f2f2"}} activeOpacity={0.7}>
              <Images size={28} color={mediaType === "image" ? '#0095f6' : '#a3a3a3'} weight="bold" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo} style={{padding: 8, borderRadius: 50, backgroundColor: mediaType === "video" ? "#e6f2fb" : "#f2f2f2"}} activeOpacity={0.7}>
              <Video size={28} color={mediaType === "video" ? '#0095f6' : '#a3a3a3'} weight="bold" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMediaType(mediaType === "link" ? "none" : "link")} style={{padding: 8, borderRadius: 50, backgroundColor: mediaType === "link" ? "#e6f2fb" : "#f2f2f2"}} activeOpacity={0.7}>
              <Link size={28} color={mediaType === "link" ? '#0095f6' : '#a3a3a3'} weight="bold" />
            </TouchableOpacity>
          </View>
          {/* Media Preview Section */}
          {mediaType === "image" && (
            <Animated.View style={{marginTop: 18, flexDirection: "row-reverse", gap: 12, alignItems: "center"}}>
              {image.map((img, index) => (
                <Animated.View key={index} style={{position: "relative", opacity: 1, transform: [{scale: 1}]}}>
                  <Image
                    source={{ uri: img }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e0e0e0",
                      backgroundColor: "#f2f2f2"
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setImage((prev) => prev.filter((_, i) => i !== index));
                    }}
                    style={{
                      position: "absolute",
                      top: -8,
                      left: -8,
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      width: 28,
                      height: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#e0e0e0"
                    }}
                    activeOpacity={0.7}
                  >
                    <XCircle size={22} color="#0095f6" weight="fill" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
              {isImageLoading && (
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  backgroundColor: "#eaeaea",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e0e0e0"
                }}>
                  <SpinnerGap size={28} color="#a3a3a3" weight="bold" />
                </View>
              )}
              {image.length < 4 && !isImageLoading && (
                <TouchableOpacity style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  backgroundColor: "#eaeaea",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e0e0e0"
                }} onPress={pickImage} activeOpacity={0.7}>
                  <Plus size={28} color="#a3a3a3" weight="bold" />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
          {mediaType === "video" && (
            <Animated.View style={{marginTop: 18, flexDirection: "row-reverse", alignItems: "center", gap: 12}}>
              {video && !isVideoLoading && (
                <View style={{
                  width: 110,
                  height: 140,
                  borderRadius: 18,
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Image
                    source={{ uri: video }}
                    style={{ width: "100%", height: "100%", borderRadius: 18, opacity: 0.85 }}
                    resizeMode="cover"
                  />
                  <View style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.15)",
                    borderRadius: 18,
                  }}>
                    <Play size={40} color="#fff" weight="fill" style={{ opacity: 0.85 }} />
                  </View>
                  <TouchableOpacity
                    onPress={() => setVideo("")}
                    style={{
                      position: "absolute",
                      top: -10,
                      left: -10,
                      backgroundColor: "#fff",
                      borderRadius: 14,
                      width: 32,
                      height: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#e0e0e0"
                    }}
                    activeOpacity={0.7}
                  >
                    <XCircle size={26} color="#0095f6" weight="fill" />
                  </TouchableOpacity>
                </View>
              )}
              {isVideoLoading && (
                <Animated.View style={{
                  width: 110,
                  height: 140,
                  borderRadius: 18,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  margin: 0,
                  padding: 0,
                  transform: [{ scale: pulseAnim }],
                }}>
                  <View style={{
                    width: 110,
                    height: 140,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 18,
                    backgroundColor: "#fff",
                    opacity: 0.7,
                  }} />
                  {/* <Video size={32} color="#0095f6" weight="fill" style={{ marginBottom: 6, opacity: 0.85 }} /> */}
                  <View style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: "#fff6f2",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}>
                    <ActivityIndicator size="large" color="#0095f6" />
                  </View>
                  <Text style={{ color: "#0095f6", fontSize: 15,  marginTop: 2, textAlign: "center", letterSpacing: 0.2 }}>جاري تحميل الفيديو...</Text>
                </Animated.View>
              )}
              {!video && !isVideoLoading && (
                <TouchableOpacity style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  backgroundColor: "#eaeaea",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e0e0e0"
                }} onPress={pickVideo} activeOpacity={0.7}>
                  <Plus size={28} color="#a3a3a3" weight="bold" />
                </TouchableOpacity>
              )}
            </Animated.View>
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