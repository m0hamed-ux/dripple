import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Button } from "react-native-paper";

export default function Profile() {
  const { user, isLoadingUser, signOut } = useAuth();

  return (
    <View style={styles.view}>
      <Text>
        {user ? "true" : "false"}
      </Text>
      <Button onPress={signOut}>Sign out</Button>
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