import { UserType } from '@/types/database.type';
import { X } from 'phosphor-react-native';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StoryViewsProps {
  visible: boolean;
  onClose: () => void;
  viewers: UserType[];
  storyOwner: UserType;
}

export default function StoryViews({ visible, onClose, viewers, storyOwner }: StoryViewsProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>مشاهدات القصة ({viewers.length})</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#000" weight="bold" />
              </TouchableOpacity>
            </View>
            <View style={styles.storyOwnerInfo}>
              <Image source={{ uri: storyOwner.userProfile }} style={styles.storyOwnerImage} />
              <Text style={styles.storyOwnerName}>{storyOwner.name}</Text>
            </View>
          </View>

          {/* Viewers List */}
          <ScrollView style={styles.viewersList} showsVerticalScrollIndicator={false}>
            {viewers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لا توجد مشاهدات بعد</Text>
              </View>
            ) : (
              viewers.map((viewer, index) => (
                <View key={viewer.$id} style={styles.viewerItem}>
                  <View style={styles.viewerInfo}>
                    <Image source={{ uri: viewer.userProfile }} style={styles.viewerImage} />
                    <View style={styles.viewerDetails}>
                      <Text style={styles.viewerName}>{viewer.name}</Text>
                      <Text style={styles.viewerUsername}>@{viewer.username}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewTime}>الآن</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  storyOwnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyOwnerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  storyOwnerName: {
    fontSize: 16,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#000',
  },
  viewersList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    color: '#666',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewerImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  viewerDetails: {
    flex: 1,
  },
  viewerName: {
    fontSize: 16,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#000',
    marginBottom: 2,
  },
  viewerUsername: {
    fontSize: 14,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    color: '#666',
  },
  viewTime: {
    fontSize: 12,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    color: '#999',
  },
}); 