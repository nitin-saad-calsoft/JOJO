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
import { useBackgrounds } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

interface BackgroundItem {
  _id: string;
  name: string;
  type: string;
  filename?: string;
  colorData?: {
    primary: string;
    secondary?: string;
    direction?: string;
  };
  category: string;
  preview?: string;
}


export default function BackgroundSelectionScreen({ navigation, route }: any) {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  
  // Add error handling for auth hook
  let user = null;
  let logout = null;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
  } catch (error) {
    console.log('Auth context not available, using fallback');
  }

  const { data: backgroundsData, loading, error, refetch } = useBackgrounds();

  useEffect(() => {
    if (backgroundsData?.backgrounds) {
      console.log('API Data received:', backgroundsData);
      const transformedBackgrounds = backgroundsData.backgrounds.map((bg: any) => ({
        _id: bg._id,
        name: bg.name,
        type: bg.type || bg.category,
        category: bg.category,
        filename: bg.filename,
        colorData: bg.colorData,
        preview: bg.type === 'image' && bg.filename 
          ? `http://10.0.2.2:5000/uploads/backgrounds/${bg.filename}`
          : undefined,
      }));
      setBackgrounds(transformedBackgrounds);
    }
  }, [backgroundsData, error]);

  // If still loading, show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading backgrounds from server...</Text>
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
          <Text style={styles.errorText}>Failed to load backgrounds</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId);
  };

  const handleContinue = () => {
    if (!selectedBackground) {
      Alert.alert('Selection Required', 'Please select a background to continue.');
      return;
    }
    
    console.log('=== BACKGROUND SELECTION CONTINUE ===');
    console.log('Selected background ID:', selectedBackground);
    const backgroundData = backgrounds.find(bg => bg._id === selectedBackground);
    console.log('Background data:', backgroundData);
    
    navigation.navigate('Characters', { 
      selectedBackground: backgroundData,
      selectedAudio: route?.params?.selectedAudio // Pass through audio data
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

  const renderBackgroundItem = ({ item }: { item: BackgroundItem }) => (
    <TouchableOpacity
      style={[
        styles.backgroundItem,
        selectedBackground === item._id && styles.selectedBackgroundItem
      ]}
      onPress={() => handleBackgroundSelect(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.backgroundPreview}>
        {item.type === 'image' && item.preview ? (
          <Image
            source={{ 
              uri: item.preview,
              cache: 'reload', // Force reload to bypass cache issues
            }}
            style={styles.previewImage}
            resizeMode="cover"
            onLoad={() => console.log('✅ Image loaded successfully:', item.preview)}
            onError={(error) => {
              console.log('❌ Failed to load image:', item.preview);
              console.log('Error details:', error.nativeEvent?.error);
              // Try to fetch the image with fetch API to see the actual error
              fetch(item.preview)
                .then(response => console.log('Fetch response:', response.status, response.headers))
                .catch(fetchError => console.log('Fetch error:', fetchError));
            }}
          />
        ) : item.colorData ? (
          <View 
            style={[
              styles.colorPreview, 
              { backgroundColor: item.colorData.primary }
            ]} 
          />
        ) : (
          <View style={[styles.colorPreview, { backgroundColor: '#E5E7EB' }]}>
            <Icon name="image" size={32} color="#9CA3AF" />
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
              No Preview Available
            </Text>
          </View>
        )}
        
        {selectedBackground === item._id && (
          <View style={styles.selectedOverlay}>
            <Icon name="check" size={24} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.backgroundInfo}>
        <Text style={styles.backgroundName}>{item.name}</Text>
        <Text style={styles.backgroundType}>{item.category}</Text>
        {/* Debug info */}
        {__DEV__ && (
          <Text style={{ fontSize: 8, color: 'red' }}>
            Type: {item.type} | File: {item.filename || 'none'} | URL: {item.preview ? 'yes' : 'no'}
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
          <Text style={styles.title}>Select Background</Text>
          <Text style={styles.subtitle}>
            Choose a background for your animation scene ({backgrounds.length} available)
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
        data={backgrounds}
        renderItem={renderBackgroundItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        style={styles.backgroundList}
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
            !selectedBackground && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedBackground}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedBackground && styles.disabledButtonText
          ]}>
            Continue to Character Selection
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backgroundList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  backgroundItem: {
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
  selectedBackgroundItem: {
    borderColor: '#3B82F6',
  },
  backgroundPreview: {
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundInfo: {
    padding: 12,
  },
  backgroundName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  backgroundType: {
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