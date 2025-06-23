import { databaseId, databases, postsCollectionId, storiesCollectionId, usersCollectionId } from "@/lib/appwrite";
import { PostType, StoryType, UserType } from "@/types/database.type";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { I18nManager, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MyStory from "../../components/myStory";
import Post from "../../components/post";
import { useAuth } from "../../lib/auth";

I18nManager.forceRTL(true);

export default function Profile() {
  const { user: authUser, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [stories, setStories] = useState<StoryType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (!authUser) return;
    try {
      const res = await databases.listDocuments(databaseId, usersCollectionId);
      const userProfile = res.documents.find(doc => doc.userID === authUser.$id) as UserType;
      setProfile(userProfile);
    } catch (e) {
      setProfile(null);
    }
  };

  const fetchPosts = async () => {
    if (!authUser) return;
    try {
      const res = await databases.listDocuments(databaseId, postsCollectionId);
      const userPosts = res.documents.filter((doc: any) => doc.user && doc.user.userID === authUser.$id) as PostType[];
      setPosts(userPosts);
    } catch (e) {
      setPosts([]);
    }
  };

  const fetchStories = async () => {
    if (!authUser) return;
    try {
      const res = await databases.listDocuments(databaseId, storiesCollectionId);
      const userStories = res.documents.filter((doc: any) => doc.userID.userID === authUser.$id) as StoryType[];
      setStories(userStories);
    } catch (e) {
      setStories([]);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchStories();
  }, [authUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    await fetchPosts();
    await fetchStories();
    setRefreshing(false);
  }, [authUser]);

  return (
    <ScrollView
      style={{ backgroundColor: "#fff" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'column', alignItems: 'stretch' }}
    >
      {/* Username at the top */}
      <Text style={styles.usernameTop}>
        {profile?.username
          ? profile.username.length > 14
            ? profile.username.slice(0, 14) + '…'
            : profile.username
          : "اسم المستخدم"}
      </Text>
      {/* Profile row: MyStory in place of profile image, then stats */}
      <View style={styles.profileRow}>
        {profile && (
          <View style={styles.profileImageCol}>
            <MyStory user={profile} userStories={stories} onAddStory={() => router.push('/addStory')} />
          </View>
        )}
        <View style={styles.statsCol}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>المنشورات</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>المتابِعون</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>المتابَعون</Text>
        </View>
      </View>
      {/* Name, bio, links */}
      <View style={styles.infoSection}>
        {profile?.name && <Text style={styles.name}>{profile.name}</Text>}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>
      {/* Edit/Sign Out Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push("/configureAccount")}> 
          <Text style={styles.editBtnText}>تعديل الحساب</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => router.push('/addPost')}>
          <Text style={styles.signOutBtnText}>إضافة منشور</Text>
        </TouchableOpacity>
      </View>
      {/* Posts Feed (vertical, default Post component) */}
      <View style={styles.postsSection}>
        {posts.length === 0 ? (
          <Text style={styles.noPosts}>لا توجد منشورات بعد.</Text>
        ) : (
          posts.map(post => (
            <View key={post.$id} style={styles.postCard}>
              <Post
                postID={post.$id}
                title={post.title}
                content={post.content}
                user={post.user}
                image={post.images}
                link={post.link}
                video={post.video}
                createdAt={post.$createdAt}
                community={post.community}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  usernameTop: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#222',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
    gap: 8,
  },
  profileImageCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  profileImageWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  storyRing: {
    borderWidth: 3,
    borderColor: '#0095f6',
    padding: 2,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
  addStoryBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0095f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  myStoryRow: {
    alignItems: 'center',
    marginVertical: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    width: '100%',
  },
  myStoryRowCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statsCol: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Rubik-Regular',
  },
  infoSection: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#222',
    marginBottom: 2,
    textAlign: 'right',
    width: '100%',
  },
  bio: {
    fontSize: 13,
    color: '#222',
    fontFamily: 'Rubik-Regular',
    marginBottom: 2,
    textAlign: 'right',
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd80',
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: '#0095f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  editBtnText: {
    color: 'white',
    textAlign: "center",
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    flex: 1,
  },
  signOutBtn: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  signOutBtnText: {
    color: '#222',
    textAlign: "center",
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },
  postsSection: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 0,
    alignItems: 'center',
  },
  noPosts: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    marginTop: 16,
  },
  postCard: {
    width: '96%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
});