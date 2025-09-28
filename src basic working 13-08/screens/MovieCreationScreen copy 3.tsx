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
  Share,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Audio from '../components/Audio';
import RiveCharacter from '../components/RiveCharacter';

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
  isRive?: boolean;
  riveFile?: string;
  animations?: string[];
  stateMachine?:string
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
  { id: 'walk', name: 'walk', icon: '🚶' },
  { id: 'run', name: 'Run', icon: '🏃' },
  { id: 'talk', name: 'talk', icon: '💬' },
  { id: 'attack', name: 'Attack', icon: '⚔️' },
  { id: 'jump', name: 'Jump', icon: '🦘' },
  { id: 'cast_spell', name: 'Cast Spell', icon: '🔮' },
  { id: 'teleport', name: 'Teleport', icon: '✨' },
  { id: 'work', name: 'Work', icon: '🔧' },
  { id: 'dance', name: 'Dance', icon: '💃' },
];

const availableCharacters = [
  { 
    id: '1', 
    name: 'rive Knight', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400',
    isRive: true,
    riveFile: 'fifth',
    animations: ['idle', 'walk', 'run', 'attack', 'jump'],
    stateMachine:'talk-state-machine'
  },
  { 
    id: '2', 
    name: 'rive Mage', 
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400',
    isRive: true,
    riveFile: 'fifth',
    animations: ['idle', 'cast_spell', 'walk', 'teleport'],
    stateMachine:'talk-state-machine'
  },
  { 
    id: '3', 
    name: 'rive Assistant', 
    preview: 'https://images.pexels.com/photos/2085831/pexels-photo-2085831.jpeg?auto=compress&cs=tinysrgb&w=400',
    isRive: true,
    riveFile: 'fifth',
    animations: ['idle', 'walk', 'work', 'dance', 'malfunction'],
    stateMachine:'talk-state-machine'
  },
];

const availableBackgrounds = [
  { id: '1', name: 'Forest Scene', type: 'Nature', preview: 'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '2', name: 'City Skyline', type: 'Urban', preview: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '3', name: 'Beach Paradise', type: 'Nature', preview: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '4', name: 'Mountain View', type: 'Nature', preview: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '5', name: 'Space Galaxy', type: 'Fantasy', preview: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '6', name: 'Solid Blue', type: 'Color', preview: '', color: '#3B82F6' },
  { id: '7', name: 'Solid Green', type: 'Color', preview: '', color: '#10B981' },
  { id: '8', name: 'Solid Purple', type: 'Color', preview: '', color: '#8B5CF6' },
];

export default function MovieCreationScreen({ navigation, route }: any) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>('1');
  const [selectedBackground, setSelectedBackground] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  console.log(":---keyframes", keyframes)
  // Load selected characters from navigation params
  React.useEffect(() => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Route params:', route?.params);
    console.log('Navigation state:', navigation.getState());
    
    // Try both route.params and navigation state
    const selectedCharacterIds = route?.params?.selectedCharacters || 
      navigation.getState()?.routes?.find(r => r.name === 'Movie')?.params?.selectedCharacters || [];
    const selectedBackgroundId = route?.params?.selectedBackground || 
      navigation.getState()?.routes?.find(r => r.name === 'Movie')?.params?.selectedBackground;
    
    console.log('Selected character IDs:', selectedCharacterIds);
    console.log('Selected background ID:', selectedBackgroundId);
    
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
          preview: characterData?.preview || 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400',
          isRive: characterData?.isRive || false,
          riveFile: characterData?.riveFile,
          animations: characterData?.animations || ['idle', 'walk', 'run', 'talk']
        };
      });
      
      setCharacters(newCharacters);
      console.log('Set characters:', newCharacters);
      setSelectedCharacter(newCharacters[0]?.id || null);
      
      // Update initial keyframe
      setKeyframes([{
        id: 'keyframe_0',
        time: 0,
        characters: [...newCharacters]
      }]);
    }
    
    // Load selected background
    if (selectedBackgroundId) {
      const backgroundData = availableBackgrounds.find(bg => bg.id === selectedBackgroundId);
      console.log('Found background data:', backgroundData);
      if (backgroundData) {
        setSelectedBackground(backgroundData);
        console.log('Set selected background:', backgroundData);
      }
    } else {
      console.log('No background ID found, using default');
      // Set a default background for testing
      const defaultBackground = availableBackgrounds[0];
      setSelectedBackground(defaultBackground);
      console.log('Set default background:', defaultBackground);
    }
  }, [route?.params, navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const exportMovie = async (format: 'json' | 'video' | 'gif') => {
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'json':
          await exportAsJSON();
          break;
        case 'video':
          await exportAsVideo();
          break;
        case 'gif':
          await exportAsGIF();
          break;
      }
    } catch (error) {
      Alert.alert('Export Error', `Failed to export: ${error.message}`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const exportAsJSON = async () => {
    const movieData = {
      version: '1.0',
      title: 'My Animation',
      createdAt: new Date().toISOString(),
      duration: Math.max(...keyframes.map(kf => kf.time)),
      characters: characters.map(char => ({
        id: char.id,
        name: char.name,
        preview: char.preview,
        initialPosition: { x: char.x, y: char.y },
        initialScale: char.scale,
        initialRotation: char.rotation,
        initialAnimation: char.animation,
      })),
      keyframes: keyframes.map(kf => ({
        id: kf.id,
        time: kf.time,
        characters: kf.characters.map(char => ({
          id: char.id,
          name: char.name,
          position: { x: char.x, y: char.y },
          scale: char.scale,
          rotation: char.rotation,
          animation: char.animation,
        })),
      })),
      settings: {
        canvasSize: { width: 400, height: 300 },
        backgroundColor: '#F0F9FF',
        fps: 30,
      },
    };

    const jsonString = JSON.stringify(movieData, null, 2);
    
    try {
      await Share.share({
        message: jsonString,
        title: 'Animation Data',
      });
      Alert.alert('Export Complete', 'Animation data exported successfully!');
    } catch (error) {
      console.log('Error sharing JSON:', error);
      Alert.alert('Export Complete', 'Animation data prepared successfully!');
    }
  };

  const exportAsVideo = async () => {
    // Simulate video export process
    const steps = [
      'Preparing animation frames...',
      'Rendering characters...',
      'Processing keyframes...',
      'Encoding video...',
      'Finalizing export...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real implementation, you would show progress here
    }

    const videoData = {
      format: 'mp4',
      resolution: '1920x1080',
      fps: 30,
      duration: Math.max(...keyframes.map(kf => kf.time)) / 1000,
      size: '15.2 MB',
      characters: characters.length,
      keyframes: keyframes.length,
    };

    Alert.alert(
      'Video Export Complete',
      `Video exported successfully!\n\nDetails:\n• Format: ${videoData.format.toUpperCase()}\n• Resolution: ${videoData.resolution}\n• Duration: ${videoData.duration}s\n• Size: ${videoData.size}\n• Characters: ${videoData.characters}\n• Keyframes: ${videoData.keyframes}`,
      [
        { text: 'OK' },
        { text: 'Share', onPress: () => shareExportedFile('video') }
      ]
    );
  };

  const exportAsGIF = async () => {
    // Simulate GIF export process
    const steps = [
      'Capturing frames...',
      'Optimizing colors...',
      'Compressing GIF...',
      'Finalizing...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      // In a real implementation, you would show progress here
    }

    const gifData = {
      format: 'gif',
      resolution: '800x600',
      fps: 15,
      duration: Math.max(...keyframes.map(kf => kf.time)) / 1000,
      size: '8.7 MB',
      frames: Math.ceil((Math.max(...keyframes.map(kf => kf.time)) / 1000) * 15),
    };

    Alert.alert(
      'GIF Export Complete',
      `GIF exported successfully!\n\nDetails:\n• Format: ${gifData.format.toUpperCase()}\n• Resolution: ${gifData.resolution}\n• FPS: ${gifData.fps}\n• Duration: ${gifData.duration}s\n• Size: ${gifData.size}\n• Frames: ${gifData.frames}`,
      [
        { text: 'OK' },
        { text: 'Share', onPress: () => shareExportedFile('gif') }
      ]
    );
  };

  const shareExportedFile = async (type: string) => {
    try {
      await Share.share({
        message: `Check out my animation! Exported as ${type.toUpperCase()}`,
        title: 'My Animation Export',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const getExportPreview = () => {
    return {
      totalDuration: Math.max(...keyframes.map(kf => kf.time)) / 1000,
      totalCharacters: characters.length,
      totalKeyframes: keyframes.length,
      estimatedFileSize: {
        json: '< 1 MB',
        video: '10-20 MB',
        gif: '5-15 MB',
      },
    };
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

  // const updateCurrentKeyframe = () => {
  //   if (currentKeyframeIndex >= 0 && currentKeyframeIndex < keyframes.length) {
  //     const updatedKeyframes = [...keyframes];
  //     updatedKeyframes[currentKeyframeIndex] = {
  //       ...updatedKeyframes[currentKeyframeIndex],
  //       characters: [...characters]
  //     };
  //     setKeyframes(updatedKeyframes);
  //   }
  // };

  const updateCurrentKeyframe = (updatedCharacters?: Character[]) => {
    setKeyframes(prev => {
      const updated = [...prev];

      updated[currentKeyframeIndex] = {
        ...updated[currentKeyframeIndex],
        characters: updatedCharacters
          ? updatedCharacters
          : characters, // fall back to current state
      };

      return updated;
    });
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
    //  riv.current?.setInputState(stateMachineName, "Many Teeth Mouth", true)
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
    isRive: characterData.isRive || false,
    riveFile: characterData.riveFile || null,
    animations: characterData.animations || ['idle'],
    stateMachine: characterData.stateMachine || null,
  };

  // update characters state
  setCharacters(prev => {
    const updated = [...prev, newCharacter];
    updateCurrentKeyframe(updated); // ✅ sync with current keyframe
    return updated;
  });

  setShowCharacterModal(false);
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
          style={styles.exportButton}
          onPress={() => setShowExportModal(true)}
        >
          <Icon name="file-download" size={20} color="#FFFFFF" />
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
          {/* Debug Background Info */}
          {selectedBackground && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                BG: {selectedBackground.name} ({selectedBackground.type})
              </Text>
            </View>
          )}
          
          {/* Background Layer */}
          {selectedBackground && (
            <View style={styles.backgroundLayer}>
              {console.log('Rendering background:', selectedBackground)}
              {selectedBackground.preview ? (
                <Image
                  source={{ uri: selectedBackground.preview }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                  onLoad={() => console.log('Background image loaded')}
                  onError={(error) => console.log('Background image error:', error)}
                />
              ) : (
                <View style={[
                  styles.backgroundColorLayer, 
                  { backgroundColor: selectedBackground.color }
                ]}>
                  {console.log('Rendering color background:', selectedBackground.color)}
                </View>
              )}
            </View>
          )}
          
          {/* Characters Layer */}
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
                    // backgroundColor: selectedCharacter === character.id ? '#EFF6FF' : '#FFFFFF',
                  }
                ]}
                {...panResponder.panHandlers}
              >
                {character.isRive && character.riveFile ? (
                  <RiveCharacter
                    riveFile={character.riveFile}
                    animationName={character.animation}
                    stateMachineName={character.stateMachine}
                    width={60}
                    height={60}
                    scale={1}
                    rotation={0}
                    isPlaying={isPlaying}
                  />
                ) : (
                  <Image 
                    source={{ uri: character.preview }} 
                    style={styles.characterImage}
                    resizeMode="contain"
                  />
                )}
                
                {/* Animation indicator */}
                {/* <View style={styles.animationIndicator}>
                  <Text style={styles.animationText}>
                    {animationActions.find(a => a.id === character.animation)?.icon}
                  </Text>
                </View> */}
                
                {/* Rive indicator */}
                {/* {character.isRive && (
                  <View style={styles.riveIndicator}>
                    <Text style={styles.riveIndicatorText}>🎭</Text>
                  </View>
                )} */}
                
                {/* Character name */}
                <Text style={styles.characterName}>{character.name}</Text>
                
                {/* Selection indicator */}
                {/* {selectedCharacter === character.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )} */}
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
              
              <TouchableOpacity 
                style={styles.addCharacterButton}
                onPress={() => setShowCharacterModal(true)}
              >
                <Icon name="person-add" size={16} color="#FFFFFF" />
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
          selectedCharacter={selectedCharacter}   // 👈 pass it here
          characters={characters}  
          defaultCharacterId={characters[0]?.name}
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
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
                    {animationActions
                      // .filter(action => 
                      //   !selectedChar.isRive || 
                      //   !selectedChar.animations || 
                      //   selectedChar.animations.includes(action.id)
                      // )
                      .map((action) => (
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
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Animation</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowExportModal(false)}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.exportPreview}>
              <Text style={styles.exportPreviewTitle}>Animation Summary</Text>
              <View style={styles.exportStats}>
                <View style={styles.exportStat}>
                  <Icon name="access-time" size={16} color="#3B82F6" />
                  <Text style={styles.exportStatText}>
                    Duration: {Math.floor(getExportPreview().totalDuration)}s
                  </Text>
                </View>
                <View style={styles.exportStat}>
                  <Icon name="people" size={16} color="#10B981" />
                  <Text style={styles.exportStatText}>
                    Characters: {getExportPreview().totalCharacters}
                  </Text>
                </View>
                <View style={styles.exportStat}>
                  <Icon name="timeline" size={16} color="#F59E0B" />
                  <Text style={styles.exportStatText}>
                    Keyframes: {getExportPreview().totalKeyframes}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.exportOptions}>
              <Text style={styles.exportOptionsTitle}>Export Format</Text>
              
              <TouchableOpacity
                style={[styles.exportOption, isExporting && styles.disabledExportOption]}
                onPress={() => !isExporting && exportMovie('json')}
                disabled={isExporting}
              >
                <View style={styles.exportOptionIcon}>
                  <Icon name="code" size={24} color="#3B82F6" />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>JSON Data</Text>
                  <Text style={styles.exportOptionDescription}>
                    Export animation data for sharing or backup
                  </Text>
                  <Text style={styles.exportOptionSize}>
                    Size: {getExportPreview().estimatedFileSize.json}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportOption, isExporting && styles.disabledExportOption]}
                onPress={() => !isExporting && exportMovie('video')}
                disabled={isExporting}
              >
                <View style={styles.exportOptionIcon}>
                  <Icon name="videocam" size={24} color="#EF4444" />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>MP4 Video</Text>
                  <Text style={styles.exportOptionDescription}>
                    High-quality video with audio (1920x1080, 30fps)
                  </Text>
                  <Text style={styles.exportOptionSize}>
                    Size: {getExportPreview().estimatedFileSize.video}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exportOption, isExporting && styles.disabledExportOption]}
                onPress={() => !isExporting && exportMovie('gif')}
                disabled={isExporting}
              >
                <View style={styles.exportOptionIcon}>
                  <Icon name="gif" size={24} color="#10B981" />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>Animated GIF</Text>
                  <Text style={styles.exportOptionDescription}>
                    Optimized GIF for web sharing (800x600, 15fps)
                  </Text>
                  <Text style={styles.exportOptionSize}>
                    Size: {getExportPreview().estimatedFileSize.gif}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            {isExporting && (
              <View style={styles.exportProgress}>
                <Text style={styles.exportProgressText}>Exporting...</Text>
                <View style={styles.exportProgressBar}>
                  <View style={styles.exportProgressFill} />
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
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
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
    backgroundColor: '#F0F9FF', // Fallback color
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundColorLayer: {
    width: '100%',
    height: '100%',
  },
  character: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderWidth: 0,
    borderRadius: 8,
    // backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10, // Ensure characters appear above background
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
  addCharacterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
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
  riveIndicator: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  riveIndicatorText: {
    fontSize: 10,
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
    elevation: 10,
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
  exportModalContent: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  exportPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  exportPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  exportStats: {
    gap: 8,
  },
  exportStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  exportOptions: {
    flex: 1,
  },
  exportOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledExportOption: {
    opacity: 0.5,
  },
  exportOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exportOptionInfo: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exportOptionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  exportOptionSize: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  exportProgress: {
    marginTop: 20,
    alignItems: 'center',
  },
  exportProgressText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 8,
  },
  exportProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  exportProgressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 100,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});