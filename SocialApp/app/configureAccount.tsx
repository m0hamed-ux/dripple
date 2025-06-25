import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
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
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [userDocumentId, setUserDocumentId] = useState<string | null>(null);
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
          setName(doc.name || '');
          setUsername(doc.username || '');
          setBio(doc.bio || '');
          setProfileImage(doc.userProfile || null);
          setUserDocumentId(doc.$id);
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
    try {
      const response = await storage.createFile(
        imagesStorageId,
        ID.unique(),
        {
          uri: image.uri,
          name: image.name,
          type: image.mimeType,
          size: image.size,
        }
      );
      const url = `https://fra.cloud.appwrite.io/v1/storage/buckets/${imagesStorageId}/files/${response.$id}/view?project=685bce8d0026ef276c37&mode=admin`;
      setProfileImage(url);
    } catch (error) {
      setError('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsImageLoading(false);
    }
  }

  // Helper function to get the original username
  const getOriginalUsername = async () => {
    if (!userDocumentId) return null;
    try {
      const res = await databases.getDocument(
        databaseId,
        usersCollectionId,
        userDocumentId
      );
      return res.username || null;
    } catch (e) {
      console.error('Error getting original username:', e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!userDocumentId) {
      setError('لم يتم العثور على بيانات المستخدم - يرجى إعادة تسجيل الدخول');
      return;
    }
    
    if (!name) {
      setError('يرجى إدخال الاسم');
      return;
    }
    if (!username) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }
    if (name.length < 3 || name.length > 30) {
      setError('يجب أن يكون الاسم بين 3 و 30 حرفًا');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      setError('يجب أن يكون اسم المستخدم بين 3 و 20 حرفًا');
      return;
    }
    if (/[A-Z]/.test(username)) {
      setError('اسم المستخدم يجب أن يحتوي على أحرف صغيرة فقط');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('اسم المستخدم يجب أن يحتوي على أحرف صغيرة وأرقام وشرطة سفلية فقط');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if username has changed
      const originalUsername = await getOriginalUsername();
      const usernameChanged = originalUsername !== username;

      // Only validate username availability if it has changed
      if (usernameChanged) {
        setCheckingUsername(true);
        
        // Check database availability
        const res = await databases.listDocuments(
          databaseId,
          usersCollectionId,
          [
            // @ts-ignore
            Query.equal('username', username),
          ]
        );
        
        const existingUser = res.documents.find(doc => doc.username === username);
        if (existingUser && existingUser.$id !== userDocumentId) {
          setError('اسم المستخدم غير متاح');
          setLoading(false);
          setCheckingUsername(false);
          return;
        }
        
        setCheckingUsername(false);
      }

      console.log('Saving user data:', {
        name,
        bio,
        userProfile: profileImage,
        username,
        userDocumentId
      });

      const result = await databases.updateDocument(
        databaseId,
        usersCollectionId,
        userDocumentId,
        {
          name,
          bio,
          userProfile: profileImage,
          username,
        }
      );
      
      console.log('Save successful:', result);
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error('Save error details:', e);
      console.error('Error type:', typeof e);
      console.error('Error message:', e instanceof Error ? e.message : 'Unknown error');
      
      // Provide more specific error messages based on the error type
      if (e instanceof Error) {
        if (e.message.includes('permission')) {
          setError('خطأ في الصلاحيات - تأكد من تسجيل الدخول');
        } else if (e.message.includes('not found')) {
          setError('لم يتم العثور على المستخدم - يرجى إعادة تسجيل الدخول');
        } else if (e.message.includes('unique')) {
          setError('اسم المستخدم مستخدم بالفعل');
        } else {
          setError(`حدث خطأ أثناء حفظ البيانات: ${e.message}`);
        }
      } else {
        setError('حدث خطأ غير متوقع أثناء حفظ البيانات');
      }
    } finally {
      setLoading(false);
      setCheckingUsername(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          padding: 20,
          minHeight: "100%",
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
            إعداد الحساب
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
            أدخل بياناتك لإكمال إعداد الحساب.
          </Text>

          {/* Profile Image Section */}
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <TouchableOpacity 
              onPress={pickImage} 
              disabled={isImageLoading}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#f8f9fa',
                borderWidth: 3,
                borderColor: '#0095f6',
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={{ width: 114, height: 114, borderRadius: 57 }} 
                />
              ) : isImageLoading ? (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="#0095f6" />
                  <Text style={{ 
                    color: '#0095f6', 
                    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
                    fontSize: 12,
                    marginTop: 5
                  }}>
                    جاري الرفع...
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ 
                    color: '#0095f6', 
                    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
                    fontSize: 14,
                    textAlign: 'center'
                  }}>
                    اختر صورة
                  </Text>
                  <Text style={{ 
                    color: '#6c757d', 
                    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 5
                  }}>
                    الملف الشخصي
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <TextInput
            label="الاسم"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            style={{ 
              width: "100%", 
              marginBottom: 15,
              fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
            }}
            mode="outlined"
            activeOutlineColor="#0095f6"
            outlineColor="#e9ecef"
            textAlign="right"
            contentStyle={{ fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}
          />

          <TextInput
            label="اسم المستخدم"
            value={username}
            onChangeText={(text) => {
              const lowercaseText = text.toLowerCase();
              setUsername(lowercaseText);
              setError(null);
            }}
            style={{ 
              width: "100%", 
              marginBottom: 10,
              fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
            }}
            mode="outlined"
            activeOutlineColor="#0095f6"
            outlineColor="#e9ecef"
            textAlign="right"
            autoCapitalize="none"
            contentStyle={{ fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}
          />

          <TextInput
            label="نبذة عنك"
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              setError(null);
            }}
            style={{ 
              width: "100%", 
              marginBottom: 15,
              fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular"
            }}
            mode="outlined"
            activeOutlineColor="#0095f6"
            outlineColor="#e9ecef"
            multiline
            numberOfLines={3}
            textAlign="right"
            verticalAlign='middle'
            contentStyle={{ fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}
            placeholder="اكتب نبذة مختصرة عن نفسك..."
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

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading || checkingUsername}
            disabled={loading || checkingUsername}
            style={{
              width: "100%",
              backgroundColor: "#0095f6",
              borderRadius: 8,
              marginTop: 10,
              paddingVertical: 8,
            }}
            contentStyle={{ paddingVertical: 8 }}
          >
            <Text style={{ 
              color: "white",
              fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold",
              fontSize: 16
            }}>
              {loading ? "جاري الحفظ..." : checkingUsername ? "جاري التحقق من اسم المستخدم..." : "حفظ البيانات"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 