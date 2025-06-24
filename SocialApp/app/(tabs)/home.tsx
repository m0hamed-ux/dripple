import { databaseId, postsCollectionId, safeListDocuments, storiesCollectionId, usersCollectionId } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { PostType, StoryType, UserType } from "@/types/database.type";
import { useRouter } from "expo-router";
import { Bell, ChatTeardrop } from "phosphor-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Models } from "react-native-appwrite";
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
        // [Query.limit(50)]
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
        fetchStories()
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
        fetchStories()
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
            fontFamily: "Rubik-Medium",
            marginBottom: 0,
            textAlign: "right",
          }}>الصفحة الرئيسية</Text>
            <View style={{display: "flex", flexDirection: "row-reverse", gap: 10, alignItems: "center"}}>
              <View style={{position: "relative"}}>
                <Bell size={24} color="gray" weight="fill" />
                <View
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#0095f6',
                  borderWidth: 1,
                  borderColor: "white",
                }}
                />
              </View>
              <View style={{position: "relative"}}>
                <ChatTeardrop size={24} color="gray" weight="fill" />
                <View
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#0095f6',
                  borderWidth: 1,
                  borderColor: "white",
                }}
                />
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
            }}
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
    fontFamily: "Rubik-Regular",
    color: "#666",
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
    fontFamily: "Rubik-Regular",
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryText: {
    fontSize: 16,
    fontFamily: "Rubik-Regular",
    color: "#0095f6",
    textDecorationLine: "underline",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Rubik-Regular",
    color: "#666",
    textAlign: "center",
  }
});