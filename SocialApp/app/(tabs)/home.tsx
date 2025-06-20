import { Text, View, StyleSheet, ScrollView} from "react-native";
import Post from "../../components/post";
import Story from "../../components/story";

export default function Home() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} >
      <View style={styles.view}>
        <View id="header" style={{width: "100%", paddingHorizontal: 10}}>
          <Text style={{
            fontSize: 24,
            fontFamily: "Rubik-Medium",
            marginBottom: 0,
            textAlign: "right",
            width: "100%",
          }}>الصفحة الرئيسية</Text>
        </View>
        <View style={{ width: "100%", marginBottom: 10, paddingBottom: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              padding: 10,
              paddingBottom: 0,
            }}
          >
            <Story />
            <Story />
            <Story />
            <Story />
            <Story />
            <Story />
          </ScrollView>
        </View>
        <Text style={{
            fontSize: 20,
            fontFamily: "Rubik-Medium",
            marginBottom: 10,
            textAlign: "right",
            width: "100%",
            paddingHorizontal: 10,
          }}>
          أحدث المنشورات
        </Text>
        <View id="postView" style={{
          width: "100%",
          padding: 0,
        }}>
          <Post image={[
            "https://static.vecteezy.com/system/resources/thumbnails/036/324/708/small/ai-generated-picture-of-a-tiger-walking-in-the-forest-photo.jpg",
            "https://static.vecteezy.com/system/resources/thumbnails/036/324/708/small/ai-generated-picture-of-a-tiger-walking-in-the-forest-photo.jpg",
            "https://static.vecteezy.com/system/resources/thumbnails/036/324/708/small/ai-generated-picture-of-a-tiger-walking-in-the-forest-photo.jpg",
          ]}/>
          <Post image="https://static.vecteezy.com/system/resources/thumbnails/036/324/708/small/ai-generated-picture-of-a-tiger-walking-in-the-forest-photo.jpg"/>
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
        </View>
      
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    padding: 0,
    backgroundColor: "white",
  }
});