import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import Rive from 'rive-react-native';




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
  stateMachine?:string;
  animationPreviews?: { animationName: string; filename: string; mimeType?: string }[];
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
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<any>(null);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeMicCharacterId, setActiveMicCharacterId] = useState('Hero Knight');
  const [micStates, setMicStates] = useState<{ [id: string]: boolean }>({});
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [unassignTrigger, setUnassignTrigger] = useState<{ characterId: string } | null>(null);
  const [assignChunkToCharacter, setAssignChunkToCharacter] = useState<{ chunkId: string, characterId: string | null, ts: number } | null>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    {
      id: 'keyframe_0',
      time: 0,
      characters: []
    }
  ]);
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);

  const fetchCharacters = async () => {
      // setLoading(true);
      // setError(null);
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
            animationPreviews: char.animations?.map((a: any) => ({
              animationName: a.name,
              filename: a.previewImage?.filename,
              mimeType: a.previewImage?.mimeType,
            })) || [],
          };
        });
  
        setAllCharacters(transformedCharacters);
      } catch (error) {
        console.error('Failed to load characters from API:', error);
        // setError('Failed to load characters from server');
      } finally {
        // setLoading(false);
      }
    };
  
    console.log("*(*(*(*(*", characters)
  
    useEffect(() => {
      fetchCharacters();
    }, []);
  // Load selected data from navigation params - UPDATED
  React.useEffect(() => {
    console.log('=== MOVIE CREATION PARAMS ===');
    console.log('Route params:', route?.params);
    
    const selectedCharacterData = route?.params?.selectedCharacters || [];
    const selectedBackgroundData = route?.params?.selectedBackground;
    const selectedAudioData = route?.params?.selectedAudio;
    
    console.log('Selected characters data:', selectedCharacterData);
    console.log('Selected background:', selectedBackgroundData);
    console.log('Selected audio:', selectedAudioData);
    
    // Load characters from the actual character data (not just IDs)
    if (selectedCharacterData.length > 0) {
      const newCharacters = selectedCharacterData.map((characterData: any, index: number) => ({
        id: characterData.id || characterData._id,
        name: characterData.name,
        x: 50 + (index * 80),
        y: 100 + (index * 60),
        scale: 1,
        rotation: 0,
        animation: 'idle' as const,
        preview: characterData.preview,
        isRive: characterData.isRive || false,
        riveFile: characterData.riveFile || null,
        animations: characterData.animations || ['idle', 'walk', 'run', 'talk'],
        stateMachine: characterData.stateMachine || null,
      }));
      
      setCharacters(newCharacters);
      setSelectedCharacter(newCharacters[0]?.id || null);
      
      // Update initial keyframe
      setKeyframes([{
        id: 'keyframe_0',
        time: 0,
        characters: [...newCharacters]
      }]);
    }
    
    // Load selected background
    if (selectedBackgroundData) {
      console.log('Loading background:', selectedBackgroundData);
      setSelectedBackground(selectedBackgroundData);
    } else {
      // Set a default background if none selected
      const defaultBackground = availableBackgrounds[0];
      setSelectedBackground(defaultBackground);
    }
    
    // Store selected audio data
    if (selectedAudioData) {
      console.log('Audio data available:', selectedAudioData);
      setSelectedAudio(selectedAudioData);
    }
    
  }, [route?.params]);

  useEffect(() => {
  if (characters.length === 0) return;

  setMicStates((prev) => {
    // agar pehle se mic states set hain toh wahi rakho
    if (Object.keys(prev).length > 0) return prev;

    const initialMicStates: { [id: string]: boolean } = {};
    characters.forEach((char, index) => {
      initialMicStates[char.id] = index === 0; // by default sirf first character ON
    });
    return initialMicStates;
  });
}, [characters]);


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

  // Update handleChunkActive to set animation to "talk" for the assigned character during playback
  


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

  const handleChunkActive = useCallback((characterId: any) => {
    setActiveMicCharacterId(characterId);

    setCharacters((prevCharacters: any) => {
      // If playback is active, set "talk" animation for the assigned character, "walk" for others
      if (isPlaying && characterId) {
        const updated = prevCharacters.map((char: any) => ({
          ...char,
          animation: char.id === characterId ? "talk" : "walk",
        }));
        updateCurrentKeyframe(updated);
        return updated;
      }
      // If not playing, keep current animations
      return prevCharacters;
    });
  }, [updateCurrentKeyframe, isPlaying]);

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

  const onTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  },[]);

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
    id: characterData.id,
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



const setUnassignChunksFromCharacter = (characterId: string) => {
  setUnassignTrigger({ characterId, ts: Date.now() }); // Add timestamp to always trigger
};


// Add this helper to fetch full character data by id
const fetchCharacterById = async (id: string) => {
  try {
    const response = await fetch(`http://10.0.2.2:5000/api/characters/full/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};

// Add this state to store the full character data
const [fullCharacter, setFullCharacter] = useState<any>(null);

useEffect(() => {
  if (showPropertiesModal && selectedChar?.id) {
    fetchCharacterById(selectedChar.id).then(data => {
      console.log('Fetched full character data:********', data);
      setFullCharacter(data);
    });
  }
}, [showPropertiesModal, selectedChar?.id]);

// Add this function before your return statement
const handleSelectedChunkCharacterId = useCallback((characterId: string | null) => {
  setMicStates((prev) => {
    let changed = false;
    const updated: { [id: string]: boolean } = {};
    for (const char of characters) {
      const shouldBeActive = char.id === characterId;
      updated[char.id] = shouldBeActive;
      if (prev[char.id] !== shouldBeActive) changed = true;
    }
    return changed ? updated : prev;
  });
  setActiveMicCharacterId(characterId || null);
}, [characters]);

// Add this function before your return statement
const handleCharacterModalSelect = (characterId: string) => {
  const isSelected = !!characters.find(c => c.id === characterId);
  if (isSelected) {
    // Unselect: remove from characters
    const updated = characters.filter(c => c.id !== characterId);
    setCharacters(updated);
    updateCurrentKeyframe(updated);
    if (selectedCharacter === characterId) setSelectedCharacter(null);
  } else {
    // Add: find character data from characters and add
    const charData = allCharacters.find(c => c.id === characterId);
    if (charData) {
      const newChar: Character = {
        id: charData.id,
        name: charData.name,
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 100,
        scale: 1,
        rotation: 0,
        animation: 'idle',
        preview: charData.preview,
        isRive: charData.isRive || false,
        riveFile: charData.riveFile || null,
        animations: charData.animations || ['idle'],
        stateMachine: charData.stateMachine || null,
      };
      const updated = [...characters, newChar];
      setCharacters(updated);
      updateCurrentKeyframe(updated);
      setSelectedCharacter(newChar.id);
    }
  }
};

  const renderCharacterItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.characterModalItem}
      onPress={() => addNewCharacter(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.preview }} style={styles.characterModalImage} />
      <Text style={styles.characterModalName}>{item.name}</Text>
      <Text style={styles.characterModalType}>
        {item.isRive ? '🎭 Rive' : '🖼️ Static'} • {item.category}
      </Text>
      {item.description && (
        <Text style={styles.characterModalDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Fix: Always check selectedChar before accessing its properties
  console.log("selectedChar&*&*&*&*&*",  fullCharacter)
  const selectedChar = characters?.find(char => char.id === selectedCharacter);

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
              {selectedBackground.preview ? (
                <Image
                  source={{ uri: selectedBackground.preview }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                  onLoad={() => {}}
                  onError={(error) => {}}
                />
              ) : (
                <View style={[
                  styles.backgroundColorLayer, 
                  { backgroundColor: selectedBackground.color }
                ]}>
                </View>
              )}
            </View>
          )}
          
          {console.log("************characters", characters, characters[0]?.riveFile)}
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
                    width: 100,
                    height: 200,
                    transform: [
                      { scale: character.scale },
                      { rotate: `${character.rotation}deg` }
                    ],
                    borderWidth: selectedCharacter === character.id ? 2 : 0,
                    borderColor: selectedCharacter === character.id ? "#3B82F6" : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <View style={{ position: 'absolute', top: -30, left: '50%', transform: [{ translateX: -12 }], flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setMicStates(prev => {
                        const updated: { [id: string]: boolean } = {};
                        Object.keys(prev).forEach(id => {
                          updated[id] = false;
                        });
                        updated[character.id] = !prev[character.id];
                        setActiveMicCharacterId(updated[character.id] ? character.id : null);

                        // If mic is turned ON, assign this chunk to this character
                        if (updated[character.id] && selectedChunkId) {
                          setAssignChunkToCharacter({
                            chunkId: selectedChunkId,
                            characterId: character.id,
                            ts: Date.now(),
                          });
                        }
                        // If mic is turned OFF, unassign all chunks from this character
                        if (!updated[character.id]) {
                          if (typeof setUnassignChunksFromCharacter === 'function') {
                            setUnassignChunksFromCharacter(character.id);
                          }
                        }
                        return updated;
                      });
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: micStates[character.id] ? 'green' : 'gray',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>🎤</Text>
                  </TouchableOpacity>
                  <Text style={{
                    marginLeft: 6,
                    fontSize: 12,
                    color: micStates[character.id] ? 'green' : 'gray',
                    fontWeight: 'bold'
                  }}>
                    {micStates[character.id] ? 'On' : 'Off'}
                  </Text>
                </View>

                {character.isRive && character.riveFile ? (
//                   <Rive
//   url="http://10.0.2.2:5000/uploads/characters/dcbedafaf48d4670b69c35275d77b704"
//   stateMachineName="talk-state-machine"
//   style={{ width: 400, height: 100 }}
// />
                  <RiveCharacter
                    // riveFile={character.riveFile}
                    url={`http://10.0.2.2:5000/uploads/characters/${character.riveFile}`}
                    animationName={character.animation}
                    stateMachineName={character.stateMachine || undefined}
                    width={60}
                    height={60}
                    scale={1}
                    rotation={0}
                    isPlaying={isPlaying}
                    pointerEvents="none" 
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
          {/* Always show Add Character button */}
          <TouchableOpacity 
            style={styles.addCharacterButton}
            onPress={() => setShowCharacterModal(true)}
          >
            <Icon name="person-add" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {selectedChar ? (
            <>
              <TouchableOpacity 
                style={styles.propertiesButton}
                onPress={() => {
                  if (!selectedChar) {
                    Alert.alert("No character selected", "Please add/select a character first.");
                  } else {
                    setShowPropertiesModal(true);
                  }
                }}
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

          {/* <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.pauseButton]}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Icon name={isPlaying ? "pause" : "play-arrow"} size={20} color="#FFFFFF" />
          </TouchableOpacity> */}
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
          selectedCharacter={selectedCharacter}
          characters={characters}  
          defaultCharacterId={characters[0]?.name}
          selectedAudio={selectedAudio} // Pass selected audio data
          onMicAssign={(characterId:any) => {
            setActiveMicCharacterId(characterId);
          }}
          onChunkSelect={setSelectedChunkId}
          onChunkActive={handleChunkActive}
          onSelectedChunkCharacterId={handleSelectedChunkCharacterId}
          unassignTrigger={unassignTrigger}
          assignChunkToCharacter={assignChunkToCharacter}
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
          <View style={styles.propertiesModalContentFixed}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Character Properties</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPropertiesModal(false)}
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {selectedChar ? (
              <ScrollView contentContainerStyle={styles.propertiesScrollContent}>
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
                      {fullCharacter?.animations?.map((anim, idx) => {
                        const isActive = selectedChar.animation === anim.name;
                        const actionObj = animationActions.find(a => a.id === anim.name);
                        return (
                          <TouchableOpacity
                            key={anim.name || idx}
                            style={[
                              styles.animationGridButton,
                              isActive && styles.activeAnimationGridButton
                            ]}
                            onPress={() => {
                              setCharacterAnimation(anim.name);
                              // Optionally, you can trigger playback or state machine change here if needed
                            }}
                          >
                            {anim.previewImage?.filename ? (
                              <Image
                                source={{
                                  uri: `http://10.0.2.2:5000/uploads/characters/${anim.previewImage.filename}`
                                }}
                                style={{ width: 60, height: 60, borderRadius: 8, marginTop: 6 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                                No preview image
                              </Text>
                            )}
                            <Text style={[
                              styles.animationGridLabel,
                              isActive && styles.activeAnimationGridLabel
                            ]}>
                              {actionObj?.name || anim.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
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
        
                  {/* <View style={styles.propertySection}>
                    <Text style={styles.sectionTitle}>Animations</Text>
                    {fullCharacter?.animations?.map((anim: any, idx: number) => (
                      <View key={anim.name} style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{anim.name}</Text>
                        {anim.previewImage?.filename ? (
                          <Image
                            source={{
                              uri: `http://10.0.2.2:5000/uploads/characters/${anim.previewImage.filename}`
                            }}
                            style={{ width: 80, height: 80, borderRadius: 8, marginTop: 6 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                            No preview image
                          </Text>
                        )}
                      </View>
                    ))}
                  </View> */}
                </View>
              </ScrollView>
            ) : (
              <View style={{ padding: 24 }}>
                <Text style={{ color: '#EF4444', fontSize: 16 }}>
                  No character selected.
                </Text>
              </View>
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
              <Text style={styles.modalTitle}>Add / Remove Characters</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCharacterModal(false)}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allCharacters} // Show all characters from API
              renderItem={({ item }) => {
                // Tick if character is already selected (exists in characters state)
                const isSelected = !!characters.find(c => c.id === item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.characterModalItem,
                      isSelected && styles.selectedCharacterItem
                    ]}
                    onPress={() => handleCharacterModalSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.preview }} style={styles.characterModalImage} />
                    <Text style={styles.characterModalName}>{item.name}</Text>
                    <Text style={styles.characterModalType}>
                      {item.isRive ? '🎭 Rive' : '🖼️ Static'} • {item.category}
                    </Text>
                    {item.description && (
                      <Text style={styles.characterModalDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    {isSelected && (
                      <View style={styles.selectedOverlay}>
                        <Icon name="check" size={20} color="#3B82F6" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.modalList}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Tap to select/unselect characters. Selected characters will appear in your movie.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactKeyframeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  compactKeyframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  compactKeyframeButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  compactButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteKeyframeButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.5,
  },
  canvas: {
    flex: 1,
    margin: 18,
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  canvasBackground: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
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
    borderRadius: 18,
  },
  backgroundColorLayer: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  character: {
    position: 'absolute',
    width: 120,
    height: 180,
    borderWidth: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  characterImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 4,
  },
  characterName: {
    position: 'absolute',
    bottom: -22,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
    width: 90,
  },
  compactControlPanel: {
    backgroundColor: '#FFF',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  propertiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    height: 36,
    gap: 6,
  },
  quickButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCharacterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  noSelectionText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#EF4444',
  },
  compactAudioContainer: {
    height: 180,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertiesModalContentFixed: {
    width: '95%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 24,
    elevation: 12,
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },
  propertiesScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  propertiesModalContent: {
    width: '92%',
    maxHeight: '82%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    elevation: 10,
  },
  propertiesContent: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 18,
    textAlign: 'center',
  },
  propertySection: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  propertyText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 5,
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  animationGridButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeAnimationGridButton: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  animationGridIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  animationGridLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeAnimationGridLabel: {
    color: '#FFF',
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  controlGridButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    gap: 6,
  },
  deleteGridButton: {
    backgroundColor: '#EF4444',
  },
  controlGridText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContent: {
    width: '92%',
    maxHeight: '72%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    paddingBottom: 22,
  },
  characterModalItem: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  characterModalImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginBottom: 10,
  },
  characterModalName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
  characterModalType: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 4,
  },
  characterModalDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 12,
  },
  exportModalContent: {
    width: '97%',
    maxHeight: '87%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  exportPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 18,
    marginBottom: 22,
  },
  exportPreviewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 14,
  },
  exportStats: {
    gap: 10,
  },
  exportStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportStatText: {
    fontSize: 15,
    color: '#6B7280',
  },
  exportOptions: {
    flex: 1,
  },
  exportOptionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 18,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledExportOption: {
    opacity: 0.5,
  },
  exportOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  exportOptionInfo: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  exportOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  exportOptionSize: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  exportProgress: {
    marginTop: 22,
    alignItems: 'center',
  },
  exportProgressText: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 10,
  },
  exportProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  exportProgressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  debugInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 6,
    zIndex: 100,
  },
  debugText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 50,
  },
  barWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    marginHorizontal: 2,
  },
  bar: {
    width: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  goBackToSelectionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackToSelectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});