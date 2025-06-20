import { Text, View, StyleSheet } from "react-native";
import Post from "../../components/post";

export default function Home() {
  return (
    <View style={styles.view}>
      <Text >Welcome to the Social App!</Text>
      <View id="postView" style={{
        width: "100%",
        padding: 0,
      }}>
        <Post />
        <Post />
        <Post />
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    backgroundColor: "white",
  }
});