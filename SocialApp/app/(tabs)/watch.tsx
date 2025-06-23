import { account, commentsCollectionId, databaseId, databases, likesCollectionId, postsCollectionId, usersCollectionId } from "@/lib/appwrite";
import { PostType, UserType } from "@/types/database.type";
import { useFocusEffect } from "@react-navigation/native";
import { ResizeMode, Video } from 'expo-av';
import { ChatTeardrop, Heart, Play, SealCheck } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Query } from "react-native-appwrite";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const VIDEO_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

export default function Watch() {
  const [videos, setVideos] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [users, setUsers] = useState<{ [userId: string]: UserType }>({});
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
      // Fetch users for all videos
      const userIds = Array.from(new Set(videoPosts.map(v => v.userID)));
      const usersMap: { [userId: string]: UserType } = {};
      for (const userId of userIds) {
        try {
          const res = await databases.listDocuments(databaseId, usersCollectionId, [
            Query.equal('userID', userId)
          ]);
          if (res.documents && res.documents.length > 0) {
            usersMap[userId] = res.documents[0] as UserType;
          }
        } catch {}
      }
      setUsers(usersMap);
      // Fetch likes, userLiked, and comments count for all videos
      const likesMap: { [postId: string]: number } = {};
      const userLikedMap: { [postId: string]: boolean } = {};
      const commentsMap: { [postId: string]: number } = {};
      let currentUserId = null;
      try {
        const user = await account.get();
        currentUserId = user.$id;
      } catch {}
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
      await databases.createDocument(databaseId, commentsCollectionId, 'unique()', {
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
          'unique()',
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
    const user = users[item.userID];
    const isPaused = pausedVideos[index];
    const showHeartNow = showHeart[index];
    const heartScale = heartAnim.current[index] || new Animated.Value(0);
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
              <Heart size={32} color={userLiked[item.$id] ? '#fff' : '#fff'} weight={userLiked[item.$id] ? 'fill' : 'regular'} />
              <Text style={styles.countText}>{likes[item.$id] || 0}</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => openCommentModal(item.$id)}>
              <ChatTeardrop size={32} color="#fff" weight="regular" />
              <Text style={styles.countText}>{comments[item.$id] || 0}</Text>
            </Pressable>
          </View>
          {/* Bottom left info */}
          <View style={styles.bottomInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {user && user.userProfile && (
                <Image source={{ uri: user.userProfile }} style={styles.avatar} />
              )}
              <Text style={styles.userName}>{user ? user.name : 'مستخدم'}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
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
                  <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1, fontFamily: 'Rubik-Medium' }}>التعليقات</Text>
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
      snapToInterval={VIDEO_HEIGHT}
      snapToAlignment="start"
      decelerationRate="normal"
      onMomentumScrollEnd={onMomentumScrollEnd}
      getItemLayout={(_, index) => ({ length: VIDEO_HEIGHT, offset: VIDEO_HEIGHT * index, index })}
      style={{ backgroundColor: 'black' }}
      scrollEventThrottle={16}
      initialNumToRender={3}
      windowSize={3}
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
    maxWidth: '70%',
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
    fontFamily: 'Rubik-Medium',
    marginLeft: 8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Rubik-Regular',
    marginBottom: 8,
  },
});