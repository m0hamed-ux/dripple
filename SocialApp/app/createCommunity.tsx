import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { account, communitiesCollectionId, communityMembersCollectionId, databaseId, imagesStorageId, safeCreateDocument, storage } from '../lib/appwrite';

const DEFAULT_BANNER = { uri: 'https://imgs.search.brave.com/X7D30-L2GRZIFGT182QmJKULDs1EPWWgGrw4T259eEA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTE5/OTYwMDQ1My92ZWN0/b3Ivc2VhbWxlc3Mt/cGF0dGVybi13aXRo/LWNoYXJpdHktaWNv/bnMuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPUxqNFdpRDE2/N2M1VjhCcENjYXg4/dE9RY2dnMGR0S0Jl/WkUyelpIeTRhNEE9' };
const DEFAULT_IMAGE = { uri: 'https://imgs.search.brave.com/9ncV5SmWyGRPhp15My-rt4wBzO9WeBpjzxp-vUQSZ1s/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMtcGxhdGZvcm0u/OTlzdGF0aWMuY29t/Ly9OWFRrc1lvcEM4/bF80bEYwa2ZzajVi/TUtnVUU9LzI5NXgw/OjExNDB4ODQ1L2Zp/dC1pbi81MDB4NTAw/L3Byb2plY3RzLWZp/bGVzLzE0MC8xNDAx/OC8xNDAxODI1Lzkz/NjUzYzJkLTZkZjkt/NDlmNy05N2U0LTU1/NjFlMmI1OTAzYy5w/bmc' };

export default function CreateCommunity() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const pickImage = async (type: 'image' | 'banner') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result?.canceled) return;
      const file = result.assets[0];
      if (file && (file.size || 0) > 52428800) {
        setError('الحد الأقصى لحجم الصورة هو 50 ميغابايت');
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (file && file.mimeType?.startsWith('image/')) {
        setIsLoading(true);
        const response = await storage.createFile(
          imagesStorageId,
          ID.unique(),
          {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
            size: file.size || 0,
          }
        );
        const url = `https://fra.cloud.appwrite.io/v1/storage/buckets/${imagesStorageId}/files/${response.$id}/view?project=685bce8d0026ef276c37&mode=admin`;
        if (type === 'image') setImage(url);
        else setBanner(url);
        setIsLoading(false);
      }
    } catch (e) {
      setError('حدث خطأ أثناء رفع الصورة');
      setIsLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreate = async () => {
    if (name.length < 3) {
      setError('اسم المجتمع يجب أن يكون 3 أحرف على الأقل');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (name.length > 40) {
      setError('اسم المجتمع يجب أن لا يتجاوز 40 حرفًا');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (description.length > 200) {
      setError('الوصف يجب أن لا يتجاوز 200 حرف');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const user = await account.get();
      const doc = await safeCreateDocument(
        databaseId,
        communitiesCollectionId,
        ID.unique(),
        {
          name,
          image: image || DEFAULT_IMAGE.uri,
          banner: banner || DEFAULT_BANNER.uri,
          description,
          admin: user.$id,
          memebers: [user.$id],
        }
      );
      await safeCreateDocument(
        databaseId,
        communityMembersCollectionId,
        ID.unique(),
        { user: user.$id, community: doc.$id }
      );
      setSuccess(true);
      setTimeout(() => {
        router.replace({ pathname: '/community', params: { id: doc.$id } });
      }, 1200);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء إنشاء المجتمع');
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.bannerContainer}>
          <Image source={banner ? { uri: banner } : DEFAULT_BANNER} style={styles.banner} resizeMode="cover" />
          <Pressable style={styles.bannerPicker} onPress={() => pickImage('banner')} disabled={isLoading}>
            <Text style={styles.bannerPickerText}>تغيير البانر</Text>
          </Pressable>
          <View style={styles.avatarWrapper}>
            <Image source={image ? { uri: image } : DEFAULT_IMAGE} style={styles.avatar} />
            <Pressable style={styles.avatarPicker} onPress={() => pickImage('image')} disabled={isLoading}>
              <Text style={styles.avatarPickerText}>تغيير الصورة</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.headerCard}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="اسم المجتمع"
            style={styles.input}
            maxLength={40}
            editable={!isLoading}
            textAlign="right"
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="وصف المجتمع (اختياري)"
            style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
            multiline
            maxLength={200}
            editable={!isLoading}
            textAlign="right"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>تم إنشاء المجتمع بنجاح!</Text>}
          <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={isLoading || name.length < 3} activeOpacity={0.7}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>إنشاء المجتمع</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f2f2f2',
    position: 'relative',
    marginBottom: 0,
    justifyContent: 'flex-end',
  },
  banner: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bannerPicker: {
    position: 'absolute',
    left: 16,
    bottom: 10,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  bannerPickerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -36,
    right: 24,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 20,
    backgroundColor: 'white',
    padding: 3,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarPicker: {
    marginTop: 6,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  avatarPickerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 48,
    marginBottom: 8,
    padding: 10,
    alignItems: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fafbfc',
    color: '#222',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  successText: {
    color: '#009f4d',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
});
