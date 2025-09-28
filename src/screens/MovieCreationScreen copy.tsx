import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  PanResponder,
  Animated,
  Alert,
  Modal,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Audio from '../components/Audio';

const { width: screenWidth } = Dimensions.get('window');

interface Character {
  id: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  animation: 'idle' | 'walk' | 'run' | 'talk';
  preview: string;
}

interface Keyframe {
  id: string;
  time: number;
  characters: Character[];
}

interface AnimationAction {
  id: string;
  name: string;
  icon: string;
}

const animationActions: AnimationAction[] = [
  { id: 'idle', name: 'Idle', icon: '🧍' },
  { id: 'walk', name: 'Walk', icon: '🚶' },
  { id: 'run', name: 'Run', icon: '🏃' },
  { id: 'talk', name: 'Talk', icon: '💬' },
];

const availableCharacters = [
  { id: '1', name: 'ddd Knight', preview: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '2', name: 'Wizard Mage', preview: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '3', name: 'Robot Assistant', preview: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

export default function MovieCreationScreen({ navigation }: any) {
  const [characters, setCharacters] = useState<Character[]>([
    // Start with empty array - characters will be added from selection
  ]);
  
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>('1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [activeMicCharacterId, setActiveMicCharacterId] = useState('Hero Knight');
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    {
      id: 'keyframe_0',
      time: 0,
      characters: []
    }
  ]);
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Load selected characters from navigation params
  React.useEffect(() => {
    const selectedCharacterIds = navigation.getState()?.routes?.find((r:any) => r.name === 'Movie')?.params?.selectedCharacters || [];
    
    if (selectedCharacterIds.length > 0) {
      const newCharacters = selectedCharacterIds.map((id: string, index: number) => {
        const characterData = availableCharacters.find(c => c.id === id);
        return {
          id: `char_${Date.now()}_${index}`,
          name: characterData?.name || `Character ${index + 1}`,
          x: 50 + (index * 80),
          y: 100 + (index * 60),
          scale: 1,
          rotation: 0,
          animation: 'idle' as const,
          preview: characterData?.preview || 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400'
        };
      });
      
      setCharacters(newCharacters);
      setSelectedCharacter(newCharacters[0]?.id || null);
      
      // Update initial keyframe
      setKeyframes([{
        id: 'keyframe_0',
        time: 0,
        characters: [...newCharacters]
      }]);
    }
  }, [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const addKeyframe = () => {
    const newKeyframe: Keyframe = {
      id: `keyframe_${Date.now()}`,
      time: currentTime,
      characters: [...characters], // Deep copy current character states
    };
    
    const newKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    setKeyframes(newKeyframes);
    
    // Update current keyframe index
    const newIndex = newKeyframes.findIndex(kf => kf.id === newKeyframe.id);
    setCurrentKeyframeIndex(newIndex);
    
    Alert.alert('Keyframe Added', `Keyframe added at ${Math.floor(currentTime / 1000)}s`);
  };

  const goToKeyframe = (index: number) => {
    if (index >= 0 && index < keyframes.length) {
      setCurrentKeyframeIndex(index);
      const keyframe = keyframes[index];
      setCharacters([...keyframe.characters]);
      setCurrentTime(keyframe.time);
      
      // Update selected character if it exists in this keyframe
      if (selectedCharacter && !keyframe.characters.find(c => c.id === selectedCharacter)) {
        setSelectedCharacter(keyframe.characters.length > 0 ? keyframe.characters[0].id : null);
      }
    }
  };

  const updateCurrentKeyframe = () => {
    if (currentKeyframeIndex >= 0 && currentKeyframeIndex < keyframes.length) {
      const updatedKeyframes = [...keyframes];
      updatedKeyframes[currentKeyframeIndex] = {
        ...updatedKeyframes[currentKeyframeIndex],
        characters: [...characters]
      };
      setKeyframes(updatedKeyframes);
    }
  };

  const deleteKeyframe = (index: number) => {
    if (keyframes.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one keyframe.');
      return;
    }
    
    Alert.alert(
      'Delete Keyframe',
      'Are you sure you want to delete this keyframe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newKeyframes = keyframes.filter((_, i) => i !== index);
            setKeyframes(newKeyframes);
            
            // Adjust current keyframe index
            if (currentKeyframeIndex >= newKeyframes.length) {
              setCurrentKeyframeIndex(newKeyframes.length - 1);
            } else if (currentKeyframeIndex === index && newKeyframes.length > 0) {
              goToKeyframe(Math.max(0, currentKeyframeIndex - 1));
            }
          }
        }
      ]
    );
  };

  const onTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const onPlayChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const createPanResponder = (characterId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedCharacter(characterId);
      },
      onPanResponderMove: (_, gestureState) => {
        setCharacters(prev => prev.map(char => 
          char.id === characterId 
            ? { ...char, x: char.x + gestureState.dx, y: char.y + gestureState.dy }
            : char
        ));
      },
      onPanResponderRelease: () => {
        updateCurrentKeyframe();
      },
    });
  };

  const rotateCharacter = () => {
    if (!selectedCharacter) return;
    
    setCharacters(prev => prev.map(char => 
      char.id === selectedCharacter 
        ? { ...char, rotation: (char.rotation + 45) % 360 }
        : char
    ));
    updateCurrentKeyframe();
  };

  const scaleCharacter = (increase: boolean) => {
    if (!selectedCharacter) return;
    
    setCharacters(prev => prev.map(char => 
      char.id === selectedCharacter 
        ? { 
            ...char, 
            scale: Math.max(0.5, Math.min(2, char.scale + (increase ? 0.1 : -0.1)))
          }
        : char
    ));
    updateCurrentKeyframe();
  };

  const deleteCharacter = () => {
    if (!selectedCharacter) return;
    
    Alert.alert(
      'Delete Character',
      'Are you sure you want to delete this character?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setCharacters(prev => prev.filter(char => char.id !== selectedCharacter));
            setSelectedCharacter(null);
            updateCurrentKeyframe();
          }
        }
      ]
    );
  };

  const setCharacterAnimation = (animation: 'idle' | 'walk' | 'run' | 'talk') => {
    if (!selectedCharacter) return;
    
    setCharacters(prev => prev.map(char => 
      char.id === selectedCharacter 
        ? { ...char, animation }
        : char
    ));
    updateCurrentKeyframe();
  };

  const addNewCharacter = (characterData: any) => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: characterData.name,
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 100,
      scale: 1,
      rotation: 0,
      animation: 'idle',
      preview: characterData.preview,
    };
    
    setCharacters(prev => [...prev, newCharacter]);
    setShowCharacterModal(false);
    updateCurrentKeyframe();
  };

  const renderCharacterItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.characterModalItem}
      onPress={() => addNewCharacter(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.preview }} style={styles.characterModalImage} />
      <Text style={styles.characterModalName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const selectedChar = characters.find(char => char.id === selectedCharacter);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Movie Creation</Text>
        <TouchableOpacity 
          style={styles.addCharacterButton}
          onPress={() => setShowCharacterModal(true)}
        >
          <Icon name="people" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Compact Keyframe Controls */}
      <View style={styles.compactKeyframeControls}>
        <Text style={styles.compactKeyframeText}>
          KF {currentKeyframeIndex + 1}/{keyframes.length} | {Math.floor(currentTime / 1000)}s
        </Text>
        
        <View style={styles.compactKeyframeButtons}>
          <TouchableOpacity
            style={[styles.compactButton, currentKeyframeIndex === 0 && styles.disabledButton]}
            onPress={() => goToKeyframe(currentKeyframeIndex - 1)}
            disabled={currentKeyframeIndex === 0}
          >
            <Icon name="skip-previous" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.compactAddButton} onPress={addKeyframe}>
            <Icon name="add" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.compactButton, styles.deleteKeyframeButton]}
            onPress={() => deleteKeyframe(currentKeyframeIndex)}
            disabled={keyframes.length <= 1}
          >
            <Icon name="delete" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.compactButton, currentKeyframeIndex === keyframes.length - 1 && styles.disabledButton]}
            onPress={() => goToKeyframe(currentKeyframeIndex + 1)}
            disabled={currentKeyframeIndex === keyframes.length - 1}
          >
            <Icon name="skip-next" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animation Canvas */}
      <View style={styles.canvas}>
        <View style={styles.canvasBackground}>
          {characters.map((character) => {
            const panResponder = createPanResponder(character.id);
            
            return (
              <Animated.View
                key={character.id}
                style={[
                  styles.character,
                  {
                    left: character.x,
                    top: character.y,
                    transform: [
                      { scale: character.scale },
                      { rotate: `${character.rotation}deg` }
                    ],
                    borderWidth: selectedCharacter === character.id ? 4 : 2,
                    borderColor: selectedCharacter === character.id ? '#3B82F6' : 'transparent',
                    backgroundColor: selectedCharacter === character.id ? '#EFF6FF' : '#FFFFFF',
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <Image 
                  source={{ uri: character.preview }} 
                  style={styles.characterImage}
                  resizeMode="contain"
                />
                
                {/* Animation indicator */}
                <View style={styles.animationIndicator}>
                  <Text style={styles.animationText}>
                    {animationActions.find(a => a.id === character.animation)?.icon}
                  </Text>
                </View>
                
                {/* Character name */}
                <Text style={styles.characterName}>{character.name}</Text>
                
                {/* Selection indicator */}
                {selectedCharacter === character.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Compact Control Panel */}
      <View style={styles.compactControlPanel}>
        {/* Quick Controls */}
        <View style={styles.quickControls}>
          {selectedChar ? (
            <>
              <TouchableOpacity 
                style={styles.propertiesButton}
                onPress={() => setShowPropertiesModal(true)}
              >
                <Icon name="settings" size={16} color="#FFFFFF" />
                <Text style={styles.quickButtonText}>Props</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickButton} onPress={rotateCharacter}>
                <Icon name="rotate-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickButton} onPress={() => scaleCharacter(true)}>
                <Icon name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickButton} onPress={() => scaleCharacter(false)}>
                <Icon name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickButton, styles.deleteButton]} 
                onPress={deleteCharacter}
              >
                <Icon name="delete" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noSelectionText}>Tap a character to select</Text>
          )}
          
          <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.pauseButton]}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Icon name={isPlaying ? "pause" : "play-arrow"} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio Timeline */}
      <View style={styles.compactAudioContainer}>
        <Audio 
          addKeyframe={addKeyframe}
          goToKeyframe={goToKeyframe}
          activeMicCharacterId={activeMicCharacterId}
          onPlayChange={onPlayChange}
          onTimeUpdate={onTimeUpdate}
          keyframes={keyframes}
          currentKeyframeIndex={currentKeyframeIndex}
        />
      </View>

      {/* Character Properties Modal */}
      <Modal
        visible={showPropertiesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPropertiesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.propertiesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Character Properties</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPropertiesModal(false)}
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedChar && (
              <View style={styles.propertiesContent}>
                <Text style={styles.propertyTitle}>{selectedChar.name}</Text>
                
                <View style={styles.propertySection}>
                  <Text style={styles.sectionTitle}>Position & Transform</Text>
                  <Text style={styles.propertyText}>X: {Math.round(selectedChar.x)}, Y: {Math.round(selectedChar.y)}</Text>
                  <Text style={styles.propertyText}>Scale: {selectedChar.scale.toFixed(1)}x</Text>
                  <Text style={styles.propertyText}>Rotation: {selectedChar.rotation}°</Text>
                </View>
                
                <View style={styles.propertySection}>
                  <Text style={styles.sectionTitle}>Animation</Text>
                  <View style={styles.animationGrid}>
                    {animationActions.map((action) => (
                      <TouchableOpacity
                        key={action.id}
                        style={[
                          styles.animationGridButton,
                          selectedChar.animation === action.id && styles.activeAnimationGridButton
                        ]}
                        onPress={() => setCharacterAnimation(action.id as any)}
                      >
                        <Text style={styles.animationGridIcon}>{action.icon}</Text>
                        <Text style={[
                          styles.animationGridLabel,
                          selectedChar.animation === action.id && styles.activeAnimationGridLabel
                        ]}>
                          {action.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.propertySection}>
                  <Text style={styles.sectionTitle}>Controls</Text>
                  <View style={styles.controlGrid}>
                    <TouchableOpacity style={styles.controlGridButton} onPress={rotateCharacter}>
                      <Icon name="rotate-right" size={20} color="#FFFFFF" />
                      <Text style={styles.controlGridText}>Rotate</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlGridButton} onPress={() => scaleCharacter(true)}>
                      <Icon name="add" size={20} color="#FFFFFF" />
                      <Text style={styles.controlGridText}>Scale +</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlGridButton} onPress={() => scaleCharacter(false)}>
                      <Icon name="remove" size={20} color="#FFFFFF" />
                      <Text style={styles.controlGridText}>Scale -</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.controlGridButton, styles.deleteGridButton]} 
                      onPress={deleteCharacter}
                    >
                      <Icon name="delete" size={20} color="#FFFFFF" />
                      <Text style={styles.controlGridText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Character Selection Modal */}
      <Modal
        visible={showCharacterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCharacterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Character</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCharacterModal(false)}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={availableCharacters}
              renderItem={renderCharacterItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
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
    padding: 16,
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
  },
  addCharacterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactKeyframeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  compactKeyframeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  compactKeyframeButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  compactButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteKeyframeButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  canvas: {
    flex: 1,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canvasBackground: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F0F9FF',
  },
  character: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  characterImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  animationIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationText: {
    fontSize: 10,
  },
  characterName: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
    width: 80,
  },
  compactControlPanel: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  propertiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  quickButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  noSelectionText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#EF4444',
  },
  compactAudioContainer: {
    height: 180,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertiesModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  propertiesContent: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  propertySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  propertyText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  animationGridButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeAnimationGridButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  animationGridIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  animationGridLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeAnimationGridLabel: {
    color: '#FFFFFF',
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlGridButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    gap: 4,
  },
  deleteGridButton: {
    backgroundColor: '#EF4444',
  },
  controlGridText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    paddingBottom: 20,
  },
  characterModalItem: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  characterModalImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  characterModalName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
});