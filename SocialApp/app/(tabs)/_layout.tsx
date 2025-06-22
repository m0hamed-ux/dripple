import { Tabs } from "expo-router";
import { House, Compass, PlayCircle, User, PlusCircle} from "phosphor-react-native";
import { useFonts } from 'expo-font';


export default function TabsLayout() {
  const [fontsLoaded] = useFonts({
    'Rubik-Black': require('../../assets/fonts/Rubik-Black.ttf'),
    'Rubik-Regular': require('../../assets/fonts/Rubik-Regular.ttf'),
  });

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: "red",
      tabBarInactiveTintColor: "#8E8E93",
      tabBarLabelStyle: { fontSize: 12, fontFamily: "Rubik-Regular" },
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "الرئيسية",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <House size={24} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "استكشاف",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Compass size={24} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="addPost"
        options={{
          title: "نشر",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <PlusCircle  size={30} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="watch"
        options={{
          title: "مشاهدة",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <PlayCircle size={24} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "ملفي",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <User size={24} color={color} weight="fill" />
          ),
        }}
      />
    </Tabs>
  );
}
