import { Text, View, StyleSheet } from "react-native";
import { useFonts } from 'expo-font';
import { Heart, ChatTeardrop, ShareFat  } from "phosphor-react-native";


export default function Story() {
  const [fontsLoaded] = useFonts({
      'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
      'Rubik-Regular': require('../assets/fonts/Rubik-Regular.ttf'),
    });
  return (
    <View style={styles.storyFrame}>
      
    </View>
  );
}

const styles = StyleSheet.create({
    storyFrame: {
        width: 70,
        height: 100,
        backgroundColor: "lightgray",
        borderRadius: 10,
        marginRight: 10,
        overflow: "hidden",
    }
})