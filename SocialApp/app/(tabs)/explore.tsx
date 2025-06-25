import { communitiesCollectionId, databaseId, databases, likesCollectionId, postsCollectionId, usersCollectionId } from "@/lib/appwrite";
import { communityType, PostType, UserType } from "@/types/database.type";
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { Fire, SealCheck, UserPlus } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Query } from 'react-native-appwrite';

const DEFAULT_COMMUNITY_IMAGE = require("../../assets/images/partial-react-logo.png");
const router = useRouter();
const TrendingPostCard = ({ item }: { item: PostType }) => {
  
  const mediaUri = item.video 
    ? item.video
    : item.images 
    ? (Array.isArray(item.images) ? item.images[0] : item.images)
    : null;

  return (
    <Pressable onPress={() => router.push({ pathname: "/postDetails", params: { id: item.$id } })} style={styles.trendingCard}>
      {mediaUri ? (
        item.video ? (
          <>
            <Video
              source={{ uri: mediaUri }}
              style={styles.trendingMedia}
              resizeMode={ResizeMode.COVER}
              isMuted
              shouldPlay={false}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
          </>
        ) : (
          <ImageBackground source={{ uri: mediaUri }} style={styles.trendingMedia} resizeMode={ResizeMode.COVER}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
          </ImageBackground>
        )
      ) : (
        <View style={[styles.trendingMedia, { backgroundColor: '#333' }]} />
      )}
      <View style={styles.trendingTextContainer}>
        <Text style={styles.trendingTitle}>{item.title}</Text>
        <Text style={styles.trendingSubtitle}>{item.content.substring(0, 30)}...</Text>
        <View style={styles.trendingAuthorInfo}>
          {item.user?.userProfile ? (
            <Image source={{ uri: item.user.userProfile }} style={styles.trendingAuthorImage} />
          ) : (
            <Image source={DEFAULT_COMMUNITY_IMAGE} style={styles.trendingAuthorImage} />
          )}
          <Text style={styles.trendingAuthorName}>{item.user?.name || 'مستخدم غير معروف'}</Text>
          {item.user?.verified && <SealCheck size={14} color="white" weight="fill" style={{ marginLeft: 4 }} />}
        </View>
      </View>
    </Pressable>
  );
};

const CommunityCard = ({ item }: { item: communityType }) => {
  const imageUrl = item.image ? item.image : null;
  return (
      <Pressable onPress={() => router.push({ pathname: "/community", params: { id: item.$id } })} style={styles.communityCard}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.communityImage} />
                  ) : (
                      <View style={[styles.communityImage, { backgroundColor: '#333' }]} />
                  )}
                  <View>
                      <Text style={styles.communityName}>{item.name}</Text>
                  </View>
              </View>
              <Pressable style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>انضم</Text>
              </Pressable>
          </View>
          <Text style={styles.communityDescription} numberOfLines={2}>
              {item.description || `اكتشف عالم ${item.name} وانضم إلى مجتمعنا اليوم!`}
          </Text>
      </Pressable>
  );
};

export default function Explore() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [trendingPosts, setTrendingPosts] = useState<PostType[]>([]);
  const [communities, setCommunities] = useState<communityType[]>([]);
  const [searchUsers, setSearchUsers] = useState<UserType[]>([]);
  const [searchCommunities, setSearchCommunities] = useState<communityType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<number | null>(null);

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twentyFourHoursAgoISO = twentyFourHoursAgo.toISOString();

        const postsPromise = databases.listDocuments(databaseId, postsCollectionId, [
          Query.greaterThanEqual('$createdAt', twentyFourHoursAgoISO),
          Query.or([
            Query.isNotNull('images'),
            Query.isNotNull('video')
          ]),
          Query.limit(50),
        ]);

        const communitiesPromise = databases.listDocuments(databaseId, communitiesCollectionId, [Query.limit(10)]);

        const [postsResponse, communitiesResponse] = await Promise.all([postsPromise, communitiesPromise]);

        const posts = postsResponse.documents as PostType[];

        const postsWithLikes = await Promise.all(
          posts.map(async (post) => {
            const likesResponse = await databases.listDocuments(
              databaseId,
              likesCollectionId,
              [Query.equal('posts', post.$id), Query.limit(1)]
            );
            return {
              ...post,
              likesCount: likesResponse.total,
            };
          })
        );

        postsWithLikes.sort((a, b) => b.likesCount - a.likesCount);
        
        const top10 = postsWithLikes.slice(0, 10);

        setTrendingPosts(top10 as any);
        setCommunities(communitiesResponse.documents as communityType[]);

      } catch (error) {
        console.error("Failed to fetch explore data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExploreData();
  }, []);

  // Search effect
  useEffect(() => {
    if (!search.trim()) {
      setSearchUsers([]);
      setSearchCommunities([]);
      setSearchLoading(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const [usersRes, commsRes] = await Promise.all([
          databases.listDocuments(databaseId, usersCollectionId, [
            Query.or([
              Query.contains('name', search),
              Query.contains('username', search)
            ]),
            Query.limit(3)
          ]),
          databases.listDocuments(databaseId, communitiesCollectionId, [
            Query.contains('name', search),
            Query.limit(3)
          ])
        ]);
        setSearchUsers(usersRes.documents as UserType[]);
        setSearchCommunities(commsRes.documents as communityType[]);
      } catch (e) {
        setSearchUsers([]);
        setSearchCommunities([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  return (
    <ScrollView style={{ backgroundColor: "white" }}>
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="بحث..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* Search Results */}
        {search.trim() ? (
          <View style={{marginBottom: 16, minHeight: 120}}>
            {searchLoading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : (
              <>
                {searchUsers.length > 0 && (
                  <View style={{marginBottom: 8}}>
                    <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4, textAlign: 'right', paddingHorizontal: 8}}>مستخدمون</Text>
                    <FlatList
                      data={searchUsers}
                      keyExtractor={item => item.$id}
                      horizontal
                      renderItem={({ item }) => (
                        <Pressable onPress={() => router.push({ pathname: "/userProfile", params: { id: item.$id } })} style={styles.userCard}>
                          <Image source={{ uri: item.userProfile }} style={styles.avatar} />
                          <Text style={styles.userName}>{item.name}</Text>
                          <Text style={styles.userUsername}>@{item.username}</Text>
                        </Pressable>
                      )}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalList}
                    />
                  </View>
                )}
                {searchCommunities.length > 0 && (
                  <View>
                    <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4, textAlign: 'right', paddingHorizontal: 8}}>مجتمعات</Text>
                    <FlatList
                      data={searchCommunities}
                      keyExtractor={item => item.$id}
                      horizontal
                      renderItem={({ item }) => <CommunityCard item={item} />}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalList}
                    />
                  </View>
                )}
                {searchUsers.length === 0 && searchCommunities.length === 0 && !searchLoading && (
                  <Text style={{textAlign: 'center', color: '#888', marginTop: 12}}>لا توجد نتائج</Text>
                )}
              </>
            )}
          </View>
        ) : (
          loading ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} /> : <>
            <View style={{flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 12}}>
              <Text style={styles.sectionTitle}>المنشورات الرائجة</Text>
              <Fire size={24} color="#FF9500" />
            </View>
            <FlatList
              data={trendingPosts}
              renderItem={({ item }) => <TrendingPostCard item={item} />}
              keyExtractor={(item) => item.$id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />

            <View style={{flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 8}}>
              <Text style={styles.sectionTitle}>اكتشف مجتمعات</Text>
              <UserPlus size={24} color="#007AFF" />
            </View>
            <FlatList
              data={communities}
              renderItem={({ item }) => <CommunityCard item={item} />}
              keyExtractor={(item) => item.$id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: "white",
  },
  searchBarContainer: {
    padding: 12,
  },
  searchBar: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: "right",
  },
  horizontalList: {
    marginBottom: 1,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  userCard: {
    width: 120,
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  userName: {
    
    fontSize: 15,
    marginBottom: 2,
    textAlign: "center",
  },
  userUsername: {
    
    fontSize: 12,
    color: "gray",
    marginBottom: 8,
    textAlign: "center",
  },
  followButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 300,
    marginRight: 12,
    height: 120, 
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  communityImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
    backgroundColor: '#E5E7EB',
  },
  communityName: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'right',
  },
  communityDescription: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trendingCard: {
    width: 240,
    height: 320,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  trendingMedia: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  trendingTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  trendingTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  trendingSubtitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  trendingAuthorInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  trendingAuthorImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  trendingAuthorName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});