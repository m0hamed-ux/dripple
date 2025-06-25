import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView, } from 'expo-video';
import { CaretLeft, ChatTeardrop, Heart, Play, SealCheck } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Query } from "react-native-appwrite";
import { account, commentsCollectionId, databaseId, databases, likesCollectionId, postsCollectionId, safeDeleteDocument, usersCollectionId } from "../lib/appwrite";
import { communityType, UserType } from "../types/database.type";



type PostProps = {
  postID: string;
  image?: string | Array<string>;
  video?: string;
  content?: string;
  title: string;
  link?: string;
  createdAt?: string;
  isActive?: boolean;
  community?: communityType;
  user?: UserType;
  onPlay?: () => void;
  onDelete?: () => void;
};
export default function Post({ postID, image, video, content, title, link, createdAt, isActive, community, user, onPlay, onDelete }: PostProps) {
  const videoLink = video && video.length > 0 ? video : "https://www.w3schools.com/html/mov_bbb.mp4";
  const player = useVideoPlayer(videoLink, (player) => {
    player.loop = true;
  })
  const videoRef = useRef(null);
  // const [author, setAuthor] = useState<UserType[]>();
  const [likesCount, setLikesCount] = useState<number>(0);
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [liking, setLiking] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const contentWidth = screenWidth * 0.8 - 16;
  const router = useRouter();


  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      if (player && typeof player.pause === 'function') {
        try {
          player.pause();
        } catch (e) {
          // Ignore if player is already released
        }
      }
    }
    return () => {
      if (player && typeof player.pause === 'function') {
        try {
          player.pause();
        } catch (e) {
          // Ignore if player is already released
        }
      }
    };
  }, [isActive, player]);

  useEffect(() => {
    getLikesCount();
    isLiked();
  }, [postID]);

  // Fetch comments when modal opens
  useEffect(() => {
    if (commentsVisible) {
      fetchComments();
    }
  }, [commentsVisible]);

  // Fetch current user for avatar
  useEffect(() => {
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

  const getLikesCount = async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        likesCollectionId,
        [Query.equal('posts', postID)]
      );
      setLikesCount(response.documents.length);
    } catch (error) {
      console.error('Error fetching likes count:', error);
      return 0;
    }
  }
  const isLiked = async () => {
    try {
      const user = await account.get();
      const response = await databases.listDocuments(
        databaseId,
        likesCollectionId,
        [
          Query.equal('userID', user.$id),
          Query.equal('posts', postID)
        ]
      );
      if (response.documents.length > 0) {
        setUserLiked(true);
        return true;
      } else {
        setUserLiked(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking if post is liked:', error);
      return false;
    }
  }
  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    // Optimistic UI update
    const previousUserLiked = userLiked;
    const previousLikesCount = likesCount;

    if (userLiked) {
      setUserLiked(false);
      setLikesCount((prevCount) => prevCount - 1);
      try {
        const response = await databases.listDocuments(
          databaseId,
          likesCollectionId,
          [Query.equal('userID', await account.get().then((user) => user.$id)), Query.equal('posts', postID)]
        );
        if (response.documents.length > 0) {
          await databases.deleteDocument(
            databaseId,
            likesCollectionId,
            response.documents[0].$id
          );
        }
      } catch (error) {
        // Revert UI if failed
        setUserLiked(previousUserLiked);
        setLikesCount(previousLikesCount);
        console.error('Error unliking post:', error);
      }
    } else {
      setUserLiked(true);
      setLikesCount((prevCount) => prevCount + 1);
      try {
        await databases.createDocument(
          databaseId,
          likesCollectionId,
          'unique()',
          {
            userID: await account.get().then((user) => user.$id),
            posts: postID,
          }
        );
      } catch (error) {
        // Revert UI if failed
        setUserLiked(previousUserLiked);
        setLikesCount(previousLikesCount);
        console.error('Error liking post:', error);
      }
    }
    setLiking(false);
  };

  const openImageModal = (uri: string) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const response = await databases.listDocuments(
        databaseId,
        commentsCollectionId,
        [Query.equal('posts', postID), Query.orderDesc('$createdAt')]
      );
      setComments(response.documents);
    } catch (error) {
      setCommentsError('حدث خطأ أثناء جلب التعليقات' + error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Add comment
  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const user = await account.get();
      await databases.createDocument(
        databaseId,
        commentsCollectionId,
        'unique()',
        {
          posts: postID,
          userID: user.$id,
          comment: newComment,
        }
      );
      setNewComment("");
      fetchComments();
    } catch (e) {
      // Optionally show error
    } finally {
      setSendingComment(false);
    }
  };

  const panResponderModal = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detect vertical swipe down
        return gestureState.dy > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 40) {
          setCommentsVisible(false);
        }
      },
    })
  ).current;

  // Helper: is current user the post writer?
  const isPostWriter = currentUser && user && (currentUser.userID === user.userID);

  // Delete post handler
  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await safeDeleteDocument(databaseId, postsCollectionId, postID);
      setActionMenuVisible(false);
      if (onDelete) onDelete();
      else router.replace('/');
    } catch (e) {
      // Optionally show error
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View
      // {...panResponder.panHandlers}
      style={{
        width: "auto",
        display: "flex",
        flexDirection: "row-reverse",
        padding: 2,
        borderBottomColor: "#E0E0E050",
        borderBottomWidth: 1,
        marginTop: 4,
        paddingLeft: 10,
      }}
    >
      {/* Post action menu trigger (only for post writer) */}
      {isPostWriter && (
        <Pressable onPress={() => setActionMenuVisible(true)} style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
          <Ionicons name="ellipsis-vertical" size={22} color="#222" />
        </Pressable>
      )}
      <Pressable onPress={() => router.push({ pathname: "/userProfile", params: { id: user?.$id } })} id="avatarFrame"
        style={{
          width: "20%",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: user?.userProfile }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 10,
            overflow: "hidden",
          }}
        />
      </Pressable>
      <View id="contentFrame" style={{
        flex: 1,
        alignItems: "flex-end",
        padding: 0,
      }}>
        <View style={{
          marginBottom: 0,
          alignContent: "center",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}>
          {community && (
            <Pressable onPress={() => router.push({ pathname: "/community", params: { id: community.$id } })}>
              <Text style={{
                fontSize: 14,
                color: "gray",
              }}>{community.name}</Text>
            </Pressable>
          )}
          {community && <CaretLeft size={14} color="gray" weight="fill" />}

          { user?.verified && (
            <SealCheck size={14} color="#0095f6" weight="fill" />
          )}
          <Text style={{fontSize: 16, fontFamily: "Rubik-Medium",  textAlign: "left", fontWeight: 'bold'}}>{user?.name}</Text>
        </View>
        <Text style={{fontSize: 10,  marginTop: 0, color: "gray"}}>
          {createdAt ? (() => {
            const now = new Date();
            const created = new Date(createdAt);
            const diffMs = now.getTime() - created.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
              if (diffMinutes < 1) return "الآن";
              if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة${diffMinutes === 1 ? '' : diffMinutes < 11 ? '' : ''}`;
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
          })() : "تاريخ غير معروف"}
        </Text>
        <Pressable onPress={() => router.push({ pathname: "/postDetails", params: { id: postID } })}>
          <Text style={{
            fontSize: 16,
            fontFamily: "Rubik-Medium",
            textAlign: "right",
            marginBottom: 4,
          }}>{title}</Text>
          {content && content.length > 0 && (
            <Text style={{
              fontSize: 14,
              marginBottom: 4,
              textAlign: "right",
              fontFamily: "Rubik-Regular",
            }}>
              {content.length > 100 ? (
                <>
                  <Text>{content.slice(0, 100) + "..."}</Text>
                  <Text style={{ color: "#0095f6", fontWeight: "bold" }}>  عرض المزيد</Text>
                </>
              ) : (
                <Text>{content}</Text>
              )}
            </Text>
          )}
        </Pressable>
        {link && link.length > 0 && (
            <Text style={{
              fontSize: 14,
              
              marginBottom: 4,
              color: "#007AFF",
              textDecorationLine: "underline",
              textDecorationColor: "#007AFF",
              textAlign: "right",
            }}>{link}</Text>
        )}
        
        {typeof image === "string" && (
          <Pressable onPress={() => openImageModal(image)}>
            <Image
              source={{ uri: image }}
              style={{
                width: contentWidth,
                height: contentWidth,
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 4,
              }}
              resizeMode="cover"
            />
          </Pressable>
        )}
        {Array.isArray(image) && image.length > 0 && (
          <View style={{ width: contentWidth, alignItems: "center", marginBottom: 8 }}>
            <FlatList
              data={image}
              keyExtractor={(item, idx) => idx.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate={"fast"}
              contentContainerStyle={{ alignItems: 'center' }}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
                setCurrentImageIndex(index);
              }}
              renderItem={({ item }) => (
                <Pressable onPress={() => openImageModal(item)}>
                  <View style={{ width: contentWidth, alignItems: 'center', justifyContent: 'center', height: contentWidth }}>
                    <Image
                      source={{ uri: item }}
                      style={{
                        width: contentWidth,
                        height: contentWidth,
                        borderRadius: 12,
                      }}
                      resizeMode='cover'
                    />
                  </View>
                </Pressable>
              )}
              style={{ width: contentWidth }}
            />
            {/* Indicator Dots: only show if more than one image */}
            {image.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
                {image.map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 3,
                      backgroundColor: currentImageIndex === idx ? '#0095f6' : '#ccc',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        {video && (
            <View style={{
            width: "100%",
            aspectRatio: 16 / 9,
            backgroundColor: "black",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 4,
            }}>
            <VideoView
              player={player}
              ref={videoRef}
              style={{
              width: "100%",
              height: "100%",
              }}
              allowsFullscreen
              contentFit="contain"
              nativeControls={true}
            />
            <View style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
          <Pressable
          onPress={() => {
            if (!isActive && onPlay) {
            onPlay();
            } else if (isActive) {
            player.pause();
            }
          }}
          style={{ marginBottom: 10 }}
          >
          {!isActive && (
            <View 
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: "#00000000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            >
            <Play size={24} color="#00000000" weight="fill" />
            </View>
          )}
          </Pressable>
          {/* Video duration display */}
          <View style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            backgroundColor: "#00000080",
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}>
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {player?.duration
                ? (() => {
              const totalSeconds = Math.floor(player.duration);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            })()
                : "0:00"}
            </Text>
          </View>
              </View>
            </View>
        )}
        <View style={{
          width: "100%",
          height: 20,
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 20,
          alignItems: "center",
          borderRadius: 10,
          marginBottom: 4,
          marginTop: 4,
        }}>
            {/* <View style={styles.iconFrame}>
              <ShareFat  size={20} color="gray" />
              <Text style={styles.countText}>
                0
              </Text>
            </View> */}
            <View style={styles.iconFrame}>
              <Pressable onPress={() => setCommentsVisible(true)}>
                <ChatTeardrop size={20} color="gray" />
              </Pressable>
              <Text style={styles.countText}>
                {comments.length > 0 ? comments.length : "0"}
              </Text>
            </View>
            <Pressable
              onPress={handleLike}
              disabled={liking}
              style={({ pressed }) => [
                styles.iconFrame,
                pressed && { transform: [{ scale: 0.85 }], opacity: 0.7 },
                liking && { opacity: 0.5 }
              ]}
            >
              {userLiked ? (
              <Heart size={20} color='#0095f6' weight="fill" />
              ) : (
              <Heart size={20} color="gray" />
              )}
              <Text style={styles.countText}>
              {likesCount > 0 ? likesCount : "0"}
              </Text>
            </Pressable>

        </View>
      </View>
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' }}
        >
          <View
            {...panResponderModal.panHandlers}
            style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 300, maxHeight: '80%', paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, flex: 1, justifyContent: 'flex-start', display: 'flex', flexDirection: 'column' }}
          >
            {/* Top Bar */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <Pressable onPress={() => setCommentsVisible(false)} style={{ position: 'absolute', right: 16, padding: 8 }}>
                <Text style={{ fontSize: 22, color: '#222' }}></Text>
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>التعليقات</Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#eee', marginBottom: 0 }} />

            

            {/* Comments List */}
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 4 }}>
              {commentsLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="gray" style={{ marginVertical: 20 }} />
                </View>
              ) : commentsError ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'red' }}>{commentsError}</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>لا توجد تعليقات بعد.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: '100%' }} showsVerticalScrollIndicator={false}>
                  {comments.map((comment, idx) => (
                    <View key={comment.$id || idx}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 12 }}>
                        <Pressable
                          onPress={() => router.push({ pathname: "/userProfile", params: { id: typeof comment.userID === 'object' ? comment.userID.$id : comment.userID } })}
                        >
                          <Image
                            source={{ uri: comment.userID && typeof comment.userID === 'object' && comment.userID.userProfile ? comment.userID.userProfile : undefined }}
                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', marginLeft: 10 }}
                          />
                        </Pressable>
                        <View style={{ flex: 1, justifyContent: "center" }}>
                          <View style={{ display:"flex", flexDirection:"row-reverse", gap: 5, alignContent:"center", alignItems:"center" }}>
                            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", gap : 2}}>
                              { comment.userID && comment.userID.verified && (
                                <SealCheck size={14} color="#0095f6" weight="fill" />
                              )}
                              <Pressable
                                onPress={() => router.push({ pathname: "/userProfile", params: { id: typeof comment.userID === 'object' ? comment.userID.$id : comment.userID } })}
                              >
                                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
                                  {typeof comment.userID === 'object' ? comment.userID.name || comment.userID.username : comment.userID}
                                </Text>
                              </Pressable>
                            </View>
                            <Text style={{ fontSize: 10, color: 'gray', marginLeft: 10, verticalAlign: "middle" }}>{comment.$createdAt ? (() => {
                              const now = new Date();
                              const created = new Date(comment.$createdAt);
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
                            <Text style={{ fontSize: 14 }}>{comment.comment}</Text>
                            {/* <Pressable style={{ marginLeft: 10 }}>
                              <Heart size={14} color="gray" />
                            </Pressable> */}
                          </View>
                        </View>
                      </View>
                      <View style={{ height: 0, backgroundColor: '#f2f2f2', marginVertical: 2 }} />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Input for new comment */}
            <View style={{ paddingHorizontal: 12, paddingBottom: 12, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' }}>
              {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emoji) => (
                <Pressable key={emoji} onPress={() => setNewComment(newComment + emoji)} style={{ marginHorizontal: 2 }}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Post Action Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActionMenuVisible(false)}>
          <View style={styles.menuModal}>
            <Pressable style={styles.menuItem} onPress={handleDeletePost} disabled={deleting}>
              <Text style={[styles.menuText, { color: '#d00' }]}>{deleting ? 'جاري الحذف...' : 'حذف المنشور'}</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#eee' }]} onPress={() => setActionMenuVisible(false)}>
              <Text style={[styles.menuText, { color: '#d00' }]}>إلغاء</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <Modal visible={imageModalVisible} transparent={true} onRequestClose={closeImageModal} animationType="fade">
          <View style={styles.modalContainer}>
              <Pressable style={styles.modalCloseButton} onPress={closeImageModal}>
                  <Text style={styles.modalCloseButtonText}>✕</Text>
              </Pressable>
              <Image source={{ uri: selectedImage || undefined }} style={styles.fullscreenImage} resizeMode="contain" />
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
  },
  countText: {
    color: "gray",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
      width: '100%',
      height: '100%',
  },
  modalCloseButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
  },
  modalCloseButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
  },
  menuItem: {
    padding: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});