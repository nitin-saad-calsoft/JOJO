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

interface Character {
  id: string;
  name: string;
  type: string;
  preview: string;
  description: string;
  isRive?: boolean;
  riveFile?: string;
  animations?: string[];
  category?: string;
}

export default function CharacterSelectionScreen({ navigation, route }: any) {
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch characters from API
  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://10.0.2.2:5000/api/characters');
      const data = await response.json();
      console.log('API Characters loaded:', data);
      
      // Transform API characters to match our interface
      // Update the preview URL logic to support SVG and JPEG images
      const transformedCharacters = (data.characters || []).map((char: any) => {
        let previewUrl = 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400';
        if (char.previewImage?.filename) {
          // Support SVG and JPEG images
          const mimeType = char.previewImage?.mimeType || '';
          if (mimeType === 'image/svg+xml') {
            previewUrl = `http://10.0.2.2:5000/uploads/characters/${char.previewImage.filename}`;
          } else if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
            previewUrl = `http://10.0.2.2:5000/uploads/characters/${char.previewImage.filename}`;
          }
        }

        return {
          id: char._id,
          name: char.name,
          type: char.category || 'Unknown',
          preview: previewUrl,
          description: char.description || 'No description available',
          isRive: char.type === 'rive',
          riveFile: char.riveFile?.filename?.replace('.riv', '') || null,
          animations: char.animations?.map((a: any) => a.name) || ['idle', 'walk', 'talk'],
          category: char.category,
        };
      });

      setCharacters(transformedCharacters);
    } catch (error) {
      console.error('Failed to load characters from API:', error);
      setError('Failed to load characters from server');
    } finally {
      setLoading(false);
    }
  };

  console.log("*(*(*(*(*", characters)

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Get selected background from navigation params
  const selectedBackground = navigation.getState()?.routes?.find(r => r.name === 'Characters')?.params?.selectedBackground;

  const handleCharacterToggle = (characterId: string) => {
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      } else {
        return [...prev, characterId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedCharacters.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one character to continue.');
      return;
    }
    
    console.log('=== CHARACTER SELECTION CONTINUE ===');
    console.log('Selected character IDs:', selectedCharacters);
    
    // Get the actual character data, not just IDs
    const selectedCharacterData = selectedCharacters.map(id => {
      return characters.find(char => char.id === id);
    }).filter(Boolean); // Remove any undefined values
    
    console.log('Selected character data:', selectedCharacterData);
    console.log('Selected background:', selectedBackground);
    
    navigation.navigate('Movie', { 
      selectedCharacters: selectedCharacterData, // Pass actual data
      selectedBackground,
      selectedAudio: route?.params?.selectedAudio // Pass through audio data
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    fetchCharacters();
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Select Characters</Text>
            <Text style={styles.subtitle}>Loading characters from server...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading characters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Select Characters</Text>
            <Text style={styles.subtitle}>Failed to load characters</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load characters</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (characters.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Select Characters</Text>
            <Text style={styles.subtitle}>No characters available</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No characters available</Text>
          <Text style={styles.emptySubtext}>Please add characters from the admin panel</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderCharacterItem = ({ item }: { item: Character }) => {
    const isSelected = selectedCharacters.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.characterItem,
          isSelected && styles.selectedCharacterItem
        ]}
        onPress={() => handleCharacterToggle(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.characterPreview}>
          <Image
            source={{ uri: item.preview }}
            style={styles.previewImage}
            resizeMode="cover"
            onLoad={() => console.log('✅ Character image loaded:', item.preview)}
            onError={(error) => {
              console.log('❌ Character image failed:', item.preview);
            }}
          />
          
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Icon name="check" size={20} color="#FFFFFF" />
            </View>
          )}
          
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.selectionCircle,
              isSelected && styles.selectedCircle
            ]}>
              {isSelected && <Icon name="check" size={16} color="#FFFFFF" />}
            </View>
          </View>
        </View>
        
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{item.name}</Text>
          <Text style={styles.characterType}>{item.type}</Text>
          {item.isRive && (
            <View style={styles.riveIndicator}>
              <Text style={styles.riveText}>🎭 Rive</Text>
            </View>
          )}
          <Text style={styles.characterDescription} numberOfLines={2}>
            {item.description}
          </Text>
          {/* Debug info in development */}
          {__DEV__ && (
            <Text style={styles.debugText}>
              ID: {item.id} | Type: {item.isRive ? 'Rive' : 'Static'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Characters</Text>
          <Text style={styles.subtitle}>
            Choose characters for your animation ({selectedCharacters.length} selected from {characters.length} available)
          </Text>
        </View>
      </View>

      <FlatList
        data={characters}
        renderItem={renderCharacterItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.characterList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        refreshing={loading}
        onRefresh={fetchCharacters}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedCharacters.length === 0 && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedCharacters.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            selectedCharacters.length === 0 && styles.disabledButtonText
          ]}>
            Create Movie ({selectedCharacters.length} characters)
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
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
  debugText: {
    fontSize: 8,
    color: '#EF4444',
    marginTop: 2,
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
  characterList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  characterItem: {
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
  selectedCharacterItem: {
    borderColor: '#3B82F6',
  },
  characterPreview: {
    height: 140,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  characterInfo: {
    padding: 12,
  },
  characterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  characterType: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
  },
  riveIndicator: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  riveText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
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

// Export the characterList for backward compatibility if needed elsewhere
export const characterList: Character[] = [];