import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from "expo-router";
import { Images, Link, Play, Plus, SpinnerGap, Video } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
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
                    userID: await account.get().then((user) => user.$id),
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{backgroundColor: "#fff", height: "100%"}}>
        <View style={{display: "flex", padding: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center"}}>
            <Text style={{
              fontSize: 24,
              fontFamily: "Rubik-Medium",
              marginBottom: 0,
              textAlign: "right",
            }}>منشور جديد</Text>
            <Pressable onPress={async ()=>{await addPost(content, title)}} disabled={title.length < 3 || (mediaType == "link" && link == "")} >
                <Text style={{
                    fontSize: 16,
                    fontFamily: "Rubik-Medium",
                    color: "white",
                    backgroundColor: title.length < 3 || (mediaType == "link" && link == "") ? "#a3a3a3" : '#0095f6',
                    paddingHorizontal: 15,
                    paddingVertical: 2,
                    borderRadius: 15,
                    textAlign: "right",
                }}>نشر</Text>
            </Pressable>
        </View>
        <View style={{padding: 10}}>
            <TextInput value={title} onChangeText={setTitle} multiline placeholder="العنوان"maxLength={40} style={{fontFamily: "Rubik-Medium", fontSize: 16, textAlign: "right"}}>
            </TextInput>
            <TextInput
              multiline
              placeholder="محتوى المنشور (اختياري)"
              maxLength={200}
              value={content}
              onChangeText={setContent}
              style={{fontFamily: "Rubik-Regular", fontSize: 14, textAlign: "right"}}
            />
            {mediaType === "link" && (
                <TextInput
                    placeholder="رابط"
                    value={link}
                    onChangeText={setLink}
                    autoCapitalize="none"
                    keyboardType="url"
                    style={{fontFamily: "Rubik-Regular", fontSize: 14, textAlign: "right", marginTop: 0}}
                />
            )}
            <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10, paddingHorizontal: 10}}>
                <Pressable onPress={
                    () => {pickImage()}} style={{backgroundColor: "transparent", padding: 0, margin: 0}}>
                    <Images size={24} color={mediaType == "image"?'#0095f6':mediaType == "none"?"#a3a3a3":"#eaeaea"} weight="bold" />
                </Pressable>

                <Pressable onPress={() => {pickVideo()}} style={{backgroundColor: "transparent", padding: 0, margin: 0}}>
                    <Video size={24} color={mediaType == "video"?'#0095f6':mediaType == "none"?"#a3a3a3":"#eaeaea"} weight="bold" />
                </Pressable>
                
                <Pressable onPress={() => setMediaType(mediaType === "link" ? "none" : "link")} style={{backgroundColor: "transparent", padding: 0, margin: 0}}>
                    <Link size={24} color={mediaType == "link"?'#0095f6':mediaType == "none"?"#a3a3a3":"#eaeaea"} weight="bold" />
                </Pressable>
            </View>
            {mediaType === "image" && (
                <View style={{marginTop: 10, padding: 10, display: "flex", flexDirection: "row-reverse", gap: 10}}>
                    {image.map((img, index) => (
                        <View key={index} style={{ position: "relative" }}>
                          <Image
                            source={{ uri: img }}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 10,
                              overflow: "hidden",
                            }}
                          />
                          <Pressable
                            onPress={() => {
                              setImage((prev) => prev.filter((_, i) => i !== index));
                            }}
                            style={{
                              position: "absolute",
                              top: 2,
                              left: 2,
                              backgroundColor: "rgba(255,255,255,0.8)",
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 1,
                            }}
                          >
                            <Text style={{ color: '#0095f6', fontWeight: "bold", fontSize: 14 }}>×</Text>
                          </Pressable>
                        </View>
                    ))}
                    {isImageLoading && (
                        <View style={{
                            width: 50,
                            height: 50,
                            borderRadius: 10,
                            overflow: "hidden",
                            backgroundColor: "#eaeaea",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <SpinnerGap size={24} color="#a3a3a3" weight="bold" />
                        </View>
                    )}
                    {image.length < 4 && (
                        <Pressable style={{
                            width: 50,
                            height: 50,
                            borderRadius: 10,
                            overflow: "hidden",
                            backgroundColor: "#eaeaea",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                         }} onPress={() => {pickImage()}} >
                            <Plus size={24} color="#a3a3a3" weight="bold"></Plus>
                        </Pressable>
                    )}
                    


                </View>
            )}
            {mediaType === "video" && (
                <View style={{marginTop: 10, padding: 10, display: "flex", flexDirection: "row-reverse", gap: 10}}>
                    {video && !isVideoLoading && (
                        <View style={{
                            width: 90,
                            height: 110,
                            borderRadius: 20,
                            overflow: "hidden",
                            backgroundColor: "#000",
                            margin: 6,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 6,
                            borderWidth: 1,
                            borderColor: "#f3f3f3",
                            position: "relative",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Image
                                source={{ uri: video }}
                                style={{ width: "100%", height: "100%", borderRadius: 20, opacity: 0.85 }}
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
                                borderRadius: 20,
                            }}>
                                <Play size={36} color="#fff" weight="fill" style={{ opacity: 0.85 }} />
                            </View>
                            <Pressable
                                onPress={() => setVideo("")}
                                style={{
                                    position: "absolute",
                                    top: 6,
                                    left: 6,
                                    backgroundColor: "rgba(255,255,255,0.85)",
                                    borderRadius: 10,
                                    width: 24,
                                    height: 24,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 1,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}
                            >
                                <Text style={{ color: "#ff3c00", fontWeight: "bold", fontSize: 18 }}>×</Text>
                            </Pressable>
                        </View>
                    )}
                    {isVideoLoading && (
                        <Animated.View style={{
                            width: 90,
                            height: 110,
                            borderRadius: 20,
                            overflow: "hidden",
                            backgroundColor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 6,
                            margin: 6,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: "#f3f3f3",
                            transform: [{ scale: pulseAnim }],
                        }}>
                            <View style={{
                                width: 90,
                                height: 110,
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: 20,
                                backgroundColor: "#fff",
                                opacity: 0.7,
                            }} />
                            <Video size={28} color="#ff3c00" weight="fill" style={{ marginBottom: 6, opacity: 0.85 }} />
                            <View style={{
                                width: 54,
                                height: 54,
                                borderRadius: 27,
                                backgroundColor: "#fff6f2",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                                shadowColor: "#ff3c00",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.12,
                                shadowRadius: 6,
                                elevation: 2,
                            }}>
                                <ActivityIndicator size="large" color="#ff3c00" />
                            </View>
                            <Text style={{ color: "#ff3c00", fontSize: 15, fontFamily: "Rubik-Medium", marginTop: 2, textAlign: "center", letterSpacing: 0.2 }}>جاري تحميل الفيديو...</Text>
                        </Animated.View>
                    )}
                    {!video && !isVideoLoading && (
                        <Pressable style={{
                            width: 50,
                            height: 50,
                            borderRadius: 10,
                            overflow: "hidden",
                            backgroundColor: "#eaeaea",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                         }} onPress={() => {pickVideo()}} >
                            <Plus size={24} color="#a3a3a3" weight="bold"></Plus>
                        </Pressable>
                    )}
                </View>
            )}
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
            
        </View>
    </KeyboardAvoidingView>
  );
}