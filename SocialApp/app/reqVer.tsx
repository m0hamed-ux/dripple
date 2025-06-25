import * as DocumentPicker from 'expo-document-picker';
import { ShieldCheck, XCircle } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ID, Query } from 'react-native-appwrite';
import { account, databaseId, imagesStorageId, safeCreateDocument, safeListDocuments, storage, verificationReqCollectionId } from '../lib/appwrite';

const statusColors = {
  pending: '#f7b731',
  approved: '#20bf6b',
  rejected: '#eb3b5a',
};

const ReqVer = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingReq, setExistingReq] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReq = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await account.get();
        setUserId(user.$id);
        // Check for existing verification request
        const res = await safeListDocuments(
          databaseId,
          verificationReqCollectionId,
          [Query.equal('userID', user.$id)]
        );
        if (res && res.documents && res.documents.length > 0) {
          setExistingReq(res.documents[0]);
        }
      } catch (e: any) {
        setError(e.message || 'حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchReq();
  }, []);

  const pickImage = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result?.canceled) return;
      const file = result.assets[0];
      if (file && typeof file.size === 'number' && file.size > 52428800) {
        setError('الحد الأقصى لحجم الصورة هو 50 ميغابايت');
        return;
      }
      if (file && file.mimeType?.startsWith('image/')) {
        setIsUploading(true);
        try {
          const response = await storage.createFile(
            imagesStorageId,
            ID.unique(),
            {
              uri: file.uri,
              name: file.name,
              type: file.mimeType,
              size: file.size ?? 0,
            }
          );
          const url = `https://fra.cloud.appwrite.io/v1/storage/buckets/${imagesStorageId}/files/${response.$id}/view?project=685bce8d0026ef276c37&mode=admin`;
          setIdCardImage(url);
        } catch (e: any) {
          setError('حدث خطأ أثناء رفع الصورة');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (e: any) {
      setError('حدث خطأ أثناء اختيار الصورة');
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setIdCardImage(null);
  };

  const handleSubmit = async () => {
    if (!fullName || !idCardImage || !userId) {
      setError('يرجى إدخال جميع البيانات المطلوبة');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await safeCreateDocument(
        databaseId,
        verificationReqCollectionId,
        ID.unique(),
        {
          userID: userId,
          status: 'pending',
          idCardImage,
          fullName,
        }
      );
      setExistingReq({ status: 'pending', idCardImage, fullName });
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0095f6" />
        <Text style={{ marginTop: 12 }}>جاري التحميل...</Text>
      </View>
    );
  }

  if (existingReq && existingReq.status !== 'rejected') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <ShieldCheck size={32} color="#0095f6" weight="fill" style={{ marginLeft: 8 }} />
            <Text style={styles.headerText}>طلب التحقق</Text>
          </View>
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <Text style={styles.label}>الاسم الكامل:</Text>
            <Text style={styles.value}>{existingReq.fullName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[existingReq.status as keyof typeof statusColors] || '#888' }]}> 
              <Text style={styles.statusText}>
                {existingReq.status === 'pending' ? 'قيد المراجعة' : existingReq.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
              </Text>
            </View>
            {existingReq.idCardImage && (
              <Image source={{ uri: existingReq.idCardImage }} style={styles.imagePreview} resizeMode="contain" />
            )}
          </View>
          <Text style={styles.infoText}>لا يمكنك إرسال طلب جديد حتى يتم مراجعة الطلب الحالي.</Text>
        </View>
      </View>
    );
  }

  // If rejected, show the form again with a rejection message
  const showRejection = existingReq && existingReq.status === 'rejected';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f6fafd' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <ShieldCheck size={32} color="#0095f6" weight="fill" style={{ marginLeft: 8 }} />
            <Text style={styles.headerText}>طلب التحقق</Text>
          </View>
          {showRejection && (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.rejected }]}> 
                <Text style={styles.statusText}>مرفوض</Text>
              </View>
              <Text style={[styles.infoText, { color: '#eb3b5a' }]}>تم رفض طلبك السابق. يمكنك المحاولة مرة أخرى.</Text>
            </View>
          )}
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            placeholder="الاسم الكامل"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholderTextColor="#b0b0b0"
          />
          <Text style={styles.label}>صورة بطاقة الهوية</Text>
          <View style={{ width: '100%', alignItems: 'center', marginBottom: 16 }}>
            {idCardImage ? (
              <View style={{ position: 'relative', width: 220, height: 140 }}>
                <Image source={{ uri: idCardImage }} style={styles.imagePreview} resizeMode="contain" />
                <TouchableOpacity
                  onPress={handleRemoveImage}
                  style={styles.removeImageBtn}
                  activeOpacity={0.7}
                >
                  <XCircle size={28} color="#eb3b5a" weight="fill" />
                </TouchableOpacity>
              </View>
            ) : isUploading ? (
              <ActivityIndicator size="large" color="#0095f6" />
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn} activeOpacity={0.7}>
                <Text style={{ color: '#888', fontSize: 16 }}>اضغط لاختيار صورة بطاقة الهوية</Text>
              </TouchableOpacity>
            )}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!fullName || !idCardImage || submitting}
            style={[styles.submitBtn, { backgroundColor: !fullName || !idCardImage ? '#a3a3a3' : '#0095f6', opacity: submitting ? 0.7 : 1 }]}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>إرسال الطلب</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6fafd',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 24,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerText: {
    fontSize: 24,
    color: '#0095f6',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  label: {
    fontSize: 16,
    color: '#222',
    textAlign: 'right',
    alignSelf: 'flex-end',
    marginBottom: 6,
    marginTop: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right',
    backgroundColor: '#fafbfc',
  },
  imagePreview: {
    width: 220,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f2f2f2',
  },
  imagePickerBtn: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    width: 220,
    height: 140,
    justifyContent: 'center',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -12,
    left: -12,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 2,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 8,
    alignSelf: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  infoText: {
    color: '#888',
    marginTop: 18,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#eb3b5a',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 15,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReqVer;
