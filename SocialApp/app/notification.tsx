import { databaseId, notificationsCollectionId, safeListDocuments, safeUpdateDocument, usersCollectionId } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { NotificationType, UserType } from "@/types/database.type";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";

export default function Notification() {
  const { user: authUser, isLoadingUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserType | null>(null);
  const router = useRouter();

  const fetchCurrentUserProfile = async () => {
    if (!authUser) return null;
    
    try {
      console.log('Fetching user profile for authUser.$id:', authUser.$id);
      
      const response = await safeListDocuments(
        databaseId,
        usersCollectionId,
        [Query.equal('userID', authUser.$id)]
      );
      
      console.log('User profile response:', response.documents.length, 'documents found');
      
      if (response.documents.length > 0) {
        const userProfile = response.documents[0] as UserType;
        console.log('Found user profile:', userProfile.userID);
        return userProfile;
      }
      console.log('No user profile found');
      return null;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      return null;
    }
  };

  const fetchNotifications = async () => {
    if (!authUser || !currentUserProfile) return;
    
    try {
      console.log('Fetching notifications for userID:', currentUserProfile.userID);
      
      const response = await safeListDocuments(
        databaseId,
        notificationsCollectionId,
        [
          Query.equal('user', currentUserProfile.userID),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );
      
      console.log('User notifications found:', response.documents.length);
      console.log('Sample notification:', response.documents[0]);
      
      setNotifications(response.documents as NotificationType[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to load notifications');
    }
  };

  const markNotificationAsViewed = async (notificationId: string) => {
    try {
      await safeUpdateDocument(
        databaseId,
        notificationsCollectionId,
        notificationId,
        { isViewed: true }
      );
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.$id === notificationId 
            ? { ...notif, isViewed: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
    }
  };

  const markAllNotificationsAsViewed = async () => {
    try {
      const unviewedNotifications = notifications.filter(notif => !notif.isViewed);
      await Promise.all(
        unviewedNotifications.map(notif =>
          safeUpdateDocument(
            databaseId,
            notificationsCollectionId,
            notif.$id,
            { isViewed: true }
          )
        )
      );
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isViewed: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as viewed:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userProfile = await fetchCurrentUserProfile();
      setCurrentUserProfile(userProfile);
      if (userProfile) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser && !isLoadingUser) {
      loadData();
    } else if (!authUser && !isLoadingUser) {
      setIsLoading(false);
    }
  }, [authUser, isLoadingUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const userProfile = await fetchCurrentUserProfile();
      setCurrentUserProfile(userProfile);
      if (userProfile) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  }, [authUser]);

  useFocusEffect(
    React.useCallback(() => {
      if (authUser && currentUserProfile) {
        fetchNotifications();
        markAllNotificationsAsViewed();
      }
    }, [authUser, currentUserProfile])
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={24} color="#ff4757" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={24} color="#0095f6" />;
      case 'follow':
        return <Ionicons name="person-add" size={24} color="#2ed573" />;
      case 'verification':
        return <Ionicons name="checkmark-circle" size={24} color="#ffa502" />;
      default:
        return <Ionicons name="notifications" size={24} color="#747d8c" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'like':
        return 'إعجاب جديد';
      case 'comment':
        return 'تعليق جديد';
      case 'follow':
        return 'متابع جديد';
      case 'verification':
        return 'طلب التحقق';
      default:
        return 'إشعار جديد';
    }
  };

  const handleNotificationPress = async (notification: NotificationType) => {
    // Mark as viewed first
    if (!notification.isViewed) {
      await markNotificationAsViewed(notification.$id);
    }

    // Navigate based on target type
    switch (notification.targetType) {
      case 'user':
        if (notification.targetID) {
          router.push({
            pathname: '/userProfile',
            params: { id: notification.targetID }
          });
        }
        break;
      case 'post':
        if (notification.targetID) {
          router.push({
            pathname: '/postDetails',
            params: { id: notification.targetID }
          });
        }
        break;
      default:
        // For notifications without specific target, just mark as viewed
        break;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'الآن';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} دقيقة`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ساعة`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} يوم`;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0095f6" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={loadData}>إعادة المحاولة</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0095f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.$id}
              style={[
                styles.notificationItem,
                !notification.isViewed && styles.unviewedNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.type || 'default')}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {getNotificationTitle(notification.type || 'default')}
                </Text>
                <Text style={styles.notificationText} numberOfLines={2}>
                  {notification.content || 'إشعار جديد'}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatTimeAgo(notification.$createdAt)}
                </Text>
              </View>
              {!notification.isViewed && (
                <View style={styles.unviewedDot} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>لا توجد إشعارات</Text>
            <Text style={styles.emptyStateSubtext}>
              ستظهر هنا الإشعارات الجديدة عند وصولها
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  unviewedNotification: {
    backgroundColor: '#f8f9ff',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    color: '#999',
  },
  unviewedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095f6',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  retryText: {
    fontSize: 16,
    color: '#0095f6',
    textDecorationLine: 'underline',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
});
