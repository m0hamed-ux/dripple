import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CaretLeft, ChatTeardrop, Heart, SealCheck } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Query } from "react-native-appwrite";
import { account, commentsCollectionId, databaseId, databases, likesCollectionId, postsCollectionId, usersCollectionId } from "../lib/appwrite";
import { PostType, UserType } from "../types/database.type";

export default function PostDetails() {
    const { id: postID } = useLocalSearchParams<{ id: string }>();
    const [post, setPost] = useState<PostType | null>(null);
    const [loadingPost, setLoadingPost] = useState(true);

    const videoLink = post?.video && post.video.length > 0 ? post.video : "";
    const player = useVideoPlayer(videoLink, (player) => {
        player.loop = true;
        player.play();
    });
    const videoRef = useRef(null);
    const [likesCount, setLikesCount] = useState<number>(0);
    const [userLiked, setUserLiked] = useState<boolean>(false);
    const [liking, setLiking] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState("");
    const [sendingComment, setSendingComment] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const screenWidth = Dimensions.get('window').width;
    const contentWidth = screenWidth - 20 - (screenWidth * 0.2); // Matching post.tsx width calculation
    const router = useRouter();

    useEffect(() => {
        const fetchPost = async () => {
            if (!postID) return;
            setLoadingPost(true);
            try {
                const postData = await databases.getDocument(databaseId, postsCollectionId, postID);
                setPost(postData as PostType);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingPost(false);
            }
        };
        fetchPost();
    }, [postID]);

    useEffect(() => {
        if (postID) {
            getLikesCount();
            isLiked();
            fetchComments();
        }
    }, [postID]);

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
        }
    };

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
            setUserLiked(response.documents.length > 0);
        } catch (error) {
            console.error('Error checking if post is liked:', error);
        }
    };

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);

        const previousUserLiked = userLiked;
        const previousLikesCount = likesCount;

        if (userLiked) {
            setUserLiked(false);
            setLikesCount((prevCount) => prevCount - 1);
        } else {
            setUserLiked(true);
            setLikesCount((prevCount) => prevCount + 1);
        }

        try {
            if (!previousUserLiked) { // Previously not liked, so we are liking now
                await databases.createDocument(
                    databaseId,
                    likesCollectionId,
                    'unique()',
                    {
                        userID: await account.get().then((user) => user.$id),
                        posts: postID,
                    }
                );
            } else { // Previously liked, so we are unliking now
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
            }
        } catch (error) {
            setUserLiked(previousUserLiked);
            setLikesCount(previousLikesCount);
            console.error('Error liking/unliking post:', error);
        } finally {
            setLiking(false);
        }
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
            setCommentsError('حدث خطأ أثناء جلب التعليقات');
        } finally {
            setCommentsLoading(false);
        }
    };

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

    if (loadingPost) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
    }

    if (!post) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>المنشور غير موجود.</Text></View>;
    }

    const { images: image, video, content, title, link, $createdAt: createdAt, community, user } = post;

    const renderPostContent = () => (
        
        <View style={{
            width: "auto",
            display: "flex",
            flexDirection: "row-reverse",
            padding: 2,
            borderBottomColor: "#E0E0E050",
            borderBottomWidth: 1,
            marginTop: 4,
            paddingLeft: 10,
            backgroundColor: 'white'
        }}>
            <View id="avatarFrame" style={{ width: "20%", alignItems: "center" }}>
                <Image
                    source={{ uri: user?.userProfile }}
                    style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden" }}
                />
            </View>
            <View id="contentFrame" style={{ flex: 1, alignItems: "flex-end", padding: 0 }}>
                <View style={{ marginBottom: 0, alignContent: "center", display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
                    {community && (
                        <>
                            <Text style={{ fontSize: 14, color: "gray", fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular' }}>{community.name}</Text>
                            <CaretLeft size={14} color="gray" weight="fill" />
                        </>
                    )}
                    {user?.verified && <SealCheck size={14} color="#0095f6" weight="fill" />}
                    <Text style={{ fontSize: 16, fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold", textAlign: "left" }}>{user?.name}</Text>
                </View>
                <Text style={{ fontSize: 10, marginTop: 0, color: "gray" }}>
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
                        return created.toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' });
                    })() : <Text style={{ fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular' }}>تاريخ غير معروف</Text>}
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Bold", textAlign: "right", marginBottom: 4 }}>{title}</Text>
                {content && content.length > 0 && <Text style={{ fontSize: 14, marginBottom: 4, textAlign: "right", fontFamily: "ArbFONTS-Al-Jazeera-Arabic-Regular" }}>{content}</Text>}
                {link && <Text style={{ fontSize: 14, marginBottom: 4, color: "#007AFF", textDecorationLine: "underline", textDecorationColor: "#007AFF", textAlign: "right", fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular' }}>{link}</Text>}

                {typeof image === "string" && (
                    <Pressable onPress={() => openImageModal(image)}>
                        <Image source={{ uri: image }} style={{ width: contentWidth, height: contentWidth, borderRadius: 10, overflow: "hidden", marginBottom: 4 }} resizeMode="cover" />
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
                            onMomentumScrollEnd={e => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / contentWidth))}
                            renderItem={({ item }) => (
                                <Pressable onPress={() => openImageModal(item)}>
                                    <View style={{ width: contentWidth, alignItems: 'center', justifyContent: 'center', height: contentWidth }}>
                                        <Image source={{ uri: item }} style={{ width: contentWidth, height: contentWidth, borderRadius: 12 }} resizeMode='cover' />
                                    </View>
                                </Pressable>
                            )}
                            style={{ width: contentWidth }}
                        />
                        {image.length > 1 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
                                {image.map((_, idx) => <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, marginHorizontal: 3, backgroundColor: currentImageIndex === idx ? '#0095f6' : '#ccc' }} />)}
                            </View>
                        )}
                    </View>
                )}

                {video && (
                    <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "black", borderRadius: 10, overflow: "hidden", marginBottom: 4 }}>
                        <VideoView player={player} ref={videoRef} style={{ width: "100%", height: "100%" }} allowsFullscreen contentFit="contain" nativeControls={true} />
                    </View>
                )}

                <View style={{ width: "100%", height: 20, display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 20, alignItems: "center", borderRadius: 10, marginBottom: 4, marginTop: 4 }}>
                    <View style={styles.iconFrame}>
                        <ChatTeardrop size={20} color="gray" />
                        <Text style={styles.countText}>{comments.length > 0 ? comments.length : "0"}</Text>
                    </View>
                    <Pressable onPress={handleLike} style={({ pressed }) => [styles.iconFrame, pressed && { transform: [{ scale: 0.85 }], opacity: 0.7 }]}>
                        {userLiked ? <Heart size={20} color='#0095f6' weight="fill" /> : <Heart size={20} color="gray" />}
                        <Text style={styles.countText}>{likesCount > 0 ? likesCount : "0"}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );

    const renderComments = () => (
        <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>التعليقات</Text>
            {commentsLoading ? <ActivityIndicator style={{ marginVertical: 20 }} />
                : commentsError ? <Text style={{ color: 'red', textAlign: 'center' }}>{commentsError}</Text>
                : comments.length === 0 ? <Text style={{ textAlign: 'center', padding: 20, color: 'gray' }}>لا توجد تعليقات بعد. كن أول من يعلق!</Text>
                : comments.map((comment) => (
                    <View key={comment.$id} style={styles.commentContainer}>
                        <Image source={{ uri: comment.userID?.userProfile }} style={styles.commentAvatar} />
                        <View style={{ flex: 1 }}>
                            <View style={styles.commentHeader}>
                                {comment.userID?.verified && <SealCheck size={14} color="#0095f6" weight="fill" />}
                                <Text style={styles.commentAuthor}>{comment.userID?.name || 'مستخدم'}</Text>
                                <Text style={styles.commentDate}>{new Date(comment.$createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <Text style={styles.commentText}>{comment.comment}</Text>
                        </View>
                    </View>
                ))
            }
        </View>
    );

    const renderCommentInput = () => (
        <View style={styles.commentInputContainer}>
            <View style={styles.emojiBar}>
                {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emoji) => (
                    <Pressable key={emoji} onPress={() => setNewComment(newComment + emoji)}>
                        <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    </Pressable>
                ))}
            </View>
            <View style={styles.inputRow}>
                <Image source={{ uri: currentUser?.userProfile }} style={styles.currentUserAvatar} />
                <View style={styles.textInputWrapper}>
                    <TextInput
                        value={newComment}
                        onChangeText={setNewComment}
                        placeholder="أضف تعليقًا..."
                        style={styles.textInput}
                        editable={!sendingComment}
                        multiline
                    />
                    <Pressable onPress={handleSendComment} disabled={sendingComment || !newComment.trim()} style={{ opacity: sendingComment || !newComment.trim() ? 0.5 : 1 }}>
                        <Text style={styles.sendButton}>إرسال</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: 'white' }} keyboardVerticalOffset={80}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <CaretLeft size={28} color="#0095f6" weight="bold" />
                    </Pressable>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0095f6', flex: 1, textAlign: 'right' }}>
                        تفاصيل المنشور
                    </Text>
                </View>
                {renderPostContent()}
                {renderComments()}
            </ScrollView>
            {renderCommentInput()}

            <Modal visible={imageModalVisible} transparent={true} onRequestClose={closeImageModal} animationType="fade">
                <View style={styles.modalContainer}>
                    <Pressable style={styles.modalCloseButton} onPress={closeImageModal}>
                        <Text style={styles.modalCloseButtonText}>✕</Text>
                    </Pressable>
                    <Image source={{ uri: selectedImage || undefined }} style={styles.fullscreenImage} resizeMode="contain" />
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
    commentsSection: { padding: 16, backgroundColor: 'white' },
    commentsTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 16 },
    commentContainer: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 16 },
    commentAvatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 12 },
    commentHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    commentAuthor: { fontWeight: 'bold', fontSize: 14 },
    commentDate: { fontSize: 12, color: 'gray' },
    commentText: { fontSize: 14, textAlign: 'right', marginTop: 4, color: '#333' },
    commentInputContainer: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    emojiBar: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 8 },
    inputRow: { flexDirection: 'row-reverse', alignItems: 'center' },
    currentUserAvatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 8 },
    textInputWrapper: { flex: 1, backgroundColor: '#f2f2f2', borderRadius: 20, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
    textInput: { flex: 1, fontSize: 14, textAlign: 'right', paddingVertical: 4 },
    sendButton: { color: '#0095f6', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
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
});
