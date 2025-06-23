import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "../../lib/auth";

export default function Profile() {
  const { user, isLoadingUser, signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.view}>
      <Text>
        {user ? "true" : "false"}
      </Text>
      <Button onPress={signOut}>Sign out</Button>
      <Button onPress={() => router.push('/configureAccount')}>تعديل الحساب</Button>
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