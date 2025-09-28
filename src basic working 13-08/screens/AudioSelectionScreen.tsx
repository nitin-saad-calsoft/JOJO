import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AudioItem {
  id: string;
  name: string;
  duration: string;
  file: string;
}

const audioList: AudioItem[] = [
  { id: '1', name: 'Happy Background Music', duration: '2:30', file: 'happy_bg.mp3' },
  { id: '2', name: 'Adventure Theme', duration: '3:15', file: 'adventure.mp3' },
  { id: '3', name: 'Calm Ambient', duration: '4:00', file: 'calm_ambient.mp3' },
  { id: '4', name: 'Upbeat Pop', duration: '2:45', file: 'upbeat_pop.mp3' },
  { id: '5', name: 'Epic Orchestral', duration: '5:20', file: 'epic_orchestral.mp3' },
  { id: '6', name: 'Jazz Lounge', duration: '3:30', file: 'jazz_lounge.mp3' },
  { id: '7', name: 'Electronic Dance', duration: '3:00', file: 'electronic_dance.mp3' },
  { id: '8', name: 'Acoustic Guitar', duration: '2:15', file: 'acoustic_guitar.mp3' },
];

export default function AudioSelectionScreen({ navigation }: any) {
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  const handleAudioSelect = (audioId: string) => {
    setSelectedAudio(audioId);
  };

  const handleContinue = () => {
    if (!selectedAudio) {
      Alert.alert('Selection Required', 'Please select an audio track to continue.');
      return;
    }
    
    navigation.navigate('Background');
  };

  const renderAudioItem = ({ item }: { item: AudioItem }) => (
    <TouchableOpacity
      style={[
        styles.audioItem,
        selectedAudio === item.id && styles.selectedAudioItem
      ]}
      onPress={() => handleAudioSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.audioIcon}>
        <Icon name="music-note" size={24} color={selectedAudio === item.id ? '#FFFFFF' : '#3B82F6'} />
      </View>
      
      <View style={styles.audioInfo}>
        <Text style={[
          styles.audioName,
          selectedAudio === item.id && styles.selectedText
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.audioDuration,
          selectedAudio === item.id && styles.selectedSubText
        ]}>
          Duration: {item.duration}
        </Text>
      </View>

      <View style={styles.audioActions}>
        <TouchableOpacity style={styles.playButton}>
          <Icon name="play-arrow" size={16} color="#6B7280" />
        </TouchableOpacity>
        
        {selectedAudio === item.id && (
          <View style={styles.checkIcon}>
            <Icon name="check" size={20} color="#FFFFFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Audio Track</Text>
        <Text style={styles.subtitle}>
          Choose a background music for your animation
        </Text>
      </View>

      <FlatList
        data={audioList}
        renderItem={renderAudioItem}
        keyExtractor={(item) => item.id}
        style={styles.audioList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedAudio && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedAudio}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedAudio && styles.disabledButtonText
          ]}>
            Continue to Background Selection
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  audioList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedAudioItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  audioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  audioDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedSubText: {
    color: '#E5E7EB',
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#D1D5DB',
  },
});