import { databaseId, databases, postsCollectionId, storiesCollectionId, usersCollectionId } from "@/lib/appwrite";
import { PostType, StoryType, UserType } from "@/types/database.type";
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Animated, Easing, I18nManager, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerAnim = React.useRef(new Animated.Value(-300)).current; // Drawer width

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

  // Drawer open/close animation (now from right)
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: -300,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setDrawerVisible(false));
  };

  return (
    <>
      {/* Hamburger icon to open drawer (now on right) */}
      <View style={{ position: 'absolute', top: 36, right: 18, zIndex: 20 }}>
        <Pressable onPress={openDrawer}>
          <Feather name="menu" size={28} color="#222" />
        </Pressable>
      </View>
      {/* Drawer overlay and content (now from right) */}
      {drawerVisible && (
        <>
          <Pressable style={styles.drawerOverlay} onPress={closeDrawer} />
          <Animated.View style={[styles.drawer, { right: drawerAnim, left: undefined }]}>  
            {/* User info at top with background */}
            <View style={styles.drawerUserInfoBg}>
              <View style={styles.drawerUserInfo}>
                {profile && (
                  <MyStory user={profile} userStories={stories} onAddStory={() => { closeDrawer(); router.push('/addStory'); }} />
                )}
                <Text style={styles.drawerUsername}>{profile?.username || 'اسم المستخدم'}</Text>
                <Text style={styles.drawerName}>{profile?.name || ''}</Text>
              </View>
            </View>
            {/* Drawer menu items with icons */}
            <View style={styles.drawerMenu}>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); router.push('/configureAccount'); }}>
                <Feather name="edit" size={20} color="#0095f6" style={styles.drawerMenuIcon} />
                <Text style={styles.menuText}>تعديل الحساب</Text>
              </Pressable>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); router.push('/mycommunities'); }}>
                <MaterialIcons name="groups" size={20} color="#0095f6" style={styles.drawerMenuIcon} />
                <Text style={styles.menuText}>مجتمعاتي</Text>
              </Pressable>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); router.push('/reqVer'); }}>
                <Feather name="check-circle" size={20} color="#0095f6" style={styles.drawerMenuIcon} />
                <Text style={styles.menuText}>طلب التحقق</Text>
              </Pressable>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); router.push('/appInfo'); }}>
                <Feather name="info" size={20} color="#0095f6" style={styles.drawerMenuIcon} />
                <Text style={styles.menuText}>معلومات التطبيق</Text>
              </Pressable>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); router.push('/privacy_terms'); }}>
                <Feather name="shield" size={20} color="#0095f6" style={styles.drawerMenuIcon} />
                <Text style={styles.menuText}>الخصوصية والشروط</Text>
              </Pressable>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); alert('تغيير كلمة المرور قادم قريباً'); }}>
                <Feather name="lock" size={20} color="#0095f6" style={styles.drawerMenuIcon} />
                <Text style={styles.menuText}>تغيير كلمة المرور</Text>
              </Pressable>
              <Pressable style={styles.drawerMenuItem} onPress={() => { closeDrawer(); signOut(); router.push('/'); }}>
                <Feather name="log-out" size={20} color="#d00" style={styles.drawerMenuIcon} />
                <Text style={[styles.menuText, { color: '#d00' }]}>تسجيل الخروج</Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
      <ScrollView
        style={{ backgroundColor: "#fff" }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* Username at the top with menu button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 8, paddingHorizontal: 20 }}>
          <Text style={styles.usernameTop}>
            {profile?.username
              ? profile.username.length > 14
                ? profile.username.slice(0, 14) + '…'
                : profile.username
              : "اسم المستخدم"}
          </Text>
        </View>
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
            <Text style={styles.statNumber}>
              {profile?.followers ? profile.followers.length : 0}
            </Text>
            <Text style={styles.statLabel}>المتابِعون</Text>
          </View>
          <View style={styles.statsCol}>
            <Text style={styles.statNumber}>
              {profile?.following ? profile.following.length : 0}
            </Text>
              <Text style={styles.statLabel}>تتابِع</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  usernameTop: {
    fontSize: 18,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
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
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
  infoSection: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    
    color: '#222',
    marginBottom: 2,
    textAlign: 'right',
    width: '100%',
  },
  bio: {
    fontSize: 13,
    color: '#222',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
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
    fontSize: 14,
    flex: 1,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
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
    fontSize: 14,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
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
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
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
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 19,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 300,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 20,
    paddingTop: 0,
    paddingHorizontal: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  drawerUserInfoBg: {
    backgroundColor: '#f3f7fa',
    paddingTop: 36,
    paddingBottom: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  drawerUserInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerUsername: {
    fontSize: 18,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#222',
    marginTop: 10,
  },
  drawerName: {
    fontSize: 15,
    color: '#888',
    marginTop: 2,
    marginBottom: 4,
  },
  drawerMenu: {
    marginTop: 18,
    paddingHorizontal: 18,
  },
  drawerMenuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  drawerMenuIcon: {
    marginLeft: 8,
    marginRight: 0,
  },
  drawerCancel: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 18,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  menuText: {
    fontSize: 16,
    color: '#222',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
});