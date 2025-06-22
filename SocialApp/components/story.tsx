import { StoryType } from '@/types/database.type';
import { ResizeMode, Video } from 'expo-av';
import { useFonts } from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Models } from 'react-native-appwrite';

interface StoryProps {
  user: Models.Document;
  stories: StoryType[];
}

export default function Story({ user, stories }: StoryProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  const [fontsLoaded] = useFonts({
    'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
    'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
  });

  // Early return for font loading
  if (!fontsLoaded) return null;

  // Early return for empty stories
  if (!stories || stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentStoryIndex];
  const { userProfile: userimage, name: username } = user;
  const { image, video, text, $createdAt: createdAt } = currentStory;

  const isVideo = video && video.length > 0;
  const hasText = text && text.length > 0;

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      progress.setValue(0);
    } else {
      setModalVisible(false); // Close modal when the last story finishes
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      progress.setValue(0);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      progress.setValue(0);
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
  }, [modalVisible, currentStoryIndex, progress, isVideo]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <Pressable onPress={() => setModalVisible(true)}>
        <View style={styles.container}>
          <View style={styles.storyBorder}>
            <View style={styles.storyFrame}>
              <Image source={{ uri: userimage }} style={styles.storyImage} />
            </View>
          </View>
          <Text style={styles.username} numberOfLines={1}>{username}</Text>
        </View>
      </Pressable>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
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
                  {stories.map((_, index) => (
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
            </View>
          ) : (
            <ImageBackground source={{ uri: image }} style={styles.imageBackground} resizeMode="contain">
              <View style={styles.storyHeaderContainer}>
                <View style={styles.progressBarsContainer}>
                  {stories.map((_, index) => (
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
            </ImageBackground>
          )}
        </SafeAreaView>
      </Modal>
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
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0095f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
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
    fontFamily: 'Rubik-Medium',
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
    color: 'white',
    fontSize: 24,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 32,
  },
});