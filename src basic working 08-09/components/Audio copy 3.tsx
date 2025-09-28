
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  PanResponder,
  Modal,
  Image,
} from 'react-native';
import Sound from 'react-native-sound';

const { width: screenWidth } = Dimensions.get('window');
const TIMELINE_WIDTH = screenWidth * 4; // Increased for more scrollable area
const CENTER_LINE_POSITION = screenWidth / 2;
const MIN_CHUNK_DURATION = 2000;
const PIXELS_PER_SECOND = 50; // 50px = 1 second

interface Chunk {
  id: string;
  startTime: number;
  endTime: number;
  selected: boolean;
  color: string;
  user: string;
  characterId: string | null;
}

Sound.setCategory('Playback');

export default function AudioTimeline({ 
  onPlaybackEnd,
  addKeyframe, 
  goToKeyframe, 
  activeMicCharacterId, 
  onPlayChange, 
  onTimeUpdate, 
  keyframes = [], 
  currentKeyframeIndex = 0,
  defaultCharacterId,
  selectedCharacter,   // 👈 pass it here
  characters,
  onMicAssign
}: any) {
  const [sound, setSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [chunks, setChunks] = useState<Chunk[]>([
    {
      id: '1',
      startTime: 0,
      endTime: 60000,
      selected: false,
      color: '#3B82F6',
      user: 'User 1',
      characterId: defaultCharacterId
    },
  ]);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingChunkId, setResizingChunkId] = useState<string | null>(null);
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeChunkId, setMergeChunkId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [timelineScrollOffset, setTimelineScrollOffset] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const positionIntervalRef = useRef<any>(null);
  
  useEffect(()=>{
    setChunks((prev) =>
      prev.map((chunk) =>
        chunk.id === selectedChunkId
          ? { ...chunk, characterId: activeMicCharacterId } 
          : chunk
      )
    );
  },[activeMicCharacterId])


  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.release();
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(position);
    }
  }, [position, onTimeUpdate]);

  useEffect(() => {
    if (!duration || chunks.length === 0) return;

    if (!isPlaying) return;

    const activeIndex = chunks.findIndex(
      (c) => position >= c.startTime && position < c.endTime
    );

    if (activeIndex !== -1) {
      goToKeyframe(activeIndex);
    }
  }, [position, duration, chunks, isPlaying]);

  const pixelsPerSecond = 100; // 👈 100px = 1s, adjust as needed

  const waveformWidth = duration ? duration * pixelsPerSecond : 0;
// Calculate red line time BEFORE the effect
// const redLineTimeMs = duration
//   ? (scrollPosition / waveformWidth) * duration
//   : 0;





  const loadAudio = () => {
    const audioFile = new Sound('aa.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        return;
      }

      const audioDuration = audioFile.getDuration() * 1000;
      setDuration(audioDuration);
      setSound(audioFile);

      setChunks([{
        id: '1',
        startTime: 0,
        endTime: audioDuration,
        selected: false,
        color: '#3B82F6',
        user: 'User 1',
        characterId: defaultCharacterId
      }]);

      console.log(`Audio loaded, duration: ${audioDuration}ms`);
    });
  };

  const togglePlayback = () => {
    if (!sound) {
      if (isPlaying) {
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
        }
      } else {
        startPositionTracking();
      }
      setIsPlaying(!isPlaying);
      onPlayChange(!isPlaying);
      return;
    }

    if (isPlaying) {
      sound.pause();
      onPlaybackEnd();
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        onPlayChange(false);
      }
    } else {
      sound.play((success) => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        
        setIsPlaying(false);
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
        }
      });
      startPositionTracking();
      onPlayChange(true);
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    if (sound) {
      sound.stop();
      sound.setCurrentTime(0);
    }
    if (onPlaybackEnd) onPlaybackEnd();
    setIsPlaying(false);
    setPosition(0);
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }
  };

  const startPositionTracking = () => {
    positionIntervalRef.current = setInterval(() => {
      if (sound) {
        sound.getCurrentTime((seconds) => {
          setPosition(seconds * 1000);
        });
      } else {
        // Simulate playback for demo
        setPosition(prev => {
          const newPos = prev + 100;
          return newPos >= duration ? 0 : newPos;
        });
      }
    }, 100);
  };

  const playSelectedChunk = () => {
    if (!selectedChunkId) {
      Alert.alert('No Selection', 'Please select a chunk to play');
      return;
    }

    const chunk = chunks.find(c => c.id === selectedChunkId);
    if (!chunk) return;

    if (sound) {
      const startTimeSeconds = chunk.startTime / 1000;
      sound.setCurrentTime(startTimeSeconds);
      sound.play();
      setIsPlaying(true);
      
      setTimeout(() => {
        sound.pause();
        setIsPlaying(false);
      }, chunk.endTime - chunk.startTime);
      
      startPositionTracking();
    } else {
      setPosition(chunk.startTime);
      setIsPlaying(true);
      startPositionTracking();
      
      setTimeout(() => {
        setIsPlaying(false);
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
        }
      }, chunk.endTime - chunk.startTime);
    }
  };

  const splitAtCurrentPosition = () => {
    console.log('=== SPLIT DEBUG START ===');
    console.log('scrollPosition (pixels):', scrollPosition);
    console.log('PIXELS_PER_SECOND:', PIXELS_PER_SECOND);
    console.log('duration:', duration);
    console.log('chunks before split:', chunks);
    
    // Calculate red line time from scroll position
    // Red line is always at center of screen, so we need to add the scroll offset
    // to get the actual time position on the timeline
    const redLineTime = (scrollPosition / PIXELS_PER_SECOND) * 1000;
    const clampedTime = Math.max(0, Math.min(duration, redLineTime));
    
    console.log('redLineTime calculated (ms):', redLineTime);
    console.log('clampedTime (ms):', clampedTime);
    console.log('redLineTime (formatted):', formatTime(clampedTime));

    const targetChunk = chunks.find(chunk => 
      clampedTime >= chunk.startTime && clampedTime <= chunk.endTime
    );
    
    console.log('targetChunk found:', targetChunk);

    if (!targetChunk) {
      Alert.alert('Split Error', `No chunk found at time ${formatTime(clampedTime)}`);
      console.log('=== SPLIT DEBUG END (NO CHUNK) ===');
      return;
    }

    // Check if split position is too close to edges
    if (clampedTime <= targetChunk.startTime + MIN_CHUNK_DURATION || 
        clampedTime >= targetChunk.endTime - MIN_CHUNK_DURATION) {
      Alert.alert('Split Error', `Cannot split too close to chunk edges.\nSplit time: ${formatTime(clampedTime)}\nChunk: ${formatTime(targetChunk.startTime)} - ${formatTime(targetChunk.endTime)}`);
      console.log('=== SPLIT DEBUG END (TOO CLOSE) ===');
      return;
    }

    console.log('Splitting chunk:', targetChunk.id, 'at time:', clampedTime);

    // Create two new chunks from the split
    const leftChunk = {
      ...targetChunk,
      id: `${targetChunk.id}_left_${Date.now()}`,
      endTime: clampedTime,
    };
    
    const rightChunk = {
      ...targetChunk,
      id: `${targetChunk.id}_right_${Date.now()}`,
      startTime: clampedTime,
      color: getRandomColor(),
      user: `User ${chunks.length + 1}`,
      characterId: activeMicCharacterId,
    };
    
    console.log('leftChunk:', leftChunk);
    console.log('rightChunk:', rightChunk);
    
    // Remove original chunk and add two new chunks
    const newChunks = chunks.filter(chunk => chunk.id !== targetChunk.id);
    newChunks.push(leftChunk, rightChunk);
    const sortedChunks = newChunks.sort((a, b) => a.startTime - b.startTime);
    
    console.log('newChunks after split:', sortedChunks);

    setChunks(sortedChunks);
    addKeyframe();
    console.log('=== SPLIT DEBUG END (SUCCESS) ===');
  };

  const getRandomColor = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const selectChunk = (chunkId: string) => {
    const newSelectedId = selectedChunkId === chunkId ? null : chunkId;
    setSelectedChunkId(newSelectedId);
    onChunkSelect?.(newSelectedId); // Notify parent component
    
    setChunks(chunks.map(chunk => ({
      ...chunk,
      selected: chunk.id === chunkId && newSelectedId !== null,
    })));
    
    if (newSelectedId) {
      const index = chunks.findIndex(r => r.id === chunkId);
      goToKeyframe(index);
    }
  };

  const resetChunks = () => {
    setChunks([{
      id: '1',
      startTime: 0,
      endTime: duration,
      selected: false,
      color: '#3B82F6',
      user: 'User 1',
      characterId:activeMicCharacterId
    }]);
    setSelectedChunkId(null);
  };

  const createResizePanResponder = (chunkId: string, side: 'left' | 'right') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        setIsResizing(true);
        setResizingChunkId(chunkId);
        setResizingSide(side);
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaTime = (gestureState.dx / TIMELINE_WIDTH) * duration;
        resizeChunk(chunkId, side, deltaTime);
      },
      onPanResponderRelease: () => {
        setIsResizing(false);
        setResizingChunkId(null);
        setResizingSide(null);
      },
    });
  };

  const resizeChunk = (chunkId: string, side: 'left' | 'right', deltaTime: number) => {
    setChunks(prevChunks => {
      const chunkIndex = prevChunks.findIndex(c => c.id === chunkId);
      if (chunkIndex === -1) return prevChunks;

      const chunk = prevChunks[chunkIndex];
      const newChunks = [...prevChunks];

      if (side === 'left') {
        // Calculate new start time
        let newStartTime = Math.max(0, chunk.startTime + deltaTime);
        
        // Get previous chunk boundary
        const prevChunk = chunkIndex > 0 ? newChunks[chunkIndex - 1] : null;
        const minStartTime = prevChunk ? prevChunk.startTime : 0;
        const maxStartTime = chunk.endTime - MIN_CHUNK_DURATION;
        
        // Clamp the new start time
        newStartTime = Math.max(minStartTime, Math.min(maxStartTime, newStartTime));
        
        // Ensure minimum chunk duration
        if (chunk.endTime - newStartTime < MIN_CHUNK_DURATION) {
          return prevChunks;
        }
        
        // Update current chunk
        newChunks[chunkIndex] = { ...chunk, startTime: newStartTime };
        
        // Adjust previous chunk to fill the gap (no blank space)
        if (prevChunk) {
          newChunks[chunkIndex - 1] = { ...prevChunk, endTime: newStartTime };
          
          // Ensure previous chunk maintains minimum duration
          if (newChunks[chunkIndex - 1].endTime - newChunks[chunkIndex - 1].startTime < MIN_CHUNK_DURATION) {
            return prevChunks;
          }
        }
      } else {
        // Calculate new end time
        let newEndTime = Math.min(duration, chunk.endTime + deltaTime);
        
        // Get next chunk boundary
        const nextChunk = chunkIndex < newChunks.length - 1 ? newChunks[chunkIndex + 1] : null;
        const maxEndTime = nextChunk ? nextChunk.endTime : duration;
        const minEndTime = chunk.startTime + MIN_CHUNK_DURATION;
        
        // Clamp the new end time
        newEndTime = Math.min(maxEndTime, Math.max(minEndTime, newEndTime));
        
        // Ensure minimum chunk duration
        if (newEndTime - chunk.startTime < MIN_CHUNK_DURATION) {
          return prevChunks;
        }
        
        // Update current chunk
        newChunks[chunkIndex] = { ...chunk, endTime: newEndTime };
        
        // Adjust next chunk to fill the gap (no blank space)
        if (nextChunk) {
          newChunks[chunkIndex + 1] = { ...nextChunk, startTime: newEndTime };
          
          // Ensure next chunk maintains minimum duration
          if (newChunks[chunkIndex + 1].endTime - newChunks[chunkIndex + 1].startTime < MIN_CHUNK_DURATION) {
            return prevChunks;
          }
        }
      }

      return newChunks;
    });
  };

  const showMergeDialog = (chunkId: string) => {
    const chunkIndex = chunks.findIndex(c => c.id === chunkId);
    if (chunkIndex === -1) return;

    const hasLeftNeighbor = chunkIndex > 0;
    const hasRightNeighbor = chunkIndex < chunks.length - 1;

    if (!hasLeftNeighbor && !hasRightNeighbor) {
      Alert.alert('Cannot Merge', 'This chunk has no neighbors to merge with.');
      return;
    }

    setMergeChunkId(chunkId);
    setShowMergeModal(true);
  };

  const mergeChunks = (direction: 'left' | 'right') => {
    if (!mergeChunkId) return;

    const chunkIndex = chunks.findIndex(c => c.id === mergeChunkId);
    if (chunkIndex === -1) return;

    const chunk = chunks[chunkIndex];
    let targetChunk: Chunk | null = null;
    let targetIndex = -1;

    if (direction === 'left' && chunkIndex > 0) {
      targetChunk = chunks[chunkIndex - 1];
      targetIndex = chunkIndex - 1;
    } else if (direction === 'right' && chunkIndex < chunks.length - 1) {
      targetChunk = chunks[chunkIndex + 1];
      targetIndex = chunkIndex + 1;
    }

    if (!targetChunk) {
      Alert.alert('Cannot Merge', `No chunk available to merge ${direction}.`);
      setShowMergeModal(false);
      setMergeChunkId(null);
      return;
    }

    // Create merged chunk
    const mergedChunk: Chunk = {
      id: `merged_${Date.now()}`,
      startTime: Math.min(chunk.startTime, targetChunk.startTime),
      endTime: Math.max(chunk.endTime, targetChunk.endTime),
      selected: false,
      color: chunk.color, // Keep the original chunk's color
      user: chunk.user, // Keep the original chunk's user
      characterId: chunk.characterId || null
    };

    // Remove both chunks and add merged chunk
    const newChunks = chunks.filter((_, index) => index !== chunkIndex && index !== targetIndex);
    newChunks.push(mergedChunk);
    newChunks.sort((a, b) => a.startTime - b.startTime);

    setChunks(newChunks);
    setSelectedChunkId(mergedChunk.id);
    setShowMergeModal(false);
    setMergeChunkId(null);

    Alert.alert('Chunks Merged', `Successfully merged chunks ${direction}.`);
  };

  const createBetweenResizePanResponder = (leftChunkId: string, rightChunkId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        setIsResizing(true);
        setResizingChunkId(leftChunkId);
        setResizingSide('between');
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaTime = (gestureState.dx / TIMELINE_WIDTH) * duration;
        resizeBetweenChunks(leftChunkId, rightChunkId, deltaTime);
      },
      onPanResponderRelease: () => {
        setIsResizing(false);
        setResizingChunkId(null);
        setResizingSide(null);
      },
    });
  };

  const resizeBetweenChunks = (leftChunkId: string, rightChunkId: string, deltaTime: number) => {
    setChunks(prevChunks => {
      const leftIndex = prevChunks.findIndex(c => c.id === leftChunkId);
      const rightIndex = prevChunks.findIndex(c => c.id === rightChunkId);
      
      if (leftIndex === -1 || rightIndex === -1) return prevChunks;
      
      const leftChunk = prevChunks[leftIndex];
      const rightChunk = prevChunks[rightIndex];
      const newChunks = [...prevChunks];
      
      // Calculate new boundary position
      const currentBoundary = leftChunk.endTime;
      const newBoundary = currentBoundary + deltaTime;
      
      // Ensure minimum durations for both chunks
      const minLeftEnd = leftChunk.startTime + MIN_CHUNK_DURATION;
      const maxLeftEnd = rightChunk.endTime - MIN_CHUNK_DURATION;
      
      const clampedBoundary = Math.max(minLeftEnd, Math.min(maxLeftEnd, newBoundary));
      
      // Update both chunks
      newChunks[leftIndex] = { ...leftChunk, endTime: clampedBoundary };
      newChunks[rightIndex] = { ...rightChunk, startTime: clampedBoundary };
      
      return newChunks;
    });
  };

  const jumpToKeyframe = (keyframeIndex: number) => {
    if (keyframes && keyframes[keyframeIndex]) {
      const keyframe = keyframes[keyframeIndex];
      setPosition(keyframe.time);
      
      // Scroll timeline to keyframe position
      const targetScrollOffset = (keyframe.time / 1000) * PIXELS_PER_SECOND;
      scrollViewRef.current?.scrollTo({ x: targetScrollOffset, animated: true });
      setScrollOffset(targetScrollOffset);
      
      if (sound) {
        sound.setCurrentTime(keyframe.time / 1000);
      }
      goToKeyframe(keyframeIndex);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate red line time based on scroll position
  const redLineTime = (scrollPosition / PIXELS_PER_SECOND) * 1000;
  const redLineTimeMs = redLineTime;
  
  // Calculate visible time range
  const visibleStartTime = redLineTime - (duration * 0.5);
  const visibleEndTime = redLineTime + (duration * 0.5);

  // Auto-select chunk under red line
useEffect(() => {
  if (!duration || chunks.length === 0) return;

  const currentChunk = chunks.find(
    (c) => redLineTimeMs >= c.startTime && redLineTimeMs < c.endTime
  );

  if (currentChunk && currentChunk.id !== selectedChunkId) {
    setSelectedChunkId(currentChunk.id);
    setChunks((prev) =>
      prev.map((chunk) => ({
        ...chunk,
        selected: chunk.id === currentChunk.id,
      }))
    );

    // jump to keyframe for this chunk
    const index = chunks.findIndex((c) => c.id === currentChunk.id);
    if (index !== -1) {
      goToKeyframe(index);
    }
  }
}, [redLineTimeMs, chunks, duration]);
console.log("---chunks", chunks)

  const AudioChunk = ({ chunk }: { chunk: Chunk }) => {
    // Calculate absolute position on timeline
    const startPosition = (chunk.startTime / 1000) * PIXELS_PER_SECOND;
    const width = ((chunk.endTime - chunk.startTime) / 1000) * PIXELS_PER_SECOND;
    
    
    const leftResizer = createResizePanResponder(chunk.id, 'left');
    const rightResizer = createResizePanResponder(chunk.id, 'right');
    console.log("---chunk", chunk)
    console.log('-charactrers', characters)
    return (
      <View
        style={[
          styles.chunk,
          {
            left: startPosition,
            width: width,
            backgroundColor: chunk.color,
            borderColor: chunk.selected ? '#1F2937' : 'transparent',
          }
        ]}
      >
        {/* Left Resize Handle */}
        <View
          style={[styles.resizeHandle, styles.leftResizeHandle]}
          {...leftResizer.panHandlers}
        >
          <View style={styles.resizeIcon}>
            <Text style={styles.resizeIconText}>⟨</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chunkContent}
          onPress={() => selectChunk(chunk.id)}
          activeOpacity={0.8}
        >
          {chunk.characterId && (
            <View style={styles.chunkCharacterLabel}>
              <Image
                source={{ uri: characters?.find((c: any) => c.id === chunk.characterId)?.preview }}
                style={{ width: 20, height: 20, borderRadius: 10 }}
              />
            </View>
          )}
          <View style={styles.userLabel}>
            <Text style={styles.userText}>{chunk.characterId}</Text>
          </View>
          
          <View style={styles.chunkInfo}>
            <Text style={styles.chunkLabel} numberOfLines={1}>
              {chunk.id}
            </Text>
            <Text style={styles.chunkDuration} numberOfLines={1}>
              {formatTime(chunk.endTime - chunk.startTime)}
            </Text>
          </View>
          
          <View style={styles.waveform}>
            {Array.from({ length: Math.max(5, Math.min(50, Math.floor(Math.abs(width) / 8))) }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  { height: Math.random() * 20 + 5 }
                ]}
              />
            ))}
          </View>
        </TouchableOpacity>
        
        {/* Right Resize Handle */}
        <View
          style={[styles.resizeHandle, styles.rightResizeHandle]}
          {...rightResizer.panHandlers}
        >
          <View style={styles.resizeIcon}>
            <Text style={styles.resizeIconText}>⟩</Text>
          </View>
        </View>

        {chunk.selected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.selectionIndicator} />
          </View>
        )}
      </View>
    );
  };

  const BetweenChunkResizer = ({ leftChunk, rightChunk }: { leftChunk: Chunk, rightChunk: Chunk }) => {
    const position = (leftChunk.endTime / 1000) * PIXELS_PER_SECOND;
    
    const betweenResizer = createBetweenResizePanResponder(leftChunk.id, rightChunk.id);
    
    return (
      <View
        style={[
          styles.betweenResizeHandle,
          { left: position - 8 }
        ]}
        {...betweenResizer.panHandlers}
      >
        <View style={styles.betweenResizeIcon}>
          <Text style={styles.betweenResizeIconText}>⟷</Text>
        </View>
      </View>
    );
  };

  const KeyframeMarker = ({ keyframe, index }: { keyframe: any, index: number }) => {
    const position = (keyframe.time / 1000) * PIXELS_PER_SECOND;
    const isActive = index === currentKeyframeIndex;
    
    return (
      <TouchableOpacity
        style={[
          styles.keyframeMarker,
          { left: position },
          isActive && styles.activeKeyframeMarker
        ]}
        onPress={() => jumpToKeyframe(index)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.keyframeIndicator,
          isActive && styles.activeKeyframeIndicator
        ]}>
          <Text style={[
            styles.keyframeNumber,
            isActive && styles.activeKeyframeNumber
          ]}>
            {index + 1}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Audio Timeline Editor</Text>
          <Text style={styles.subtitle}>
            Red Line: {formatTime(redLineTime)} | Playing: {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>

        
        <View style={styles.timelineContainer}>
          <View style={styles.centerLine} />
          
          <View style={styles.positionIndicator}>
            <Text style={styles.positionText}>
              Time: {formatTime(redLineTime)}
            </Text>
          </View>
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            onScroll={(event) => setScrollPosition(event.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentContainerStyle={{
            height: 100,
            width: (duration / 1000) * PIXELS_PER_SECOND + screenWidth, // timeline width based on duration
            paddingLeft: screenWidth / 2,
            paddingRight: screenWidth / 2,
        }}
            scrollEnabled={true}
            bounces={true}
            decelerationRate="normal"
            onScrollBeginDrag={() => {
              // Update scroll offset when user scrolls manually
            }}
            onScroll={(event) => {
              const newOffset = event.nativeEvent.contentOffset.x;
              setScrollPosition(newOffset);
              setScrollOffset(newOffset); // Keep both for compatibility
            }}
          >
            <View style={styles.timeline}>
              <View style={styles.timeMarkers}>
                {Array.from({ length: Math.ceil(duration / 1000) + 1 }, (_, i) => {
                  const markerTime = i * 1000; // Every second
                  const markerPosition = (markerTime / 1000) * PIXELS_PER_SECOND;
                  return (
                    <View key={i} style={[
                      styles.timeMarker,
                      { left: markerPosition }
                    ]}>
                      <View style={styles.markerLine} />
                      <Text style={styles.markerText}>
                        {formatTime(markerTime)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.chunksContainer}>
                {chunks.map((chunk) => (
                  <AudioChunk key={chunk.id} chunk={chunk} />
                ))}
                
                {/* Between-chunk resize handles */}
                {chunks.map((chunk, index) => {
                  if (index < chunks.length - 1) {
                    const nextChunk = chunks[index + 1];
                    return (
                      <BetweenChunkResizer 
                        key={`between-${chunk.id}-${nextChunk.id}`}
                        leftChunk={chunk}
                        rightChunk={nextChunk}
                      />
                    );
                  }
                  return null;
                })}
              </View>

              {/* Keyframe Markers */}
              <View style={styles.keyframeContainer}>
                {keyframes && keyframes.map((keyframe, index) => (
                  <KeyframeMarker key={keyframe.id} keyframe={keyframe} index={index} />
                ))}
              </View>

            </View>
          </ScrollView>
        </View>

        <View style={styles.actionControls}>

          <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePlayback}
            activeOpacity={0.8}
          >
            <Text style={styles.iconText}>{isPlaying ? "⏸️" : "▶️"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={stopPlayback}
            activeOpacity={0.8}
          >
            <Text style={styles.iconText}>⏹️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.chunkButton,
              !selectedChunkId && styles.disabledButton,
            ]}
            onPress={playSelectedChunk}
            disabled={!selectedChunkId}
            activeOpacity={0.8}
          >
            <Text style={styles.iconText}>🔊</Text>
            <Text style={styles.buttonText}>Chunk</Text>
          </TouchableOpacity>
        </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={splitAtCurrentPosition}>
            <Text style={styles.iconText}>✂️</Text>
            <Text style={styles.actionButtonText}>Split</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.mergeButton,
              !selectedChunkId && styles.disabledButton
            ]} 
            onPress={() => selectedChunkId && showMergeDialog(selectedChunkId)}
            disabled={!selectedChunkId}
          >
            <Text style={styles.iconText}>🔗</Text>
            <Text style={styles.actionButtonText}>Merge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetChunks}>
            <Text style={styles.iconText}>🔄</Text>
            <Text style={styles.actionButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {selectedChunkId && (
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              Selected: {selectedChunkId} ({chunks.find(c => c.id === selectedChunkId)?.user}) | Red Line Time: {formatTime(redLineTime)}
            </Text>
          </View>
        )}

        {keyframes && keyframes.length > 0 && (
          <View style={styles.keyframeInfo}>
            <Text style={styles.keyframeInfoText}>
              Keyframes: {keyframes.length} | Current: {currentKeyframeIndex + 1}
            </Text>
          </View>
        )}
      </View>

      {/* Merge Confirmation Modal */}
      <Modal
        visible={showMergeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowMergeModal(false);
          setMergeChunkId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mergeModalContent}>
            <Text style={styles.mergeModalTitle}>Merge Chunk</Text>
            <Text style={styles.mergeModalText}>
              Which direction would you like to merge this chunk?
            </Text>
            
            <View style={styles.mergeButtonContainer}>
              {mergeChunkId && chunks.findIndex(c => c.id === mergeChunkId) > 0 && (
                <TouchableOpacity
                  style={[styles.mergeDirectionButton, styles.mergeLeftButton]}
                  onPress={() => mergeChunks('left')}
                >
                  <Text style={styles.mergeDirectionText}>← Merge Left</Text>
                </TouchableOpacity>
              )}
              
              {mergeChunkId && chunks.findIndex(c => c.id === mergeChunkId) < chunks.length - 1 && (
                <TouchableOpacity
                  style={[styles.mergeDirectionButton, styles.mergeRightButton]}
                  onPress={() => mergeChunks('right')}
                >
                  <Text style={styles.mergeDirectionText}>Merge Right →</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.mergeCancelButton}
              onPress={() => {
                setShowMergeModal(false);
                setMergeChunkId(null);
              }}
            >
              <Text style={styles.mergeCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
      
  );
}

const styles = StyleSheet.create({
  chunkCharacterLabel: {
  position: 'absolute',
  top: -12,
  left: '50%',
  transform: [{ translateX: -10 }],
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 2,
  elevation: 3,
},
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 4,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chunkButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    gap: 1,
    paddingHorizontal: 6,
    width: 'auto',
    minWidth: 50,
    height: 28,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  iconText: {
    fontSize: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
  timelineContainer: {
    height: 80,
    marginVertical: 2,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 2,
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: CENTER_LINE_POSITION,
    width: 3,
    backgroundColor: '#EF4444',
    zIndex: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    borderRadius: 1,
  },
  positionIndicator: {
    position: 'absolute',
    top: -16,
    left: CENTER_LINE_POSITION - 50,
    width: 100,
    alignItems: 'center',
    zIndex: 21,
  },
  positionText: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  timeline: {
    height: '100%',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  timeMarkers: {
    height: 16,
    marginBottom: 4,
    position: 'relative',
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: 8,
    backgroundColor: '#D1D5DB',
    marginBottom: 1,
  },
  markerText: {
    fontSize: 7,
    color: '#6B7280',
  },
  chunksContainer: {
    flex: 1,
    position: 'relative',
  },
  chunk: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'visible',
    minWidth: 60,
    flexDirection: 'row',
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 4,
  },
  leftResizeHandle: {
    left: -8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  rightResizeHandle: {
    right: -8,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  resizeIcon: {
    width: 12,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  resizeIconText: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  betweenResizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  betweenResizeIcon: {
    width: 14,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  betweenResizeIconText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  chunkContent: {
    flex: 1,
    padding: 2,
    justifyContent: 'space-between',
    minHeight: 40,
  },
  userLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginBottom: 1,
    maxWidth: '80%',
  },
  userText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chunkInfo: {
    alignItems: 'center',
  },
  chunkLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  chunkDuration: {
    fontSize: 7,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minHeight: 12,
    marginTop: 1,
  },
  waveformBar: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  selectionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  keyframeContainer: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    height: 24,
    zIndex: 8,
  },
  keyframeMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyframeIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  activeKeyframeMarker: {
    transform: [{ scale: 1.2 }],
  },
  activeKeyframeIndicator: {
    backgroundColor: '#F59E0B',
    borderColor: '#FFFFFF',
  },
  keyframeNumber: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeKeyframeNumber: {
    color: '#FFFFFF',
  },
  actionControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 50,
  },
  resetButton: {
    backgroundColor: '#EF4444',
  },
  mergeButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  selectionInfo: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginHorizontal: 4,
  },
  selectionText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '500',
  },
  keyframeInfo: {
    marginTop: 2,
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    marginHorizontal: 4,
  },
  keyframeInfoText: {
    fontSize: 10,
    color: '#7C3AED',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mergeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mergeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  mergeModalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  mergeButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mergeDirectionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  mergeLeftButton: {
    backgroundColor: '#3B82F6',
  },
  mergeRightButton: {
    backgroundColor: '#10B981',
  },
  mergeDirectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mergeCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mergeCancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
}); 