import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
  Platform,
  Share,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';

const { width: screenWidth } = Dimensions.get('window');

interface VideoFile {
  name: string;
  path: string;
  size: number;
  dateCreated: Date;
  duration?: number;
}

export default function VideoGalleryScreen({ navigation }: any) {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const documentsPath = RNFS.DocumentDirectoryPath;
      const files = await RNFS.readdir(documentsPath);
      
      // Filter for HareRam animation videos
      const videoFiles = files.filter(file => 
        file.includes('HareRam_Animation_') && file.endsWith('.mp4')
      );

      const videoData: VideoFile[] = [];
      
      for (const file of videoFiles) {
        try {
          const filePath = `${documentsPath}/${file}`;
          const stats = await RNFS.stat(filePath);
          
          videoData.push({
            name: file.replace('HareRam_Animation_', '').replace('.mp4', ''),
            path: filePath,
            size: stats.size,
            dateCreated: new Date(stats.mtime),
          });
        } catch (error) {
          console.warn('Error reading video file stats:', error);
        }
      }
      
      // Sort by creation date (newest first)
      videoData.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
      
      setVideos(videoData);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleVideoPress = (video: VideoFile) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
    setIsPlaying(true);
  };

  const handleCloseVideo = () => {
    setIsPlaying(false);
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const handleShareVideo = async (video: VideoFile) => {
    try {
      if (Platform.OS === 'android') {
        // For Android, copy to external directory for sharing
        const externalPath = `${RNFS.ExternalDirectoryPath}/HareRam_Animation_${video.name}.mp4`;
        await RNFS.copyFile(video.path, externalPath);
        
        await Share.share({
          url: `file://${externalPath}`,
          type: 'video/mp4',
          title: `HareRam Animation - ${video.name}`,
        });
      } else {
        await Share.share({
          url: `file://${video.path}`,
          type: 'video/mp4',
          title: `HareRam Animation - ${video.name}`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share video');
    }
  };

  const handleDownloadToGallery = async (video: VideoFile) => {
    try {
      if (Platform.OS === 'android') {
        // For Android, we can copy to Downloads folder
        const downloadsPath = `${RNFS.ExternalDirectoryPath}/Download/HareRam_Animation_${video.name}.mp4`;
        await RNFS.copyFile(video.path, downloadsPath);
        
        Alert.alert(
          'Download Complete',
          `Video saved to Downloads folder as HareRam_Animation_${video.name}.mp4`,
          [
            { text: 'OK' },
            { 
              text: 'Open Folder', 
              onPress: () => {
                // Try to open file manager (this may not work on all devices)
                Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download')
                  .catch(() => {
                    Alert.alert('Info', 'Please check your Downloads folder in the file manager');
                  });
              }
            }
          ]
        );
      } else {
        // For iOS, we can save to Photos library (would need additional permissions)
        Alert.alert(
          'Save to Photos',
          'To save to your photo library, please share the video and select "Save Video"',
          [
            { text: 'Cancel' },
            { text: 'Share Now', onPress: () => handleShareVideo(video) }
          ]
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to save video to device');
    }
  };

  const handleDeleteVideo = (video: VideoFile) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(video.path);
              setVideos(videos.filter(v => v.path !== video.path));
              Alert.alert('Success', 'Video deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete video');
            }
          }
        }
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: VideoFile }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.videoThumbnail}>
        <Icon name="play-circle-outline" size={48} color="#3B82F6" />
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.videoName} numberOfLines={1}>
          Animation {item.name}
        </Text>
        <Text style={styles.videoDetails}>
          {formatFileSize(item.size)} • {formatDate(item.dateCreated)}
        </Text>
      </View>
      
      <View style={styles.videoActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShareVideo(item)}
        >
          <Icon name="share" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDownloadToGallery(item)}
        >
          <Icon name="file-download" size={20} color="#10B981" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteVideo(item)}
        >
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Video Gallery</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={loadVideos}
        >
          <Icon name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Video List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Icon name="video-library" size={64} color="#E5E7EB" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="videocam-off" size={64} color="#E5E7EB" />
          <Text style={styles.emptyTitle}>No Videos Found</Text>
          <Text style={styles.emptySubtitle}>
            Create your first animation to see it here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.path}
          style={styles.videoList}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={showVideoModal}
        animationType="fade"
        transparent={false}
        onRequestClose={handleCloseVideo}
      >
        <SafeAreaView style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={handleCloseVideo}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.videoModalTitle} numberOfLines={1}>
              {selectedVideo ? `Animation ${selectedVideo.name}` : ''}
            </Text>
            
            <View style={styles.modalActions}>
              {selectedVideo && (
                <>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => handleShareVideo(selectedVideo)}
                  >
                    <Icon name="share" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => handleDownloadToGallery(selectedVideo)}
                  >
                    <Icon name="file-download" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          {selectedVideo && (
            <View style={styles.videoPlayerContainer}>
              <Video
                source={{ uri: `file://${selectedVideo.path}` }}
                style={styles.videoPlayer}
                controls={true}
                resizeMode="contain"
                paused={!isPlaying}
                onLoad={(data) => {
                  console.log('Video loaded:', data);
                }}
                onError={(error) => {
                  console.error('Video error:', error);
                  Alert.alert('Error', 'Unable to play video');
                }}
                onEnd={() => setIsPlaying(false)}
              />
            </View>
          )}
          
          {selectedVideo && (
            <View style={styles.videoModalInfo}>
              <Text style={styles.modalInfoText}>
                Size: {formatFileSize(selectedVideo.size)}
              </Text>
              <Text style={styles.modalInfoText}>
                Created: {formatDate(selectedVideo.dateCreated)}
              </Text>
              <Text style={styles.modalInfoPath} numberOfLines={2}>
                Path: {selectedVideo.path}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  videoList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
    marginRight: 12,
  },
  videoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  videoDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  videoModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: screenWidth,
    height: screenWidth * 0.75, // 4:3 aspect ratio
    backgroundColor: '#000000',
  },
  videoModalInfo: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalInfoText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  modalInfoPath: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
