import * as DocumentPicker from 'expo-document-picker';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { Button, Text, TextInput } from 'react-native-paper';
import { databaseId, databases, imagesStorageId, storage, usersCollectionId } from '../lib/appwrite';
import { useAuth } from '../lib/auth';

export default function ConfigureAccount() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'Rubik-Black': require('../assets/fonts/Rubik-Black.ttf'),
    'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
  });

  const pickImage = async () => {
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
        await uploadImage(file);
      }
    } catch (error) {
      setError('حدث خطأ أثناء اختيار الصورة');
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
      setProfileImage(url);
      setIsImageLoading(false);
    });
  }

  const handleSave = async () => {
    if (!name) {
      setError('يرجى إدخال الاسم');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await databases.updateDocument(
        databaseId,
        usersCollectionId,
        user?.$id!,
        {
          name,
          bio,
          userProfile: profileImage,
        }
      );
      router.replace('/(tabs)/home');
    } catch (e) {
      setError('حدث خطأ أثناء حفظ البيانات' + e);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{
        padding: 20,
        height: "100%",
        justifyContent: "center",
        backgroundColor: "white",
      }}>
        <Text style={{fontFamily: "Rubik-Black", color: "#0095f6", fontSize: 26, width: "100%", textAlign: "right"}}>إعداد الحساب</Text>
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
          أدخل بياناتك لإكمال إعداد الحساب.
        </Text>
        <TouchableOpacity onPress={pickImage} style={{alignSelf: 'center', marginBottom: 24}} disabled={isImageLoading}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : isImageLoading ? (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color="#0095f6" />
            </View>
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#aaa', fontFamily: 'Rubik-Regular' }}>اختر صورة</Text>
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          label="الاسم"
          value={name}
          onChangeText={setName}
          style={{fontFamily: "Rubik-Regular", width: "100%", marginBottom: 10}}
          mode="outlined"
          activeOutlineColor="#0095f6"
          textAlign="right"
        />
        <TextInput
          label="نبذة عنك"
          value={bio}
          onChangeText={setBio}
          style={{fontFamily: "Rubik-Regular", width: "100%", marginBottom: 15}}
          mode="outlined"
          activeOutlineColor="#0095f6"
          multiline
          numberOfLines={3}
          textAlign="right"
        />
        {error && <Text style={{
          fontFamily: "Rubik-Regular",
          textAlign: "center",
          color: '#0095f6',
          marginBottom: 10,
          padding: 10,
          backgroundColor: "#ffe6e6",
          borderRadius: 5,
          marginTop: 10,
        }}>{error}</Text>}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={{
            width: "100%",
            backgroundColor: "#0095f6",
            borderRadius: 5,
            borderBlockColor: "#0095f6",
            borderWidth: 2,
            marginTop: 0,
          }}
        >
          <Text style={{fontFamily: "Rubik-Regular", color: "white"}}>حفظ</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
} 