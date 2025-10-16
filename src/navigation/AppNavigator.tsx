import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useVideos } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import Sound from 'react-native-sound';

interface VideoItem {
  _id: string;
  name: string;
  duration: string;
  filename: string;
  category: string;
  preview?: string;
  filesize?: string;
}

export default function VideoGalleryScreen({ navigation }: any) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<VideoItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playingSound, setPlayingSound] = useState<Sound | null>(null);
  
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log('Auth context not available, using fallback');
    authContext = { user: null, logout: null };
  }
  
  const { user, logout } = authContext;

  const { data: videoData, loading, error, refetch } = useVideos();
  
  useEffect(() => {
    if (videoData?.videos) {
      const transformedVideos = videoData.videos.map((video: any) => ({
        _id: video._id,
        name: video.name,
        duration: video.duration || '0:00',
        filename: video.filename,
        category: video.category,
        filesize: video.filesize,
        preview: video.filename 
          ? `http://10.0.2.2:5000/uploads/videos/${video.filename}`
          : undefined,
      }));
      setVideoFiles(transformedVideos);
    }
  }, [videoData, error, loading]);

  // If still loading, show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading videos from server...</Text>
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
          <Text style={styles.errorText}>Failed to load videos</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleContinue = () => {
    if (!selectedVideo) {
      Alert.alert('Selection Required', 'Please select a video to continue.');
      return;
    }
    
    // Stop any playing audio before navigation
    // stopCurrentSound();
    
    console.log('=== VIDEO SELECTION CONTINUE ===');
    console.log('Selected video ID:', selectedVideo);
    const videoData = videoFiles.find(video => video._id === selectedVideo);
    console.log('Video data:', videoData);
    
    navigation.navigate('NextScreen', { 
      selectedVideo: videoData,
      // Pass other params if needed
    });
  };

  const handleGoBack = () => {
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

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={[
        styles.videoItem,
        selectedVideo === item._id && styles.selectedVideoItem
      ]}
      onPress={() => handleVideoSelect(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.videoPreview}>
        {item.preview ? (
          <Image
            source={{ 
              uri: item.preview,
              cache: 'reload', // Force reload to bypass cache issues
            }}
            style={styles.previewImage}
            resizeMode="cover"
            onLoad={() => console.log('✅ Video thumbnail loaded successfully:', item.preview)}
            onError={(error) => {
              console.log('❌ Failed to load thumbnail:', item.preview);
              console.log('Error details:', error.nativeEvent?.error);
            }}
          />
        ) : (
          <View style={[styles.colorPreview, { backgroundColor: '#E5E7EB' }]}>
            <Icon name="video-library" size={32} color="#9CA3AF" />
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
              No Preview Available
            </Text>
          </View>
        )}
        
        {selectedVideo === item._id && (
          <View style={styles.selectedOverlay}>
            <Icon name="check" size={24} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.videoName}>{item.name}</Text>
        <Text style={styles.videoDuration}>{item.duration}</Text>
        {/* Debug info */}
        {__DEV__ && (
          <Text style={{ fontSize: 8, color: 'red' }}>
            File: {item.filename || 'none'} | Preview: {item.preview ? 'yes' : 'no'}
          </Text>
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
          <Text style={styles.title}>Select Video</Text>
          <Text style={styles.subtitle}>
            Choose a video for your animation ({videoFiles.length} available)
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
        data={videoFiles}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        style={styles.videoList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        refreshing={loading}
        onRefresh={refetch}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedVideo && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedVideo}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedVideo && styles.disabledButtonText
          ]}>
            Continue to Next Step
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
  videoList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  videoItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedVideoItem: {
    borderColor: '#3B82F6',
  },
  videoPreview: {
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  colorPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    padding: 12,
  },
  videoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 12,
    color: '#6B7280',
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
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});