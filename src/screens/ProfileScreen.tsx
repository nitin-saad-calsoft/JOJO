import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const [drafts, setDrafts] = useState<any[]>([]);
  useEffect(() => {
    apiService.getMyDraftMovies().then(res => setDrafts(res.movies));
  }, []);

  // Helper to get preview image from draft data
  const getDraftPreview = (draft: any) => {
    const firstChar = draft.data?.characters?.[0];
    if (firstChar?.preview) return firstChar.preview;
    if (draft.data?.selectedBackground?.preview) return draft.data.selectedBackground.preview;
    return 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  // When user taps a draft, open it in MovieCreationScreen with all draft data and movieId
  const handleDraftPress = (draft: any) => {
    navigation.navigate('Movie', {
      selectedCharacters: draft.data?.characters || [],
      selectedBackground: draft.data?.selectedBackground,
      selectedAudio: draft.data?.selectedAudio,
      keyframes: draft.data?.keyframes || [],
      chunks: draft.data?.chunks || [],
      movieId: draft._id, // Pass movieId so only update happens
      isDraft: true, // flag for draft
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 16, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="person" size={28} color="#3B82F6" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>My Content</Text>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#8B5CF6',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => navigation.navigate('VideoGallery')} // Changed from 'VideoGalleryScreen' to 'VideoGallery'
        >
          <Icon name="video-library" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>
            Video Gallery
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 16, fontWeight: '600', marginLeft: 16, marginBottom: 8 }}>
        Saved Drafts
      </Text>
      <FlatList
        data={drafts}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.draftCard}
            onPress={() => handleDraftPress(item)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: getDraftPreview(item) }}
              style={styles.draftImage}
              resizeMode="cover"
            />
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle}>{item.title || 'Untitled Movie'}</Text>
              <Text style={styles.draftDate}>{new Date(item.updatedAt).toLocaleString()}</Text>
            </View>
            <Icon name="arrow-forward" size={20} color="#6366F1" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  draftImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  draftInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  draftTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  draftDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});
