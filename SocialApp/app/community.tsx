import { useLocalSearchParams, useRouter } from 'expo-router';
import { UsersThree } from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ID, Query } from 'react-native-appwrite';
import Post from '../components/post';
import { account, communitiesCollectionId, communityMembersCollectionId, databaseId, safeListDocuments as oldSafeListDocuments, postsCollectionId, safeCreateDocument, safeListDocuments } from '../lib/appwrite';
import { communityType, PostType } from '../types/database.type';

const DEFAULT_BANNER = require('../assets/images/partial-react-logo.png');
const DEFAULT_IMAGE = require('../assets/images/partial-react-logo.png');

export default function Community() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [community, setCommunity] = useState<communityType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const scrollRef = useRef(null);
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [memberDocId, setMemberDocId] = useState<string | null>(null);
  const router = useRouter();

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await oldSafeListDocuments(
        databaseId,
        communitiesCollectionId,
        []
      );
      const comm = res.documents.find((doc: any) => doc.$id === id) as communityType;
      setCommunity(comm);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء جلب بيانات المجتمع');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await oldSafeListDocuments(
        databaseId,
        postsCollectionId,
        []
      );
      const filtered = res.documents.filter((post: any) => post.community && post.community.$id === id);
      setPosts(filtered as PostType[]);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء جلب منشورات المجتمع');
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchCommunity(), fetchPosts()]);
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadAll();
    }
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // Check if user is a member
  const checkMembership = async () => {
    try {
      const user = await account.get();
      const res = await safeListDocuments(
        databaseId,
        communityMembersCollectionId,
        [
          Query.equal('user', user.$id),
          Query.equal('community', id),
        ]
      );
      if (res.documents.length > 0) {
        setIsMember(true);
        setMemberDocId(res.documents[0].$id);
      } else {
        setIsMember(false);
        setMemberDocId(null);
      }
    } catch (e) {
      setIsMember(false);
      setMemberDocId(null);
    }
  };

  useEffect(() => {
    if (id) checkMembership();
  }, [id]);

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      const user = await account.get();
      await safeCreateDocument(
        databaseId,
        communityMembersCollectionId,
        ID.unique(),
        { user: user.$id, community: id }
      );
      setIsMember(true);
      checkMembership();
    } catch (e) {
      // Optionally show error
    }
    setJoinLoading(false);
  };

  const handleAddPost = () => {
    // Navigate to add post screen, passing community id
    router.push({ pathname: '/addPost', params: { communityId: id } });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0095f6" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={loadAll}>إعادة المحاولة</Text>
      </View>
    );
  }
  if (!community) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لم يتم العثور على المجتمع</Text>
      </View>
    );
  }

  const bannerSource = community.banner ? { uri: community.banner } : DEFAULT_BANNER;
  const imageSource = community.image ? { uri: community.image } : DEFAULT_IMAGE;
  const desc = (community as any).description || community.description || '';

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: 'white' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={() => setActivePostId(null)}
    >
      {/* Banner with gradient overlay */}
      <View style={styles.bannerContainer}>
        <Image source={bannerSource} style={styles.banner} resizeMode="cover" />
        <View style={styles.bannerGradient} />
        {/* Overlapping avatar */}
        <View style={styles.avatarWrapper}>
          <Image source={imageSource} style={styles.avatar} />
        </View>
      </View>
      {/* Community Card Enhanced */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.communityName}>{community.name}</Text>
          </View>
          <Pressable
            style={styles.joinButton}
            onPress={isMember ? handleAddPost : handleJoin}
            disabled={joinLoading}
          >
            <Text style={styles.joinButtonText}>
              {joinLoading ? '...' : isMember ? 'إضافة منشور' : 'انضم'}
            </Text>
          </Pressable>
        </View>
        {/* Full Description inside card, after name and join button */}
        <Text style={styles.communityDesc}>{desc}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <UsersThree size={16} color="#007AFF" weight="fill" style={{ marginLeft: 2 }} />
            <Text style={styles.statsText}>
              {community.memebers ? community.memebers.length : 0} أعضاء
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      {/* Posts */}
      <View style={{ width: '100%', padding: 0 }}>
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
            <Text style={styles.emptyStateText}>لا توجد منشورات في هذا المجتمع بعد.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f2f2f2',
    position: 'relative',
    marginBottom: 0,
    justifyContent: 'flex-end',
  },
  banner: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -36,
    right: 24,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 20,
    backgroundColor: 'white',
    padding: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: 'white',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 24,
    marginBottom: 8,
    padding: 10,
  },
  headerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  communityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 4,
  },
  communityDesc: {
    color: '#4B5563',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'right',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  statPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginLeft: 6,
    gap: 2,
  },
  statsText: {
    color: '#222',
    fontSize: 14,
    marginLeft: 2,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginLeft: 0,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F1F1',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 0,
    borderRadius: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    fontSize: 16,
    color: '#0095f6',
    textDecorationLine: 'underline',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
