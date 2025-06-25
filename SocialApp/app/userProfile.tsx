import { databaseId, databases, followersCollectionId, postsCollectionId, storiesCollectionId, usersCollectionId } from "@/lib/appwrite";
import { PostType, StoryType, UserType } from "@/types/database.type";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import Post from "../components/post";
import Story from "../components/story";
import { useAuth } from "../lib/auth";

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [stories, setStories] = useState<StoryType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!id) return;
    try {
      const res = await databases.getDocument(databaseId, usersCollectionId, id);
      setProfile(res as UserType);
      setFollowersCount(res.followers?.length || 0);
    } catch (e) {
      setProfile(null);
    }
  };

  // Fetch posts by user id
  const fetchPosts = async () => {
    if (!id) return;
    try {
      const res = await databases.listDocuments(databaseId, postsCollectionId);
      const userPosts = res.documents.filter((doc: any) => doc.user && doc.user.userID === id) as PostType[];
      setPosts(userPosts);
    } catch (e) {
      setPosts([]);
    }
  };

  // Fetch stories by user id, last 24h
  const fetchStories = async () => {
    if (!id) return;
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await databases.listDocuments(
        databaseId,
        storiesCollectionId,
        [
          Query.equal("userID.userID", id),
          Query.greaterThan("$createdAt", since),
        ]
      );
      setStories(res.documents as StoryType[]);
    } catch (e) {
      setStories([]);
    }
  };

  const checkIsFollowing = async () => {
    if (!authUser || !id) return;
    try {
      const res = await databases.listDocuments(databaseId, followersCollectionId, [
        Query.equal("FollowerUser", authUser.$id),
        Query.equal("FollowedUser", id),
      ]);
      if (res.documents.length > 0) {
        setIsFollowing(true);
        setFollowDocId(res.documents[0].$id);
      } else {
        setIsFollowing(false);
        setFollowDocId(null);
      }
    } catch (e) {
      console.log('Error checking follow status', e)
      setIsFollowing(false);
      setFollowDocId(null);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchStories();
    checkIsFollowing();
  }, [id, authUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    await fetchPosts();
    await fetchStories();
    await checkIsFollowing();
    setRefreshing(false);
  }, [id, authUser]);

  const handleFollow = async () => {
    if (followLoading || !authUser || !id) return;
    setFollowLoading(true);
    setIsFollowing(true);
    setFollowersCount(prev => prev + 1);

    try {
      const res = await databases.createDocument(
        databaseId,
        followersCollectionId,
        ID.unique(),
        { FollowerUser: authUser.$id, FollowedUser: id }
      );
      setFollowDocId(res.$id);
      await fetchProfile(); // re-sync count
    } catch (e) {
      console.log("Error following", e)
      setIsFollowing(false); // revert optimistic update
      setFollowersCount(prev => prev - 1); // revert optimistic update
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (followLoading || !followDocId) return;
    setFollowLoading(true);
    
    const wasFollowing = isFollowing;
    const oldFollowDocId = followDocId;

    setIsFollowing(false);
    setFollowDocId(null);
    setFollowersCount(prev => prev - 1);

    try {
      await databases.deleteDocument(databaseId, followersCollectionId, oldFollowDocId);
      await fetchProfile();
    } catch (e) {
      console.log("Error unfollowing", e)
      setIsFollowing(wasFollowing);
      setFollowDocId(oldFollowDocId);
      setFollowersCount(prev => prev + 1);
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = authUser && profile && profile.userID === authUser.$id;

    return (
    <ScrollView
      style={{ backgroundColor: "#fff" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'column', alignItems: 'stretch' }}
      onScrollBeginDrag={() => setActivePostId(null)}
    >
      {/* Username at the top */}
      <Text style={styles.usernameTop}>
        {profile?.username
          ? profile.username.length > 14
            ? profile.username.slice(0, 14) + '…'
            : profile.username
          : "اسم المستخدم"}
      </Text>
      {/* Profile row: Story in place of profile image, then stats */}
      <View style={styles.profileRow}>
        {profile && (
          <View style={styles.profileImageCol}>
            {stories.length > 0 ? (
              <Story user={profile} stories={stories} />
            ) : (
              <View style={styles.profileImageWrapper}>
                {profile.userProfile ? (
                  <Image source={{ uri: profile.userProfile }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, { backgroundColor: '#eee' }]} />
                )}
              </View>
            )}
          </View>
        )}
        <View style={styles.statsCol}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>المنشورات</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.statNumber}>
            {followersCount}
          </Text>
          <Text style={styles.statLabel}>المتابِعون</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.statNumber}>
            {profile?.following ? profile.following.length : 0}
          </Text>
            <Text style={styles.statLabel}>يَتَابِع</Text>
        </View>
      </View>
      {/* Name, bio, links */}
      <View style={styles.infoSection}>
        {profile?.name && <Text style={styles.name}>{profile.name}</Text>}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>
      {/* Follow Button */}
      {!isOwnProfile && profile && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.editBtn, isFollowing && { backgroundColor: '#eee' }]}
            onPress={isFollowing ? handleUnfollow : handleFollow}
            disabled={followLoading}
          >
            <Text style={[styles.editBtnText, isFollowing && { color: '#222' }]}>
              {followLoading ? '...' : isFollowing ? 'تمت المتابعة' : 'متابعة'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
                isActive={activePostId === post.$id}
                onPlay={() => setActivePostId(post.$id)}
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
    fontSize: 14,
    flex: 1,
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
});
