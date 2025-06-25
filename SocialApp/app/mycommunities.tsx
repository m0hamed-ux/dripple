import { useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { account, communitiesCollectionId, communityMembersCollectionId, databaseId, safeListDocuments } from '../lib/appwrite';
import { communityType } from '../types/database.type';

const CommunityCard = ({ item, onPress }: { item: communityType, onPress: () => void }) => {
  const imageUrl = item.image ? item.image : null;
  return (
    <Pressable onPress={onPress} style={styles.communityCard}>
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
      </View>
      <Text style={styles.communityDescription} numberOfLines={2}>
        {item.description || `اكتشف عالم ${item.name} وانضم إلى مجتمعنا اليوم!`}
      </Text>
    </Pressable>
  );
};

export default function MyCommunities() {
  const [created, setCreated] = useState<communityType[]>([]);
  const [joined, setJoined] = useState<communityType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        // Communities I created
        const createdRes = await safeListDocuments(
          databaseId,
          communitiesCollectionId,
          [Query.equal('admin', user.$id)]
        );
        setCreated(createdRes.documents as communityType[]);
        // Communities I joined
        const joinedMemberships = await safeListDocuments(
          databaseId,
          communityMembersCollectionId,
          [Query.equal('user', user.$id)]
        );
        const joinedCommunityIds = joinedMemberships.documents
          .map((doc: any) => typeof doc.community === 'string' ? doc.community : doc.community?.$id)
          .filter(Boolean);
        let joinedCommunities: communityType[] = [];
        if (joinedCommunityIds.length > 0) {
          const joinedRes = await safeListDocuments(
            databaseId,
            communitiesCollectionId,
            [Query.equal('$id', joinedCommunityIds)]
          );
          joinedCommunities = joinedRes.documents as communityType[];
        } else {
          joinedCommunities = [];
        }
        // Remove duplicates (if user is admin and member)
        const createdIds = new Set(createdRes.documents.map((c: any) => c.$id));
        setJoined(joinedCommunities.filter(c => !createdIds.has(c.$id)));
      } catch (e) {
        setCreated([]);
        setJoined([]);
      }
      setLoading(false);
    };
    fetchCommunities();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Text style={styles.sectionTitle}>المجتمعات التي أنشأتها</Text>
        {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> :
          created.length === 0 ? <Text style={styles.emptyText}>لا توجد مجتمعات قمت بإنشائها.</Text> :
            <FlatList
              data={created}
              keyExtractor={item => item.$id}
              renderItem={({ item }) => <CommunityCard item={item} onPress={() => router.push({ pathname: '/community', params: { id: item.$id } })} />}
              scrollEnabled={false}
            />
        }
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>المجتمعات التي انضممت إليها</Text>
        {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> :
          joined.length === 0 ? <Text style={styles.emptyText}>لا توجد مجتمعات انضممت إليها.</Text> :
            <FlatList
              data={joined}
              keyExtractor={item => item.$id}
              renderItem={({ item }) => <CommunityCard item={item} onPress={() => router.push({ pathname: '/community', params: { id: item.$id } })} />}
              scrollEnabled={false}
            />
        }
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => router.push('/createCommunity')}>
        <Plus size={32} color="#fff" weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'right',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 14,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
