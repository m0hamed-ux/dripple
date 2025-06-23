import { useFonts } from 'expo-font';
import { useVideoPlayer, VideoView, } from 'expo-video';
import { CaretLeft, ChatTeardrop, Heart, Play, SealCheck } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Query } from "react-native-appwrite";
import { account, commentsCollectionId, databaseId, databases, likesCollectionId, usersCollectionId } from "../lib/appwrite";
import { communityType, UserType } from "../types/database.type";



type PostProps = {
  postID: string;
  image?: string | Array<string>;
  video?: string;
  content?: string;
  userID: string;
  title: string;
  link?: string;
  createdAt?: string;
  isActive?: boolean;
  community?: communityType;
  onPlay?: () => void;
};
export default function Post({ postID, image, video, content, title, userID, link, createdAt, isActive, community, onPlay }: PostProps) {
  const videoLink = video && video.length > 0 ? video : "https://www.w3schools.com/html/mov_bbb.mp4";
  const player = useVideoPlayer(videoLink, (player) => {
    player.loop = true;
  })
  const videoRef = useRef(null);
  const [author, setAuthor] = useState<UserType[]>();
  const [likesCount, setLikesCount] = useState<number>(0);
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const contentWidth = screenWidth * 0.8 - 16;

  const [fontsLoaded] = useFonts({
    'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
    'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  useEffect(() => {
    getUserData();
    getLikesCount();
    isLiked();
    fetchComments();
  }, [userID]);

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

  // Early return for font loading
  if (!fontsLoaded) return null;

  const getUserData = async () => {
    try {
      const respond = await databases.listDocuments(
        databaseId,
        usersCollectionId,
        [Query.equal('userID', userID)]
      );
      setAuthor(respond.documents as UserType[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

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
    // Optimistic UI update
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
        setUserLiked(true);
        setLikesCount((prevCount) => prevCount + 1);
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
        setUserLiked(false);
        setLikesCount((prevCount) => prevCount - 1);
        console.error('Error liking post:', error);
      }
    }
  };

  // PanResponder for swipe up
  // const panResponder = useRef(
  //   PanResponder.create({
  //     onMoveShouldSetPanResponder: (_, gestureState) => {
  //       // Detect vertical swipe up
  //       return gestureState.dy < -20;
  //     },
  //     onPanResponderRelease: (_, gestureState) => {
  //       if (gestureState.dy < -40) {
  //         setCommentsVisible(true);
  //       }
  //     },
  //   })
  // ).current;

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
      <View id="avatarFrame"
        style={{
          width: "20%",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: author && author.length > 0 ? author[0].userProfile : ""}}
          style={{
            width: 50,
            height: 50,
            borderRadius: 10,
            overflow: "hidden",
          }}
        />
      </View>
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
            <>
            <Text style={{
              fontSize: 14,
              fontFamily: "Rubik-Regular",
              color: "gray",
            }}>{community.name}</Text>
            <CaretLeft size={14} color="gray" weight="fill" />
            </>
          )}

          { author && author.length > 0 && author[0].verified && (
            <SealCheck size={14} color="#0095f6" weight="fill" />
          )}
          <Text style={{fontSize: 16, fontFamily: "Rubik-Medium",}}>{author && author.length > 0 ? author[0].name : "مستخدم"} </Text>
          
        </View>
        <Text style={{fontSize: 10, fontFamily: "Rubik-Regular", marginTop: -4, color: "gray"}}>
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
        <Text style={{
          fontSize: 16,
          fontFamily: "Rubik-Medium",
          marginBottom: 4,
        }}>{title}</Text>
        {content && content.length > 0 && (
            <Text style={{
              fontSize: 14,
              fontFamily: "Rubik-regular",
              marginBottom: 4,
              textAlign: "right",
            }}>{content}</Text>
        )}
        {link && link.length > 0 && (
            <Text style={{
              fontSize: 14,
              fontFamily: "Rubik-Medium",
              marginBottom: 4,
              color: "#007AFF",
              textDecorationLine: "underline",
              textDecorationColor: "#007AFF",
              textAlign: "right",
            }}>{link}</Text>
        )}
        
        {typeof image === "string" && (
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
              style={({ pressed }) => [
                styles.iconFrame,
                pressed && { transform: [{ scale: 0.85 }], opacity: 0.7 },
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
              <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1, fontFamily: 'Rubik-Medium' }}>التعليقات</Text>
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
                        <Image
                          source={{ uri: comment.userID && typeof comment.userID === 'object' && comment.userID.userProfile ? comment.userID.userProfile : undefined }}
                          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', marginLeft: 10 }}
                        />
                        <View style={{ flex: 1, justifyContent: "center" }}>
                          <View style={{ display:"flex", flexDirection:"row-reverse", gap: 5, alignContent:"center", alignItems:"center" }}>
                            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", gap : 2}}>
                              { comment.userID && comment.userID.verified && (
                                <SealCheck size={14} color="#0095f6" weight="fill" />
                              )}
                              <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{typeof comment.userID === 'object' ? comment.userID.name || comment.userID.username : comment.userID} </Text>
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
  }
});