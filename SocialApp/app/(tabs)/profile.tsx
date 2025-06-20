import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Profile() {
  return (
    <View style={styles.view}>
      <Text>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  loginButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    color: "white",
    borderRadius: 5,
    marginTop: 20,
    textAlign: "center",
    width: "100%",
  }
});