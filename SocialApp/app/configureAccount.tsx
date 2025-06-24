import * as DocumentPicker from 'expo-document-picker';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import { ID, Query } from 'react-native-appwrite';
import { Button, Text, TextInput } from 'react-native-paper';
import { databaseId, databases, imagesStorageId, storage, usersCollectionId } from '../lib/appwrite';
import { useAuth } from '../lib/auth';

export default function ConfigureAccount() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [namePlaceholder, setNamePlaceholder] = useState('');
  const [usernamePlaceholder, setUsernamePlaceholder] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const router = useRouter();


  // Fetch user document for initial values
  useEffect(() => {
    const fetchUserDoc = async () => {
      if (!user?.$id) return;
      try {
        const res = await databases.listDocuments(databaseId, usersCollectionId, [
          // @ts-ignore
          Query.equal('userID', user.$id),
        ]);
        if (res.documents.length > 0) {
          const doc = res.documents[0];
          setNamePlaceholder(doc.name || '');
          setUsernamePlaceholder(doc.username || '');
          setBio(doc.bio || '');
          setProfileImage(doc.userProfile || null);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUserDoc();
  }, [user]);

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

  // Username availability check
  const checkUsernameAvailability = async (value: string) => {
    if (!value) {
      setIsUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await databases.listDocuments(
        databaseId,
        usersCollectionId,
        [
          // Appwrite query for equality
          // Exclude current user from check
          // @ts-ignore
          Query.equal('username', value),
        ]
      );
      // If found and not the current user, it's taken
      if (res.documents.length === 0 || (res.documents.length === 1 && res.documents[0].$id === user?.$id)) {
        setIsUsernameAvailable(true);
      } else {
        setIsUsernameAvailable(false);
      }
    } catch (e) {
      setIsUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSave = async () => {
    if (!name) {
      setError('يرجى إدخال الاسم');
      return;
    }
    if (!username) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }
    if (name.length < 5 || name.length > 20) {
      setError('يجب أن يكون الاسم بين 5 و 20 حرفًا');
      return;
    }
    if (username.length < 5 || username.length > 20) {
      setError('يجب أن يكون اسم المستخدم بين 5 و 20 حرفًا');
      return;
    }
    if (isUsernameAvailable === false) {
      setError('اسم المستخدم غير متاح');
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
          username,
        }
      );
      router.replace('/(tabs)/home');
    } catch (e) {
      setError('حدث خطأ أثناء حفظ البيانات' + e);
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
        <Text style={{ color: "#0095f6", fontSize: 26, width: "100%", textAlign: "right"}}>إعداد الحساب</Text>
        <Text style={{
          
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
          placeholder={namePlaceholder}
          style={{ width: "100%", marginBottom: 10}}
          mode="outlined"
          activeOutlineColor="#0095f6"
          textAlign="right"
        />
        <TextInput
          label="نبذة عنك"
          value={bio}
          onChangeText={setBio}
          style={{ width: "100%", marginBottom: 15}}
          mode="outlined"
          activeOutlineColor="#0095f6"
          multiline
          numberOfLines={3}
          textAlign="right"
        />
        <TextInput
          label="اسم المستخدم"
          value={username}
          onChangeText={text => {
            setUsername(text);
            setIsUsernameAvailable(null);
          }}
          onBlur={() => checkUsernameAvailability(username)}
          placeholder={usernamePlaceholder}
          style={{ width: "100%", marginBottom: 10}}
          mode="outlined"
          activeOutlineColor="#0095f6"
          textAlign="right"
          autoCapitalize="none"
        />
        {checkingUsername && (
          <Text style={{ color: '#0095f6', fontFamily: 'Rubik-Regular', marginBottom: 5, textAlign: 'right' }}>جاري التحقق من توفر اسم المستخدم...</Text>
        )}
        {isUsernameAvailable === false && (
          <Text style={{ color: 'red', fontFamily: 'Rubik-Regular', marginBottom: 5, textAlign: 'right' }}>اسم المستخدم غير متاح</Text>
        )}
        {isUsernameAvailable === true && (
          <Text style={{ color: 'green', fontFamily: 'Rubik-Regular', marginBottom: 5, textAlign: 'right' }}>اسم المستخدم متاح</Text>
        )}
        {error && <Text style={{
          
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
          <Text style={{ color: "white"}}>حفظ</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
} 