import { Text, View, StyleSheet, Image,Pressable } from "react-native";
import { useFonts } from 'expo-font';
import { Heart, ChatTeardrop, ShareFat  } from "phosphor-react-native";
import { account } from "../lib/appwrite";
import { useState, useEffect } from "react";
import { UserType } from "../types/database.type";
import { databases, databaseId, usersCollectionId } from "../lib/appwrite";
import { Query } from "react-native-appwrite";
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from "phosphor-react-native";


type PostProps = {
  image?: string | Array<string>;
  video?: string;
  content?: string;
  userID: string;
  title: string;
  link?: string;
  createdAt?: string;
  isActive?: boolean;
};
export default function Post({ image, video, content, title, userID, link, createdAt, isActive }: PostProps) {
  const videoLink = video && video.length > 0 ? video : "https://www.w3schools.com/html/mov_bbb.mp4";
  const player = useVideoPlayer(videoLink, (player) => {
    player.loop = true;
  })
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);
  const [author, setAuthor] = useState<UserType[]>();
  useEffect(() => {
    getAuthor();
  }, [userID]);
  const getAuthor = async () => {
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
  const [fontsLoaded] = useFonts({
      'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
      'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
    });
  return (
    <View style={{
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
        <Text style={{
          fontSize: 16,
          fontFamily: "Rubik-Medium",
          marginBottom: 0,
        }}>
          {author && author.length > 0 ? author[0].name : "مستخدم"}
        </Text>
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
              width: "100%",
              aspectRatio: 1,
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 4,
            }}
            resizeMode="cover"
          />
        )}
        {Array.isArray(image) && (
          <View
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 0,
              marginBottom: 4,
            }}
          >
            {image.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={{
                  borderWidth: 1,
                  borderColor: "#fff",
                  flexBasis: "50%",
                  flexGrow: 1,
                  flexShrink: 1,
                  // aspectRatio: 1,
                  height: 150,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
        {video && (
            <View style={{
            width: "100%",
            aspectRatio: 1,
            backgroundColor: "#E0E0E050",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 4,
            }}>
            <VideoView
              player={player}
              style={{
              width: "100%",
              height: "100%",
              }}
              allowsFullscreen
              contentFit="cover"
              nativeControls={false}
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
                  if (player.playing) {
                    player.pause();
                  } else {
                    player.play();
                  }
                }}
              >
                {!player.playing && (
                  <View 
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#00000080",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  >
                  <Play size={24} color="#fff" weight="fill" />
                  </View>
                )}
              </Pressable>
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
            <View style={styles.iconFrame}>
              <ShareFat  size={20} color="gray" />
              <Text style={styles.countText}>100</Text>
            </View>
            <View style={styles.iconFrame}>
              <ChatTeardrop  size={20} color="gray" />
              <Text style={styles.countText}>100</Text>
            </View>
            <View style={styles.iconFrame}>
              <Heart size={20} color="gray" />
              <Text style={styles.countText}>100</Text>
            </View>

        </View>
      </View>
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