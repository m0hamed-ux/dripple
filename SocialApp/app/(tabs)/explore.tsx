import { communitiesCollectionId, databaseId, databases, postsCollectionId, usersCollectionId } from "@/lib/appwrite";
import { communityType, PostType, UserType } from "@/types/database.type";
import { ResizeMode, Video } from 'expo-av';
import { Play } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const DEFAULT_COMMUNITY_IMAGE = require("../../assets/images/partial-react-logo.png");

export default function Explore() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [communities, setCommunities] = useState<communityType[]>([]);
  const [videos, setVideos] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersRes = await databases.listDocuments(databaseId, usersCollectionId);
        setUsers(usersRes.documents as UserType[]);
        // Fetch communities
        const commRes = await databases.listDocuments(databaseId, communitiesCollectionId);
        setCommunities(commRes.documents as communityType[]);
        // Fetch video posts
        const postsRes = await databases.listDocuments(databaseId, postsCollectionId);
        const videoPosts = (postsRes.documents as PostType[]).filter(post => post.video && post.video.length > 0);
        setVideos(videoPosts);
      } catch (e) {
        // handle error
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter by search
  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()));
  const filteredCommunities = communities.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredVideos = videos.filter(v => v.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={{ backgroundColor: "white" }}>
      <View style={styles.container}>
        <TextInput
          style={styles.searchBar}
          placeholder="بحث..."
          value={search}
          onChangeText={setSearch}
        />
        {loading ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} /> : <>
        {/* People You May Know */}
        <Text style={styles.sectionTitle}>أشخاص قد تعرفهم</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {filteredUsers.map(user => (
            <View key={user.$id} style={styles.userCard}>
              <Image source={{ uri: user.userProfile }} style={styles.avatar} />
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.userUsername} numberOfLines={1}>@{user.username}</Text>
              <Pressable style={styles.followButton}><Text style={{ color: "white", fontFamily: "Rubik-Medium" }}>متابعة</Text></Pressable>
            </View>
          ))}
        </ScrollView>
        {/* Communities You May Like */}
        <Text style={styles.sectionTitle}>مجتمعات قد تعجبك</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {filteredCommunities.map(comm => (
            <View key={comm.$id} style={styles.communityCard}>
              <Image source={comm.image ? { uri: comm.image } : DEFAULT_COMMUNITY_IMAGE} style={styles.communityImage} />
              <Text style={styles.communityName} numberOfLines={1}>{comm.name}</Text>
            </View>
          ))}
        </ScrollView>
        {/* Videos You May Like
        <Text style={styles.sectionTitle}>فيديوهات قد تعجبك</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {filteredVideos.map(video => (
            <View key={video.$id} style={styles.videoCard}>
              {video.video ? (
                <VideoPreview videoUrl={video.video} />
              ) : null}
            </View>
          ))}
        </ScrollView> */}
        </>}
      </View>
    </ScrollView>
  );
}

// Simple video preview (thumbnail or fallback)
function VideoPreview({ videoUrl }: { videoUrl: string }) {
  return (
    <View style={{ width: 120, height: 180, backgroundColor: '#eee', borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <Video
        source={{ uri: videoUrl }}
        style={{ width: 120, height: 180, position: 'absolute', top: 0, left: 0 }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isMuted
        usePoster
        posterStyle={{ width: 120, height: 180 }}
      />
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', width: 120, height: 180 }}>
        <Play size={24} color="#fff" weight="fill" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  searchBar: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    fontFamily: "Rubik-Regular",
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Rubik-Medium",
    marginVertical: 8,
    textAlign: "right",
  },
  horizontalList: {
    marginBottom: 16,
  },
  userCard: {
    width: 120,
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  userName: {
    fontFamily: "Rubik-Medium",
    fontSize: 15,
    marginBottom: 2,
    textAlign: "center",
  },
  userUsername: {
    fontFamily: "Rubik-Regular",
    fontSize: 12,
    color: "gray",
    marginBottom: 8,
    textAlign: "center",
  },
  followButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  communityCard: {
    width: 120,
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,

  },
  communityImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  communityName: {
    fontFamily: "Rubik-Medium",
    fontSize: 15,
    textAlign: "center",
  },
  videoCard: {
    width: 120,
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  videoTitle: {
    fontFamily: "Rubik-Medium",
    fontSize: 0,
    marginTop: 8,
    textAlign: "center",
  },
});