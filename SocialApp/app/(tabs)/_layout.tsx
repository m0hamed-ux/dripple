import { useFonts } from 'expo-font';
import { Tabs } from "expo-router";
import { Compass, House, PlayCircle, PlusCircle, User } from "phosphor-react-native";


export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarActiveTintColor: '#0095f6',
      tabBarInactiveTintColor: "#8E8E93",
      tabBarLabelStyle: { fontSize: 12 },
      tabBarStyle: {
        backgroundColor: route.name === 'watch' ? 'black' : 'white',
        borderTopColor: route.name === 'watch' ? 'black' : '#eee',
      },
    })}>
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
