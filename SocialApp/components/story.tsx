import { useFonts } from 'expo-font';
import { Image, StyleSheet, Text, View } from "react-native";

interface StoryProps {
  image: string;
  username: string;
}

export default function Story({ image, username }: StoryProps) {
  const [fontsLoaded] = useFonts({
    'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
    'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
  });
  if (!fontsLoaded) return null;
  return (
    <View style={styles.container}>
      <View style={styles.storyBorder}>
        <View style={styles.storyFrame}>
          <Image source={{ uri: image }} style={styles.storyImage} />
        </View>
      </View>
      <Text style={styles.username} numberOfLines={1}>{username}</Text>
    </View>
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
});