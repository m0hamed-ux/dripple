import { Text, View, StyleSheet, Image } from "react-native";
import { useFonts } from 'expo-font';
import { Heart, ChatTeardrop, ShareFat  } from "phosphor-react-native";
import { account } from "../lib/appwrite";
import { useState, useEffect } from "react";
import { UserType } from "../types/database.type";
import { databases, databaseId, usersCollectionId } from "../lib/appwrite";
import { Query } from "react-native-appwrite";

type PostProps = {
  image?: string | Array<string>;
  video?: string;
  content: string;
  userID: string;
};
export default function Post({ image, video, content, userID }: PostProps) {
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
        <Text style={{fontSize: 10, fontFamily: "Rubik-Regular", marginTop: -4, color: "gray"}}>منذ ساعتين</Text>
        <Text style={{
          fontSize: 14,
          fontFamily: "Rubik-Regular",
          marginBottom: 4,
        }}>{content}</Text>
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
              gap: 4,
              marginBottom: 4,
            }}
          >
            {image.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={{
                  flexBasis: "48%",
                  flexGrow: 1,
                  flexShrink: 1,
                  aspectRatio: 1,
                  height: 150,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
                resizeMode="cover"
              />
            ))}
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