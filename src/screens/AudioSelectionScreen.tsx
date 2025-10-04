import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-sound';
import { useAudioFiles } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

interface AudioItem {
  _id: string;
  name: string;
  duration: string;
  filename: string;
  category: string;
  preview?: string;
  filesize?: string;
}

// Remove fallback data completely
export default function AudioSelectionScreen({ navigation }: any) {
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playingSound, setPlayingSound] = useState<Sound | null>(null);
  
  // Move all hooks to the top level - no conditional hook calls
  const { data: audioData, loading, error, refetch } = useAudioFiles();
  
  // Use useAuth hook at top level, handle errors in the component logic
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log('Auth context not available, using fallback');
    authContext = { user: null, logout: null };
  }
  
  const { user, logout } = authContext;
console.log("909090audioData", audioData)
  // Initialize Sound
  useEffect(() => {
    Sound.setCategory('Playback');
    return () => {
      // Cleanup sound when component unmounts
      if (playingSound) {
        playingSound.stop();
        playingSound.release();
      }
    };
  }, [playingSound]);

  const stopCurrentSound = useCallback(() => {
    if (playingSound) {
      playingSound.stop();
      playingSound.release();
      setPlayingSound(null);
      setCurrentlyPlaying(null);
    }
  }, [playingSound]);

  const playAudio = useCallback((audioItem: AudioItem) => {
    // Stop any currently playing sound
    stopCurrentSound();

    if (!audioItem.preview) {
      Alert.alert('Preview Not Available', 'Audio preview is not available for this track.');
      return;
    }

    setCurrentlyPlaying(audioItem._id);

    // For remote URLs
    const sound = new Sound(audioItem.preview, '', (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        Alert.alert('Playback Error', 'Failed to load audio file');
        setCurrentlyPlaying(null);
        return;
      }

      // Play the sound
      sound.play((success) => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        setCurrentlyPlaying(null);
        sound.release();
        setPlayingSound(null);
      });

      setPlayingSound(sound);
    });
  }, [stopCurrentSound]);

  const toggleAudioPlayback = useCallback((audioItem: AudioItem) => {
    if (currentlyPlaying === audioItem._id) {
      // Stop the currently playing audio
      stopCurrentSound();
    } else {
      // Play the new audio
      playAudio(audioItem);
    }
  }, [currentlyPlaying, playAudio, stopCurrentSound]);

  useEffect(() => {
    console.log('=== AUDIO DATA DEBUG ===');
    console.log('audioData:', audioData);
    console.log('error:', error);
    console.log('loading:', loading);
    
    if (audioData?.audio) {
      console.log('✅ Found audio data:', audioData.audio);
      console.log('Audio array length:', audioData.audio.length);
      
      const transformedAudio = audioData.audio.map((audio: any) => {
        console.log('Transforming audio item:', audio);
        return {
          _id: audio._id,
          name: audio.name,
          duration: audio.duration || '0:00',
          filename: audio.filename,
          category: audio.category,
          filesize: audio.filesize,
          preview: audio.filename 
            ? `http://10.0.2.2:5000/uploads/audio/${audio.filename}`
            : undefined,
        };
      });
      
      console.log('✅ Transformed audio:', transformedAudio);
      setAudioFiles(transformedAudio);
    }
  }, [audioData, error, loading]);

  // If still loading, show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading audio tracks from server...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If error, show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load audio tracks</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAudioSelect = (audioId: string) => {
    setSelectedAudio(audioId);
  };

  const handleContinue = () => {
    if (!selectedAudio) {
      Alert.alert('Selection Required', 'Please select an audio track to continue.');
      return;
    }
    
    // Stop any playing audio before navigation
    stopCurrentSound();
    
    console.log('=== AUDIO SELECTION CONTINUE ===');
    console.log('Selected audio ID:', selectedAudio);
    const audioData = audioFiles.find(audio => audio._id === selectedAudio);
    console.log('Audio data:', audioData);
    
    navigation.navigate('Background', { selectedAudio: audioData });
  };

  const handleGoBack = () => {
    // Stop any playing audio before going back
    stopCurrentSound();
    navigation.goBack();
  };

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    } else {
      // Fallback navigation if auth is not available
      navigation.navigate('Login');
    }
  };

  const renderAudioItem = ({ item }: { item: AudioItem }) => (
    <TouchableOpacity
      style={[
        styles.audioItem,
        selectedAudio === item._id && styles.selectedAudioItem
      ]}
      onPress={() => handleAudioSelect(item._id)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.audioIcon,
        selectedAudio === item._id && styles.selectedAudioIcon
      ]}>
        <Icon name="music-note" size={24} color={selectedAudio === item._id ? '#FFFFFF' : '#3B82F6'} />
      </View>
      
      <View style={styles.audioInfo}>
        <Text style={[
          styles.audioName,
          selectedAudio === item._id && styles.selectedText
        ]}>
          {item.name}
        </Text>
        {/* Show duration in a separate line for clarity */}
        <Text style={[
          styles.audioDuration,
          selectedAudio === item._id && styles.selectedSubText
        ]}>
          Duration: {item.duration !== '0:00' ? item.duration : 'Loading...'}
        </Text>
        {item.filesize && (
          <Text style={[
            styles.audioFilesize,
            selectedAudio === item._id && styles.selectedSubText
          ]}>
            Size: {item.filesize}
          </Text>
        )}
        {/* Debug info */}
        {__DEV__ && (
          <Text style={{ fontSize: 8, color: selectedAudio === item._id ? '#E5E7EB' : 'red' }}>
            File: {item.filename || 'none'} | Preview: {item.preview ? 'yes' : 'no'}
          </Text>
        )}
      </View>

      <View style={styles.audioActions}>
        <TouchableOpacity 
          style={[
            styles.playButton,
            currentlyPlaying === item._id && styles.playingButton
          ]}
          onPress={() => toggleAudioPlayback(item)}
        >
          <Icon 
            name={currentlyPlaying === item._id ? "pause" : "play-arrow"} 
            size={16} 
            color={currentlyPlaying === item._id ? "#FFFFFF" : "#6B7280"} 
          />
        </TouchableOpacity>
        
        {selectedAudio === item._id && (
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
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Audio Track</Text>
          <Text style={styles.subtitle}>
            Choose a background music for your animation ({audioFiles.length} available)
            {user && ` • Welcome, ${user.name}!`}
            {error && ' • Using offline data'}
          </Text>
        </View>
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={audioFiles}
        renderItem={renderAudioItem}
        keyExtractor={(item) => item._id}
        style={styles.audioList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={refetch}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  playingButton: {
    backgroundColor: '#3B82F6',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedAudioIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  audioFilesize: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});