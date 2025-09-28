import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Image,
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
}

const characterList: Character[] = [
  { 
    id: '1', 
    name: 'Hero Knight', 
    type: 'Fantasy', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Brave warrior character',
    isRive: true,
    riveFile: 'fifth.riv',
    animations: ['idle', 'walk', 'run', 'attack', 'jump']
  },
  { 
    id: '2', 
    name: 'six rive', 
    type: 'Fantasy', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Magical spellcaster',
    isRive: true,
    riveFile: 'six.riv',
    animations: ['idle', 'cast_spell', 'walk', 'teleport']
  },
  { 
    id: '3', 
    name: 'Robot Assistant', 
    type: 'Sci-Fi', 
    preview: 'https://images.pexels.com/photos/2085831/pexels-photo-2085831.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Helpful android companion',
    isRive: true,
    riveFile: 'fifth.riv',
    animations: ['idle', 'walk', 'work', 'dance', 'malfunction']
  },
  { 
    id: '4', 
    name: 'Princess Luna', 
    type: 'Fantasy', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Royal character',
    isRive: false
  },
  { 
    id: '5', 
    name: 'Space Explorer', 
    type: 'Sci-Fi', 
    preview: 'https://images.pexels.com/photos/2085831/pexels-photo-2085831.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Astronaut adventurer',
    isRive: false
  },
  { 
    id: '6', 
    name: 'Forest Elf', 
    type: 'Fantasy', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Nature guardian',
    isRive: false
  },
  { 
    id: '7', 
    name: 'Cyber Ninja', 
    type: 'Sci-Fi', 
    preview: 'https://images.pexels.com/photos/2085831/pexels-photo-2085831.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Stealthy warrior',
    isRive: false
  },
  { 
    id: '8', 
    name: 'Dragon Pet', 
    type: 'Fantasy', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400', 
    description: 'Friendly dragon companion',
    isRive: false
  },
];

export default function CharacterSelectionScreen({ navigation }: any) {
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

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
    console.log('Selected characters:', selectedCharacters);
    console.log('Selected background:', selectedBackground);
    
    navigation.navigate('Movie', { selectedCharacters, selectedBackground });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

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
          <Text style={styles.characterDescription}>{item.description}</Text>
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
            Choose characters for your animation ({selectedCharacters.length} selected)
          </Text>
        </View>
      </View>

      <FlatList
        data={characterList}
        renderItem={renderCharacterItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.characterList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
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