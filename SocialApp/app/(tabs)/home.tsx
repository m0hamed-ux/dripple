import { databaseId, notificationsCollectionId, postsCollectionId, safeListDocuments, storiesCollectionId, usersCollectionId } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { NotificationType, PostType, StoryType, UserType } from "@/types/database.type";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Models, Query } from "react-native-appwrite";
import MyStory from "../../components/myStory";
import Post from "../../components/post";
import Story from "../../components/story";

interface UserStories {
  user: Models.Document; 
  stories: StoryType[];
}

export default function Home() {
  const { user: authUser, isLoadingUser } = useAuth();
  const [posts, setposts] = useState<PostType[]>([]);
  const [groupedStories, setGroupedStories] = useState<UserStories[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserType | null>(null);
  const [currentUserStories, setCurrentUserStories] = useState<StoryType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const scrollRef = useRef(null);
  const router = useRouter();

  // Function to shuffle an array
  const shuffleArray = (array: any) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchNotificationCount = async () => {
    if (!authUser) return;
    
    try {
      const response = await safeListDocuments(
        databaseId,
        notificationsCollectionId,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );
      
      // Filter notifications for the current user and count unviewed ones
      const userNotifications = response.documents.filter(
        (notification: any) => notification.user && notification.user.userID === authUser.$id
      ) as NotificationType[];
      
      const unviewedCount = userNotifications.filter(notification => !notification.isViewed).length;
      setNotificationCount(unviewedCount);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  };

  const fetchCurrentUserProfile = async () => {
    if (!authUser) return;
    
    try {
      const response = await safeListDocuments(
        databaseId,
        usersCollectionId,
        // [Query.equal('userID', authUser.$id)]
      );
      const userProfile = response.documents.find(doc => doc.userID === authUser.$id) as UserType;
      setCurrentUserProfile(userProfile);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user profile');
    }
  };

  const fetchPosts = async () => {
    try {
      const respond = await safeListDocuments(
        databaseId,
        postsCollectionId,
        // [Query.limit(50)]
      );
      let shuffledPosts = shuffleArray(respond.documents);
      setposts(shuffledPosts as PostType[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load posts');
    }
  };

  const fetchStories = async () => {
    try {
      const respond = await safeListDocuments(
        databaseId,
        storiesCollectionId,
        [
          Query.notEqual('userID', authUser ? authUser.$id : ''),
          Query.orderDesc('$createdAt'),
          Query.greaterThan('$createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Last 24 hours
        ]
      );
      const stories = respond.documents as StoryType[];
      
      // Filter current user's stories
      if (authUser) {
        const userStories = stories.filter(story => story.userID.userID === authUser.$id);
        setCurrentUserStories(userStories);
      }
      
      // Filter out current user's stories from the main list
      const otherUsersStories = authUser 
        ? stories.filter(story => story.userID.userID !== authUser.$id)
        : stories;
      
      const storiesByUser = otherUsersStories.reduce((acc, story) => {
        const userId = story.userID.$id;
        if (!acc[userId]) {
          acc[userId] = {
            user: story.userID,
            stories: []
          };
        }
        acc[userId].stories.push(story);
        return acc;
      }, {} as Record<string, UserStories>);

      setGroupedStories(Object.values(storiesByUser));
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load stories');
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCurrentUserProfile(),
        fetchPosts(),
        fetchStories(),
        fetchNotificationCount()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser && !isLoadingUser) {
      loadAllData();
    } else if (!authUser && !isLoadingUser) {
      setIsLoading(false);
    }
  }, [authUser, isLoadingUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchCurrentUserProfile(),
        fetchPosts(),
        fetchStories(),
        fetchNotificationCount()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh content');
    } finally {
      setRefreshing(false);
    }
  }, [authUser]);

  const handleAddStory = () => {
    router.push('/addStory');
  };

  // Handler to refresh posts after deletion
  const handlePostDeleted = () => {
    fetchPosts();
  };

  useFocusEffect(
    React.useCallback(() => {
      // Refresh notification count when screen comes into focus
      if (authUser) {
        fetchNotificationCount();
      }
      return () => {
        setActivePostId(null); // Pause all videos on blur
      };
    }, [authUser])
  );

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
        <Text style={styles.retryText} onPress={loadAllData}>إعادة المحاولة</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScrollBeginDrag={() => setActivePostId(null)}
    >
      <View style={styles.view}>
        <View id="header" style={{width: "100%", paddingHorizontal: 10, paddingTop: 10, paddingBottom: 0, display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between"}}>
            <Text style={{
            fontSize: 24,
            fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold",
            marginBottom: 0,
            textAlign: "right",
            }}>
            {currentUserProfile ? `مرحباً بك ${currentUserProfile.name}` : 'مرحباً بك'}
            </Text>
            <View style={{display: "flex", flexDirection: "row-reverse", gap: 10, alignItems: "center"}}>
              <View style={{ position: 'relative' }}>
                <Ionicons
                name="notifications-outline"
                size={28}
                color="#0095f6"
                style={{ marginLeft: 8 }}
                onPress={() => router.push('/notification')}
                />
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
        </View>
        <View style={{ width: "100%", marginBottom: 10, paddingBottom: 0 }}>
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              padding: 10,
              paddingBottom: 0,
              flexDirection: 'row', // RTL direction
            }}
            style={{ direction: 'rtl' }} // For web, ignored on native
            >
            {currentUserProfile && (
              <MyStory
              user={currentUserProfile}
              userStories={currentUserStories}
              onAddStory={handleAddStory}
              />
            )}
            {groupedStories.map(({ user, stories }) => (
              <Story
              key={user.$id}
              user={user}
              stories={stories}
              />
            ))}
            </ScrollView>
        </View>
        <View style={{ width: "100%", paddingHorizontal: 10, paddingBottom: 10 }}>
          <Text style={{
            fontSize: 20,
            fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold",
            marginBottom: 10,
            textAlign: "right",
          }}>
            المنشورات
          </Text>
        </View>
        <View id="postView" style={{
          width: "100%",
          padding: 0,
        }}>
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Post
                key={post.$id}
                postID={post.$id}
                title={post.title}
                content={post.content}
                user={post.user}
                image={post.images}
                link={post.link}
                video={post.video}
                createdAt={post.$createdAt}
                isActive={activePostId === post.$id}
                community={post.community}
                onPlay={() => setActivePostId(post.$id)}
                onDelete={handlePostDeleted}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>لا توجد منشورات متاحة</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignItems: "center",
    padding: 0,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  retryText: {
    fontSize: 16,
    color: "#0095f6",
    textDecorationLine: "underline",
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    textAlign: 'center',
  },
});