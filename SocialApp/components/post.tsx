import { Text, View } from "react-native";

export default function Post() {
  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 8,
      margin: 0,
      flexDirection: "row",
      alignItems: "flex-start"
    }}>
      {/* Avatar */}
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#eee",
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center"
      }}>
        <Text style={{ fontWeight: "bold", fontSize: 22, color: "#888" }}>A</Text>
      </View>
      {/* Post Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginRight: 6 }}>Alice</Text>
          <Text style={{ color: "#888", fontSize: 14 }}>@alice</Text>
          <Text style={{ color: "#888", fontSize: 14, marginLeft: 6 }}>· 2h</Text>
        </View>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>
          This is an example tweet! 🚀 #reactnative #twitterclone
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ color: "#888", fontSize: 14 }}>💬 12</Text>
          <Text style={{ color: "#888", fontSize: 14 }}>🔁 8</Text>
          <Text style={{ color: "#888", fontSize: 14 }}>❤️ 34</Text>
          <Text style={{ color: "#888", fontSize: 14 }}>🔗</Text>
        </View>
      </View>
    </View>
  );
}