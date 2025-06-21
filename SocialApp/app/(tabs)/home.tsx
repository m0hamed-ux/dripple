import { Text, View, StyleSheet, ScrollView} from "react-native";
import Post from "../../components/post";
import Story from "../../components/story";
import { databases, databaseId, postsCollectionId } from "@/lib/appwrite";
import { useState, useEffect } from "react";
import { PostType } from "@/types/database.type";

export default function Home() {
  const [posts, setposts] = useState<PostType[]>();
  useEffect(() => {
    fetchPosts();
  }, []);
  const fetchPosts = async () => {
    try {
      const respond = await databases.listDocuments(
        databaseId,
        postsCollectionId,
      );

      setposts(respond.documents as PostType[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }
  return (
    <ScrollView showsVerticalScrollIndicator={false} >
      <View style={styles.view}>
        <View id="header" style={{width: "100%", paddingHorizontal: 10}}>
          <Text style={{
            fontSize: 24,
            fontFamily: "Rubik-Medium",
            marginBottom: 0,
            textAlign: "right",
            width: "100%",
          }}>الصفحة الرئيسية</Text>
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
              content={post.content}
              userID={post.userID}
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
    // justifyContent: "center",
    alignItems: "center",
    padding: 0,
    backgroundColor: "white",
  }
});