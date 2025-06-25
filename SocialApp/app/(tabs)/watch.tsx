import { account, commentsCollectionId, databaseId, databases, followersCollectionId, likesCollectionId, postsCollectionId, usersCollectionId } from "@/lib/appwrite";
import { PostType, UserType } from "@/types/database.type";
import { useFocusEffect } from "@react-navigation/native";
import { ResizeMode, Video } from 'expo-av';
import { useRouter } from "expo-router";
import { ChatTeardrop, Heart, Play, SealCheck } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ID, Query } from "react-native-appwrite";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const VIDEO_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

export default function Watch() {
  const [videos, setVideos] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likes, setLikes] = useState<{ [postId: string]: number }>({});
  const [comments, setComments] = useState<{ [postId: string]: number }>({});
  const [userLiked, setUserLiked] = useState<{ [postId: string]: boolean }>({});
  const [commentModal, setCommentModal] = useState<{ visible: boolean, postId: string | null }>({ visible: false, postId: null });
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const swipeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [pausedVideos, setPausedVideos] = useState<{ [index: number]: boolean }>({});
  const lastTapRef = useRef<number | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHeart, setShowHeart] = useState<{ [index: number]: boolean }>({});
  const heartAnim = useRef<{ [index: number]: Animated.Value }>({});
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [isFollowingMap, setIsFollowingMap] = useState<{ [userId: string]: boolean }>({});
  const [followDocIdMap, setFollowDocIdMap] = useState<{ [userId: string]: string | null }>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<{ [userId: string]: boolean }>({});

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const postsRes = await databases.listDocuments(databaseId, postsCollectionId, [
        Query.orderDesc('$createdAt')
      ]);
      const videoPosts = (postsRes.documents as PostType[]).filter(post => post.video && post.video.length > 0);
      setVideos(videoPosts);
      const likesMap: { [postId: string]: number } = {};
      const userLikedMap: { [postId: string]: boolean } = {};
      const commentsMap: { [postId: string]: number } = {};
      let currentUserId = null;
      try {
        const user = await account.get();
        currentUserId = user.$id;
      } catch {}

      // Batch check follow status
      if (currentUserId) {
        const authorIds = [...new Set(videoPosts.map(p => p.user?.$id).filter(id => id && id !== currentUserId))] as string[];
        if (authorIds.length > 0) {
          try {
            const followRes = await databases.listDocuments(databaseId, followersCollectionId, [
              Query.equal('FollowerUser', currentUserId),
              Query.equal('FollowedUser', authorIds)
            ]);
            const followingMap: { [userId: string]: boolean } = {};
            const docIdMap: { [userId: string]: string | null } = {};
            for (const doc of followRes.documents) {
              const followedUserId = (doc.FollowedUser as UserType).$id ?? doc.FollowedUser;
              followingMap[followedUserId] = true;
              docIdMap[followedUserId] = doc.$id;
            }
            setIsFollowingMap(followingMap);
            setFollowDocIdMap(docIdMap);
          } catch (e) {
            console.error("Error checking follow statuses:", e);
          }
        }
      }

      for (const v of videoPosts) {
        try {
          // Likes count
          const likesRes = await databases.listDocuments(databaseId, likesCollectionId, [
            Query.equal('posts', v.$id)
          ]);
          likesMap[v.$id] = likesRes.documents.length;
          // User liked
          if (currentUserId) {
            const userLikedRes = await databases.listDocuments(databaseId, likesCollectionId, [
              Query.equal('userID', currentUserId),
              Query.equal('posts', v.$id)
            ]);
            userLikedMap[v.$id] = userLikedRes.documents.length > 0;
          }
          // Comments count
          const commentsRes = await databases.listDocuments(databaseId, commentsCollectionId, [
            Query.equal('posts', v.$id)
          ]);
          commentsMap[v.$id] = commentsRes.documents.length;
        } catch {}
      }
      setLikes(likesMap);
      setComments(commentsMap);
      setUserLiked(userLikedMap);
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    // Fetch current user for comment input avatar
    const fetchUser = async () => {
      try {
        const user = await account.get();
        const res = await databases.listDocuments(
          databaseId,
          usersCollectionId,
          [Query.equal('userID', user.$id)]
        );
        setCurrentUser(res.documents[0] as UserType);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Fetch comments for modal
  const openCommentModal = async (postId: string) => {
    setCommentModal({ visible: true, postId });
    setCommentLoading(true);
    try {
      const res = await databases.listDocuments(databaseId, commentsCollectionId, [
        Query.equal('posts', postId),
        Query.orderDesc('$createdAt')
      ]);
      setCommentList(res.documents);
    } catch {
      setCommentList([]);
    }
    setCommentLoading(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !commentModal.postId) return;
    setSendingComment(true);
    try {
      const user = await account.get();
      await databases.createDocument(databaseId, commentsCollectionId, ID.unique(), {
        posts: commentModal.postId,
        userID: user.$id,
        comment: newComment,
      });
      setNewComment("");
      openCommentModal(commentModal.postId);
    } catch {}
    setSendingComment(false);
  };

  // Like/unlike logic (optimistic UI)
  const handleLike = async (postId: string) => {
    try {
      const user = await account.get();
      if (userLiked[postId]) {
        setUserLiked(prev => ({ ...prev, [postId]: false }));
        setLikes(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
        // Unlike
        const response = await databases.listDocuments(
          databaseId,
          likesCollectionId,
          [Query.equal('userID', user.$id), Query.equal('posts', postId)]
        );
        if (response.documents.length > 0) {
          await databases.deleteDocument(
            databaseId,
            likesCollectionId,
            response.documents[0].$id
          );
        }
      } else {
        setUserLiked(prev => ({ ...prev, [postId]: true }));
        setLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
        // Like
        await databases.createDocument(
          databaseId,
          likesCollectionId,
          ID.unique(),
          {
            userID: user.$id,
            posts: postId,
          }
        );
      }
    } catch (error) {
      // Optionally revert UI if failed
    }
  };

  const handleFollow = async (userId: string) => {
    if (followLoadingMap[userId] || !currentUser || !userId) return;
    setFollowLoadingMap(prev => ({ ...prev, [userId]: true }));
    setIsFollowingMap(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await databases.createDocument(
        databaseId,
        followersCollectionId,
        ID.unique(),
        { FollowerUser: currentUser.$id, FollowedUser: userId }
      );
      setFollowDocIdMap(prev => ({ ...prev, [userId]: res.$id }));
    } catch (e) {
      console.log("Error following", e)
      setIsFollowingMap(prev => ({ ...prev, [userId]: false })); // revert
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId: string) => {
    const followDocId = followDocIdMap[userId];
    if (followLoadingMap[userId] || !followDocId) return;

    setFollowLoadingMap(prev => ({ ...prev, [userId]: true }));
    
    const wasFollowing = isFollowingMap[userId];
    const oldFollowDocId = followDocId;

    setIsFollowingMap(prev => ({ ...prev, [userId]: false }));
    setFollowDocIdMap(prev => ({ ...prev, [userId]: null }));

    try {
      await databases.deleteDocument(databaseId, followersCollectionId, oldFollowDocId);
    } catch (e) {
      console.log("Error unfollowing", e)
      setIsFollowingMap(prev => ({ ...prev, [userId]: wasFollowing }));
      setFollowDocIdMap(prev => ({ ...prev, [userId]: oldFollowDocId }));
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Fix swipe skipping: update activeIndex only, do not call scrollToIndex
  const onMomentumScrollEnd = (ev: any) => {
    const index = Math.round(ev.nativeEvent.contentOffset.y / VIDEO_HEIGHT);
    setActiveIndex(index);
  };

  // TikTok-style tap handler
  const handleVideoTap = (index: number, postId: string) => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      // Double tap
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      lastTapRef.current = null;
      // Only like if not already liked
      if (!userLiked[postId]) {
        handleLike(postId);
      }
      // Heart animation (always show)
      if (!heartAnim.current[index]) heartAnim.current[index] = new Animated.Value(0);
      setShowHeart(prev => ({ ...prev, [index]: true }));
      heartAnim.current[index].setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(heartAnim.current[index], {
            toValue: 0.7,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim.current[index], {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          })
        ]),
        Animated.delay(250), // Hold
        Animated.timing(heartAnim.current[index], {
          toValue: 2,
          duration: 350,
          useNativeDriver: true,
        })
      ]).start(() => setShowHeart(prev => ({ ...prev, [index]: false })));
    } else {
      lastTapRef.current = now;
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap: toggle pause/play
        setPausedVideos(prev => ({ ...prev, [index]: !prev[index] }));
        lastTapRef.current = null;
      }, 300);
    }
  };

  const renderItem = ({ item, index }: { item: PostType, index: number }) => {
    const user = item.user;
    const isPaused = pausedVideos[index];
    const showHeartNow = showHeart[index];
    const heartScale = heartAnim.current[index] || new Animated.Value(0);
    const isOwnVideo = currentUser && user && currentUser.$id === user.$id;
    const isFollowing = user ? isFollowingMap[user.$id] : false;
    const isFollowLoading = user ? followLoadingMap[user.$id] : false;
    return (
      <View style={styles.videoContainer}>
        <View style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <Pressable style={{ flex: 1, width: '100%', height: '100%' }} onPress={() => handleVideoTap(index, item.$id)}>
            <Video
              source={{ uri: item.video || '' }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isFocused && activeIndex === index && !isPaused}
              isMuted={false}
              isLooping={true}
            />
            {/* Heart pop-up animation */}
            {showHeartNow && (
              <Animated.View style={{
                position: 'absolute',
                top: '45%',
                left: 0,
                right: 0,
                alignItems: 'center',
                transform: [
                  { scale: heartScale.interpolate({ inputRange: [0, 0.7, 1, 2], outputRange: [0.5, 1.4, 1.0, 0.5] }) },
                  { rotate: heartScale.interpolate({ inputRange: [0, 0.5, 1, 2], outputRange: ['-15deg', '0deg', '15deg', '0deg'] }) },
                ],
                opacity: heartScale.interpolate({ inputRange: [0, 0.7, 1.5, 2], outputRange: [0, 1, 1, 0] })
              }}>
                <Heart size={90} color="#fff" weight="fill" />
              </Animated.View>
            )}
            {/* Pause icon overlay */}
            {isPaused && (
              <View style={{ position: 'absolute', top: '45%', left: 0, right: 0, alignItems: 'center' }}>
                <Play size={70} color="#fff" weight="fill" style={{ opacity: 0.8 }} />
              </View>
            )}
          </Pressable>
        </View>
        {/* Overlay UI */}
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Right side icons */}
            <View style={styles.rightIcons}>
              <Pressable style={styles.iconButton} onPress={() => handleLike(item.$id)}>
              <View style={styles.iconContainer}>
                {/* Shadow (fake background icon) */}
                <Heart
                size={42}
                color="rgba(0, 0, 0, 0.25)"
                style={styles.shadowIcon}
                />
                {/* Actual icon */}
                <Heart
                size={40}
                color={userLiked[item.$id] ? '#ff4757' : '#fff'}
                weight={userLiked[item.$id] ? 'fill' : 'regular'}
                />
              </View>
              {/* Shadow for text */}
              <Text style={[styles.countText, { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>
                {likes[item.$id] || 0}
              </Text>
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => openCommentModal(item.$id)}>
              <View style={styles.iconContainer}>
                {/* Shadow (fake background icon) */}
                <ChatTeardrop
                size={42}
                color="rgba(0, 0, 0, 0.25)"
                style={styles.shadowIcon}
                />
                {/* Actual icon */}
                <ChatTeardrop
                size={40}
                color="#fff"
                weight="regular"
                />
              </View>
              {/* Shadow for text */}
              <Text style={[styles.countText, { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>
                {comments[item.$id] || 0}
              </Text>
              </Pressable>
            </View>
          {/* Bottom left info */}
          <View style={styles.bottomInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {user && user.userProfile && (
                <Pressable onPress={() => router.push({ pathname: '/userProfile', params: { id: user?.$id } })}>
                  <Image source={{ uri: user.userProfile }} style={styles.avatar} />
                </Pressable>
              )}
              <Pressable onPress={() => router.push({ pathname: '/userProfile', params: { id: user?.$id } })}>
                <Text style={[styles.userName, { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>{user ? user.name : 'مستخدم'}</Text>
              </Pressable>
              {!isOwnVideo && user && (
                <Pressable
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={() => (isFollowing ? handleUnfollow(user.$id) : handleFollow(user.$id))}
                  disabled={isFollowLoading}
                >
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowLoading ? '...' : isFollowing ? 'يتابع' : 'متابعة'}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text numberOfLines={1} style={[styles.title, { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>{item.title}</Text>
          </View>
        </View>
        {/* Comment Modal */}
        {commentModal.visible && commentModal.postId === item.$id && (
          <Modal
            visible={commentModal.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCommentModal({ visible: false, postId: null })}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' }}
            >
              <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 300, maxHeight: '80%', paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, flex: 1, justifyContent: 'flex-start', display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                  <Pressable onPress={() => setCommentModal({ visible: false, postId: null })} style={{ position: 'absolute', right: 16, padding: 8 }}>
                    <Text style={{ fontSize: 22, color: '#222' }}></Text>
                  </Pressable>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1}}>التعليقات</Text>
                </View>
                <View style={{ height: 1, backgroundColor: '#eee', marginBottom: 0 }} />
                {/* Comments List */}
                <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 4 }}>
                  {commentLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="gray" style={{ marginVertical: 20 }} />
                    </View>
                  ) : commentList.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text>لا توجد تعليقات بعد.</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={commentList}
                      keyExtractor={item => item.$id}
                      renderItem={({ item }) => (
                        <View key={item.$id}>
                          <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 12 }}>
                            <Image
                              source={{ uri: item.userID && typeof item.userID === 'object' && item.userID.userProfile ? item.userID.userProfile : undefined }}
                              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', marginLeft: 10 }}
                            />
                            <View style={{ flex: 1, justifyContent: "center" }}>
                              <View style={{ display:"flex", flexDirection:"row-reverse", gap: 5, alignContent:"center", alignItems:"center" }}>
                                <View style={{ display: "flex", flexDirection: "row", alignItems: "center", gap : 2}}>
                                  { item.userID && item.userID.verified && (
                                    <SealCheck size={14} color="#0095f6" weight="fill" />
                                  )}
                                  <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{typeof item.userID === 'object' ? item.userID.name || item.userID.username : item.userID} </Text>
                                </View>
                                <Text style={{ fontSize: 10, color: 'gray', marginLeft: 10, verticalAlign: "middle" }}>{item.$createdAt ? (() => {
                                  const now = new Date();
                                  const created = new Date(item.$createdAt);
                                  const diffMs = now.getTime() - created.getTime();
                                  const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                  if (diffDays < 7) {
                                    if (diffMinutes < 1) return "الآن";
                                    if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;
                                    if (diffHours < 24) {
                                      if (diffHours === 1) return "قبل ساعة";
                                      if (diffHours === 2) return "قبل ساعتين";
                                      if (diffHours < 11) return `قبل ${diffHours} ساعات`;
                                      return `قبل ${diffHours} ساعة`;
                                    }
                                    if (diffDays === 0) return "اليوم";
                                    if (diffDays === 1) return "قبل يوم";
                                    if (diffDays === 2) return "قبل يومين";
                                    if (diffDays < 10) return `قبل ${diffDays} أيام`;
                                  }
                                  return created.toLocaleDateString("ar-EG", {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  });
                                })() : "تاريخ غير معروف"}</Text>
                              </View>
                              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginTop: 2 }}>
                                {/* <Text style={{ fontSize: 10, color: 'gray', marginLeft: 10 }}>3 إعجابات</Text> */}
                                {/* <Text style={{ fontSize: 10, color: '#888' }}>رد</Text> */}
                              </View>
                              <View style={{
                                display: "flex",
                                flexDirection: "row-reverse",
                                justifyContent: "space-between",
                                alignContent: "center"
                              }}>
                                <Text style={{ fontSize: 14 }}>{item.comment}</Text>
                                {/* <Pressable style={{ marginLeft: 10 }}>
                                  <Heart size={14} color="gray" />
                                </Pressable> */}
                              </View>
                            </View>
                          </View>
                          <View style={{ height: 0, backgroundColor: '#f2f2f2', marginVertical: 2 }} />
                        </View>
                      )}
                    />
                  )}
                </View>
                {/* Emoji Bar */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' }}>
                  {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emoji) => (
                    <Pressable key={emoji} onPress={() => setNewComment(newComment + emoji)} style={{ marginHorizontal: 2 }}>
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
                {/* Input for new comment */}
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20 }}>
                  <Image
                    source={{ uri: currentUser?.userProfile || undefined }}
                    style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8, backgroundColor: '#eee' }}
                  />
                  <View style={{ flex: 1, backgroundColor: '#f2f2f2', borderRadius: 20, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12 }}>
                    <TextInput
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="أضف تعليقًا..."
                      style={{ flex: 1, fontSize: 14, paddingVertical: 8, backgroundColor: 'transparent', textAlign: 'right' }}
                      editable={!sendingComment}
                    />
                    <Pressable
                      onPress={handleSendComment}
                      disabled={sendingComment || !newComment.trim()}
                      style={{ opacity: sendingComment || !newComment.trim() ? 0.5 : 1, marginRight: 8 }}
                    >
                      <Text style={{ color: '#0095f6', fontWeight: 'bold', fontSize: 16 }}>إرسال</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}
      </View>
    );
  };

  // Add onRefresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <FlatList
      ref={flatListRef}
      data={videos}
      keyExtractor={item => item.$id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      decelerationRate="fast"
      onMomentumScrollEnd={onMomentumScrollEnd}
      getItemLayout={(_, index) => ({ length: VIDEO_HEIGHT, offset: VIDEO_HEIGHT * index, index })}
      style={{ backgroundColor: 'black' }}
      scrollEventThrottle={16}
      initialNumToRender={3}
      windowSize={5}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  videoContainer: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: VIDEO_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 16,
  },
  rightIcons: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    marginBottom: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    bottom: 10,
    maxWidth: '100%',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    
    marginLeft: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    marginBottom: 8,
  },
   iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  shadowIcon: {
    position: 'absolute',
    top: 1, // vertical shadow offset
    left: -1, // horizontal shadow offset
  },
  followButton: {
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 12,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  followingButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  followButtonText: {
      color: '#fff',
      fontSize: 14,
      fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold'
  },
  followingButtonText: {
      color: '#fff',
      fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
  },
});