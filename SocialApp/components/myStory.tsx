import { StoryType, UserType } from '@/types/database.type';
import { ResizeMode, Video } from 'expo-av';
import { Eye, Plus, Trash } from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Models, Query } from 'react-native-appwrite';
import { databaseId, getStoryViewers, safeDeleteDocument, safeListDocuments, storiesCollectionId, storiesViewsCollectionId, trackStoryView } from '../lib/appwrite';
import { useAuth } from '../lib/auth';
import StoryViews from './storyViews';

interface MyStoryProps {
  user: Models.Document;
  userStories?: StoryType[];
  onAddStory?: () => void;
}

export default function MyStory({ user, userStories, onAddStory }: MyStoryProps) {

  const { user: authUser } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSingle, setDeleteSingle] = useState(false);
  const [viewsModalVisible, setViewsModalVisible] = useState(false);
  const [storyViewers, setStoryViewers] = useState<UserType[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [hasViewedStory, setHasViewedStory] = useState(false);

  const hasStories = userStories && userStories.length > 0;
  const { userProfile: userimage, name: username } = user;

  // Check if user has viewed their own story (unusual but possible)
  const checkIfUserViewedStory = async () => {
    if (!authUser || !userStories || userStories.length === 0) return;
    
    try {
      const currentStory = userStories[currentStoryIndex];
      const views = await safeListDocuments(
        databaseId,
        storiesViewsCollectionId,
        [
          Query.equal('stories', currentStory.$id),
          Query.equal('user', authUser.$id)
        ]
      );
      
      setHasViewedStory(views.documents.length > 0);
    } catch (error) {
      console.error('Error checking if user viewed story:', error);
      setHasViewedStory(false);
    }
  };

  useEffect(() => {
    if (userStories && userStories.length > 0) {
      checkIfUserViewedStory();
    }
  }, [userStories, currentStoryIndex, authUser]);

  const handlePress = () => {
    if (hasStories) {
      setModalVisible(true);
    } else {
      onAddStory?.();
    }
  };
  const handleAddStory = () => {
    onAddStory?.();
  }

  const handleLongPress = () => {
    if (hasStories) {
      setActionMenuVisible(true);
    }
  };

  const handleDeleteStory = async () => {
    if (!userStories || userStories.length === 0) return;
    setDeleting(true);
    try {
      // Delete all stories for this user (long press action)
      for (const story of userStories) {
        await safeDeleteDocument(databaseId, storiesCollectionId, story.$id);
      }
      setActionMenuVisible(false);
      setModalVisible(false);
      setCurrentStoryIndex(0);
    } catch (e) {
      // Optionally show error
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCurrentStory = async () => {
    if (!userStories || userStories.length === 0) return;
    setDeleting(true);
    try {
      const story = userStories[currentStoryIndex];
      await safeDeleteDocument(databaseId, storiesCollectionId, story.$id);
      setDeleteSingle(false);
      setModalVisible(false);
      setCurrentStoryIndex(0);
    } catch (e) {
      // Optionally show error
    } finally {
      setDeleting(false);
    }
  };

  const handleNextStory = () => {
    if (currentStoryIndex < userStories!.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      progress.setValue(0);
    } else {
      setModalVisible(false);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      progress.setValue(0);
    }
  };

  const handleShowViews = async () => {
    if (!userStories || !authUser) return;
    
    setLoadingViewers(true);
    try {
      const currentStory = userStories[currentStoryIndex];
      const viewers = await getStoryViewers(currentStory.$id);
      setStoryViewers(viewers);
      setViewsModalVisible(true);
    } catch (error) {
      console.error('Error fetching story viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  // Fetch view count when story changes
  const fetchViewCount = async () => {
    if (!userStories || !authUser) return;
    
    try {
      const currentStory = userStories[currentStoryIndex];
      const viewers = await getStoryViewers(currentStory.$id);
      setStoryViewers(viewers);
    } catch (error) {
      console.error('Error fetching view count:', error);
    }
  };

  useEffect(() => {
    if (userStories && userStories.length > 0) {
      fetchViewCount();
    }
  }, [currentStoryIndex, userStories]);

  const handleStoryView = async () => {
    if (!userStories || !authUser) return;
    
    const currentStory = userStories[currentStoryIndex];
    // Only track view if it's not the user's own story
    if (currentStory.userID.userID !== authUser.$id) {
      await trackStoryView(currentStory.$id, authUser.$id);
    }
    // Update the viewed state
    setHasViewedStory(true);
  };

  useEffect(() => {
    if (modalVisible && hasStories) {
      progress.setValue(0);
      const currentStory = userStories![currentStoryIndex];
      const isVideo = currentStory.video && currentStory.video.length > 0;
      
      // Track story view when modal opens
      handleStoryView();
      
      if (!isVideo) {
        Animated.timing(progress, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) {
            handleNextStory();
          }
        });
      }
    } else {
      progress.setValue(0);
      setCurrentStoryIndex(0);
    }
  }, [modalVisible, currentStoryIndex, progress, hasStories, userStories]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const currentStory = hasStories ? userStories![currentStoryIndex] : null;
  const { image, video, text, $createdAt: createdAt } = currentStory || {};
  const isVideo = video && video.length > 0;
  const hasText = text && text.length > 0;

  return (
    <>
      <Pressable onPress={handlePress} onLongPress={handleLongPress}>
        <View style={styles.container}>
          <View style={[hasStories ? styles.hasStoriesBorder : styles.noStoriesBorder, hasViewedStory && styles.viewedStoryBorder]}>
            <View style={styles.storyFrame}>
              <Image source={{ uri: userimage }} style={styles.storyImage} />
            </View>
          </View>
          <Text style={styles.username} numberOfLines={1}>
            {hasStories ? 'قصتك' : 'أضف قصة'}
          </Text>
          <Pressable onPress={handleAddStory} style={styles.plusButton}>
            <Plus size={16} color="white" weight="bold" />
          </Pressable>
        </View>
      </Pressable>
      
      {/* Action Modal for deleting all stories */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setActionMenuVisible(false)}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 16, minWidth: 200 }}>
            <Pressable style={{ padding: 12 }} onPress={handleDeleteStory} disabled={deleting}>
              <Text style={{ color: '#d00', fontWeight: 'bold', fontSize: 16 }}>{deleting ? 'جاري الحذف...' : 'حذف كل القصص'}</Text>
            </Pressable>
            <Pressable style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#eee' }} onPress={() => setActionMenuVisible(false)}>
              <Text style={{ color: '#d00', fontWeight: 'bold', fontSize: 16 }}>إلغاء</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      
      {/* Action Modal for deleting single story from preview */}
      <Modal
        visible={deleteSingle}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteSingle(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setDeleteSingle(false)}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 16, minWidth: 200 }}>
            <Pressable style={{ padding: 12 }} onPress={handleDeleteCurrentStory} disabled={deleting}>
              <Text style={{ color: '#d00', fontWeight: 'bold', fontSize: 16 }}>{deleting ? 'جاري الحذف...' : 'حذف هذه القصة'}</Text>
            </Pressable>
            <Pressable style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#eee' }} onPress={() => setDeleteSingle(false)}>
              <Text style={{ color: '#d00', fontWeight: 'bold', fontSize: 16 }}>إلغاء</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      
      {/* Story Views Modal */}
      <StoryViews
        visible={viewsModalVisible}
        onClose={() => setViewsModalVisible(false)}
        viewers={storyViewers}
        storyOwner={user as UserType}
      />
      
      {hasStories && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Show trash icon for delete in preview */}
            <View style={{ position: 'absolute', top: 30, left: 20, zIndex: 10 }}>
              <Pressable onPress={() => setDeleteSingle(true)}>
                <Trash size={28} color="#d00" weight="bold" />
              </Pressable>
            </View>
            
            {isVideo ? (
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: video }}
                  style={styles.videoBackground}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded && status.durationMillis) {
                      const progressValue = status.positionMillis / status.durationMillis;
                      progress.setValue(progressValue);
                      
                      if (status.didJustFinish) {
                        handleNextStory();
                      }
                    }
                  }}
                />
                <View style={styles.storyHeaderContainer}>
                  <View style={styles.progressBarsContainer}>
                    {userStories!.map((_, index) => (
                      <View key={index} style={styles.progressBarContainer}>
                        <Animated.View style={[
                          styles.progressBar,
                          { width: index === currentStoryIndex ? progressWidth : (index < currentStoryIndex ? '100%' : '0%') }
                        ]} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.storyHeader}>
                    <View style={styles.storyUser}>
                      <Image source={{ uri: userimage }} style={styles.storyUserImage} />
                      <Text style={styles.storyUsername}>{username}</Text>
                      <Text style={{ fontSize: 10, color: 'gray', marginLeft: 10 }}>{createdAt ? (() => {
                        const now = new Date();
                        const created = new Date(createdAt);
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
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.storyNavigation}>
                  <Pressable style={styles.navPressable} onPress={handlePrevStory} />
                  <Pressable style={styles.navPressable} onPress={handleNextStory} />
                </View>
                {hasText && (
                  <View style={styles.textOverlay}>
                    <Text style={styles.storyText}>{text}</Text>
                  </View>
                )}
                
                {/* Show views icon at the bottom - always visible for own stories */}
                <View style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 14, fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold', marginRight: 8 }}>
                    {storyViewers.length}
                  </Text>
                  <Pressable onPress={handleShowViews} disabled={loadingViewers}>
                    <Eye size={28} color="white" weight="bold" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <ImageBackground source={{ uri: image }} style={styles.imageBackground} resizeMode="contain">
                <View style={styles.storyHeaderContainer}>
                  <View style={styles.progressBarsContainer}>
                    {userStories!.map((_, index) => (
                      <View key={index} style={styles.progressBarContainer}>
                        <Animated.View style={[
                          styles.progressBar,
                          { width: index === currentStoryIndex ? progressWidth : (index < currentStoryIndex ? '100%' : '0%') }
                        ]} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.storyHeader}>
                    <View style={styles.storyUser}>
                      <Image source={{ uri: userimage }} style={styles.storyUserImage} />
                      <Text style={styles.storyUsername}>{username}</Text>
                      <Text style={{ fontSize: 10, color: 'gray', marginLeft: 10 }}>{createdAt ? (() => {
                        const now = new Date();
                        const created = new Date(createdAt);
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
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.storyNavigation}>
                  <Pressable style={styles.navPressable} onPress={handlePrevStory} />
                  <Pressable style={styles.navPressable} onPress={handleNextStory} />
                </View>
                {hasText && (
                  <View style={styles.textOverlay}>
                    <Text style={styles.storyText}>{text}</Text>
                  </View>
                )}
                
                {/* Show views icon at the bottom - always visible for own stories */}
                <View style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 14, fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold', marginRight: 8 }}>
                    {storyViewers.length}
                  </Text>
                  <Pressable onPress={handleShowViews} disabled={loadingViewers}>
                    <Eye size={28} color="white" weight="bold" />
                  </Pressable>
                </View>
              </ImageBackground>
            )}
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 70,
    marginRight: 10,
  },
  storyFrame: {
    width: 62,
    height: 62,
    backgroundColor: "lightgray",
    borderRadius: 31,
    overflow: "hidden",
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hasStoriesBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0095f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noStoriesBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2,
    borderWidth: 2,
    borderColor: '#dbdbdb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    position: 'absolute',
    bottom: "25%",
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0095f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  username: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    maxWidth: 70,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageBackground: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  videoBackground: {
    flex: 1,
  },
  storyHeaderContainer: {
    flexDirection: 'column',
    position: 'absolute',
    top: 15,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  progressBarsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
  storyHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyUser: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  storyUserImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },
  storyUsername: {
    color: 'white',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    fontSize: 14,
  },
  storyNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navPressable: {
    flex: 1,
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,

  },
  storyText: {
    backgroundColor: "#00000080",
    width: "150%",
    paddingHorizontal: "25%",
    color: 'white',
    fontSize: 14,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    lineHeight: 32,
  },
  viewedStoryBorder: {
    borderColor: '#dbdbdb',
  },
}); 