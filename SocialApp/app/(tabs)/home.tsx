import { databaseId, databases, postsCollectionId } from "@/lib/appwrite";
import { PostType } from "@/types/database.type";
import { Bell, ChatTeardrop } from "phosphor-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Post from "../../components/post";
import Story from "../../components/story";

export default function Home() {
  const [posts, setposts] = useState<PostType[]>();
  const [refreshing, setRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const scrollRef = useRef(null);

  // Function to shuffle an array
  const shuffleArray = (array: any) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchPosts = async () => {
    try {
      const respond = await databases.listDocuments(
        databaseId,
        postsCollectionId,
        // [Query.limit(50)]
      );
      let shuffledPosts = shuffleArray(respond.documents);
      setposts(shuffledPosts as PostType[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

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
                  backgroundColor: "red",
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
                  backgroundColor: "red",
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
            <Story />
            <Story />
            <Story />
            <Story />
            <Story />
            <Story />
          </ScrollView>
        </View>
        <Text style={{
            fontSize: 20,
            fontFamily: "Rubik-Medium",
            marginBottom: 10,
            textAlign: "right",
            width: "100%",
            paddingHorizontal: 10,
          }}>
          أحدث المنشورات
        </Text>
        <View id="postView" style={{
          width: "100%",
          padding: 0,
        }}>
          {posts && posts.map((post) => (
            <Post
              key={post.$id}
              postID={post.$id}
              title={post.title}
              content={post.content}
              userID={post.userID}
              image={post.images}
              link={post.link}
              video={post.video}
              createdAt={post.$createdAt}
              isActive={activePostId === post.$id}
              onPlay={() => setActivePostId(post.$id)}
            />
          ))}
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
  }
});