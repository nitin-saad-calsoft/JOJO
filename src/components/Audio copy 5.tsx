import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import {
  Waveform,
  type IWaveformRef,
} from '@simform_solutions/react-native-audio-waveform';
import { computeAmplitude } from 'react-native-audio-analyzer';
import RNFS from "react-native-fs";

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
  selectedCharacter,
  characters,
  onMicAssign,
  onChunkActive,
  unassignTrigger,
  assignChunkToCharacter,
  onSelectedChunkCharacterId, // <-- Add this prop
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
  const [amplitudeData, setAmplitudeData] = useState<number[]>([]);


  const analyzeAudio = useCallback(async () => {
    try {
      // pick a sample MP3
      const url = "https://onlinetestcase.com/wp-content/uploads/2023/06/1-MB-MP3.mp3";
      const localPath = `${RNFS.CachesDirectoryPath}/sample.mp3`;

      // download first
      const download = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;

      if (download.statusCode === 200) {
        const result = await computeAmplitude(localPath, 1000);
        console.log("✅ Amplitude result:", result?.length);
        setAmplitudeData(result || []);
      } else {
        console.error("Download failed:", download.statusCode);
      }
    } catch (error) {
      console.error("Error analyzing audio:", error);
    }
  }, []);

  useEffect(() => {
    analyzeAudio();
  }, [analyzeAudio]);

  useEffect(() => {
    if (scrollViewRef.current) {
      const currentOffset = (position / 1000) * PIXELS_PER_SECOND;
      const targetOffset = currentOffset;

      scrollViewRef.current.scrollTo({
        x: targetOffset,
        y: 0,
        animated: false,
      });
    }
  }, [position, isPlaying]);

  // Replace the problematic useEffect with a guarded version:
  // useEffect(() => {
  //   if (!selectedChunkId) return;
  //   setChunks((prev) => {
  //     const selectedChunk = prev.find(chunk => chunk.id === selectedChunkId);
  //     // Only update if the characterId is actually different
  //     if (!selectedChunk || selectedChunk.characterId === activeMicCharacterId) return prev;
  //     return prev.map((chunk) =>
  //       chunk.id === selectedChunkId
  //         ? { ...chunk, characterId: activeMicCharacterId }
  //         : chunk
  //     );
  //   });
  // }, [activeMicCharacterId, selectedChunkId])


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

  console.log("*(*(****(*(chnks", chunks)
  useEffect(() => {
    if (!duration || chunks.length === 0) return;

    if (!isPlaying) return;

    const activeIndex = chunks.findIndex(
      (c) => position >= c.startTime && position < c.endTime
    );

    if (activeIndex !== -1) {
      goToKeyframe(activeIndex);
      const activeChunk = chunks[activeIndex];
      console.log("----activeChunk.characterId", activeChunk.characterId)
      if (activeChunk && activeChunk?.characterId) {
        if (onChunkActive) {
          onChunkActive?.(activeChunk.characterId);
        }
      }
    }
    else {
      // If no chunk is active, set the anximation back to idle.
      if (onChunkActive) {
        onChunkActive(null);
      }
    }
    if (!isPlaying) {
      onChunkActive(null);
    }
  }, [position, duration, chunks, isPlaying]);


  const loadAudio = () => {
    const audioFile = new Sound('large.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
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
      onPlayChange?.(!isPlaying);
      return;
    }

    if (isPlaying) {
      sound.pause();
      // Do NOT call onPlaybackEnd here
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        onPlayChange?.(false);
        if (onChunkActive) onChunkActive(null);
      }
      setIsPlaying(false);
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
        onPlaybackEnd?.(); // Only call here, when playback ends
      });
      startPositionTracking();
      onPlayChange?.(true);
      setIsPlaying(true);
    }
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
  const redLineTime = (scrollPosition / PIXELS_PER_SECOND) * 1000;
  const clampedTime = Math.max(0, Math.min(duration, redLineTime));

  const targetChunk = chunks.find(chunk =>
    clampedTime > chunk.startTime && clampedTime < chunk.endTime
  );

  if (!targetChunk) return;

  // Remove the minimum chunk duration check
  // if (clampedTime - targetChunk.startTime < MIN_CHUNK_DURATION ||
  //     targetChunk.endTime - clampedTime < MIN_CHUNK_DURATION) {
  //   Alert.alert("Split too close to chunk edges");
  //   return;
  // }

  // Create two chunks
  const leftChunk = {
    ...targetChunk,
    id: `${targetChunk.id}_L_${Date.now()}`,
    startTime: targetChunk.startTime,
    endTime: clampedTime,
  };
  const rightChunk = {
    ...targetChunk,
    id: `${targetChunk.id}_R_${Date.now()}`,
    startTime: clampedTime,
    endTime: targetChunk.endTime,
  };

  // Replace original chunk with two new chunks
  const updatedChunks = chunks
    .filter(c => c.id !== targetChunk.id)
    .concat(leftChunk, rightChunk)
    .sort((a, b) => a.startTime - b.startTime);

  // Ensure no overlaps
  for (let i = 1; i < updatedChunks.length; i++) {
    updatedChunks[i].startTime = updatedChunks[i - 1].endTime;
  }

  setChunks(updatedChunks);
  addKeyframe();
};


  const selectChunk = (chunkId: string) => {
    const newSelectedId = selectedChunkId === chunkId ? null : chunkId;
    setSelectedChunkId(newSelectedId);
    // onChunkSelect?.(newSelectedId); // Notify parent component

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
      characterId: null
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
        // Calculate the new boundary position based on the delta time
        const newBoundary = chunk.startTime + deltaTime;

        // Get previous chunk boundary
        const prevChunk = chunkIndex > 0 ? newChunks[chunkIndex - 1] : null;

        // Clamp the new start time to prevent overlaps and enforce minimum duration
        const clampedBoundary = Math.max(
          prevChunk ? prevChunk.endTime : 0,
          Math.min(chunk.endTime - MIN_CHUNK_DURATION, newBoundary)
        );

        // Update the current chunk's start time
        newChunks[chunkIndex] = { ...chunk, startTime: clampedBoundary };

        // Adjust the previous chunk's end time to fill the gap
        if (prevChunk) {
          newChunks[chunkIndex - 1] = { ...prevChunk, endTime: clampedBoundary };
        }
      } else { // side === 'right'
        // Calculate the new boundary position based on the delta time
        const newBoundary = chunk.endTime + deltaTime;

        // Get the next chunk boundary
        const nextChunk = chunkIndex < newChunks.length - 1 ? newChunks[chunkIndex + 1] : null;

        // Clamp the new end time to prevent overlaps and enforce minimum duration
        const clampedBoundary = Math.min(
          nextChunk ? nextChunk.startTime : duration,
          Math.max(chunk.startTime + MIN_CHUNK_DURATION, newBoundary)
        );

        // Update the current chunk's end time
        newChunks[chunkIndex] = { ...chunk, endTime: clampedBoundary };

        // Adjust the next chunk's start time to fill the gap
        if (nextChunk) {
          newChunks[chunkIndex + 1] = { ...nextChunk, startTime: clampedBoundary };
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
      console.log("=== Index", index)
      if (index !== -1) {
        goToKeyframe(index);
      }
    }
  }, [redLineTimeMs, chunks, duration]);

  // Inside WaveformBars component
// const WaveformBars = React.memo(({ barsToShow }: any) => {
//   // 1. Find the maximum amplitude in this specific chunk's data
//   const maxAmplitude = barsToShow.length > 0 ? Math.max(...barsToShow) : 1;

//   // 2. Normalize and scale the amplitudes for display
//   const normalizedBars = useMemo(() => {
//     return barsToShow.map(amp => (amp / maxAmplitude) * 100);
//   }, [barsToShow, maxAmplitude]);

//   return (
//     <View style={styles.waveform}>
//       {normalizedBars.map((normalizedHeight, index) => (
//         <View
//           key={index}
//           style={[
//             styles.bar,
//             { height: normalizedHeight } // Use normalized height
//           ]}
//         />
//       ))}
//     </View>
//   );
// }, (prevProps: any, nextProps: any) => {
//   return prevProps.barsToShow === nextProps.barsToShow;
// });

  const WaveformBars = React.memo(({ barsToShow }:any) => {
  return (<></>
    // <ScrollView horizontal contentContainerStyle={styles.container}>
    // <View style={styles.waveform}>
    //     {amplitudeData.map((amplitude, index) => (
    //       <View
    //         key={index}
    //         style={[
    //           styles.bar,
    //           { height: 100 * amplitude } // Scale the height based on amplitude
    //         ]}
    //       />
    //     ))}
    //   </View>
    //   </ScrollView>
  );
}, (prevProps:any, nextProps:any) => {
  // Only rerender if bars data actually changes
  return prevProps.barsToShow === nextProps.barsToShow;
});

  const AudioChunk = React.memo(({ chunk }: { chunk: Chunk }) => {
  const startPosition = (chunk.startTime / 1000) * PIXELS_PER_SECOND;
  const width = ((chunk.endTime - chunk.startTime) / 1000) * PIXELS_PER_SECOND;
  const leftResizer = createResizePanResponder(chunk.id, 'left');
  const rightResizer = createResizePanResponder(chunk.id, 'right');

  // 🔹 Slice amplitude data only for this chunk’s time range
  const barsToShow = useMemo(() => {
    return amplitudeData.slice(
      Math.floor((chunk.startTime / duration) * amplitudeData.length),
      Math.floor((chunk.endTime / duration) * amplitudeData.length)
    );
  }, [chunk.startTime, chunk.endTime, amplitudeData, duration]);

  // Find character preview
  const character = chunk.characterId
    ? characters?.find((c: any) => c.id === chunk.characterId)
    : null;

  return (
    <View
      style={[
        styles.chunk,
        {
          left: startPosition,
          width: width,
          backgroundColor: "transparent",
          borderWidth: chunk.selected ? 2 : 1,
          borderColor: chunk.selected ? "#1F2937" : "#9CA3AF",
        },
      ]}
    >
      {/* Character preview at top center, only if assigned */}
      {character && (
        <View style={styles.chunkCharacterLabelFixed}>
          <Image
            source={{ uri: character.preview }}
            resizeMode="cover"
            style={styles.chunkCharacterImageFixed}
          />
        </View>
      )}

      {/* Left Resize Handle */}
      <View style={[styles.resizeHandle, styles.leftResizeHandle]} {...leftResizer.panHandlers}>
        <View style={styles.resizeIcon}>
          <Text style={styles.resizeIconText}>⟨</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.chunkContent}
        onPress={() => selectChunk(chunk.id)}
        activeOpacity={0.8}
      >
        {/* Waveform inside chunk */}
        <WaveformBars barsToShow={barsToShow} />
      </TouchableOpacity>

      {/* Right Resize Handle */}
      <View style={[styles.resizeHandle, styles.rightResizeHandle]} {...rightResizer.panHandlers}>
        <View style={styles.resizeIcon}>
          <Text style={styles.resizeIconText}>⟩</Text>
        </View>
      </View>
    </View>
  );
});

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

  useEffect(() => {
    if (unassignTrigger && unassignTrigger.characterId) {
      setChunks(prev =>
        prev.map(chunk =>
          chunk.characterId === unassignTrigger.characterId
            ? { ...chunk, characterId: null }
            : chunk
        )
      );
    }
  }, [unassignTrigger]);

  useEffect(() => {
    if (assignChunkToCharacter && assignChunkToCharacter.chunkId) {
      setChunks(prev =>
        prev.map(chunk =>
          chunk.id === assignChunkToCharacter.chunkId
            ? { ...chunk, characterId: assignChunkToCharacter.characterId }
            : chunk
        )
      );
    }
  }, [assignChunkToCharacter]);

  // In Audio.tsx, after selectChunk or when chunks/selectedChunkId changes:
  useEffect(() => {
    if (onSelectedChunkCharacterId) {
      const chunk = chunks.find(c => c.id === selectedChunkId);
      onSelectedChunkCharacterId(chunk?.characterId || null);
    }
  }, [selectedChunkId, chunks]);

  // Fix: Only update chunk characterId if both selectedChunkId and activeMicCharacterId are truthy and different
  useEffect(() => {
    // Only run if both are set and not null/undefined
    if (!selectedChunkId || !activeMicCharacterId) return;
    setChunks((prev) => {
      // Find the selected chunk
      const selectedChunk = prev.find(chunk => chunk.id === selectedChunkId);
      // If not found or already assigned, do nothing
      if (!selectedChunk || selectedChunk.characterId === activeMicCharacterId) return prev;
      // Only update if assignment is actually needed
      return prev.map((chunk) =>
        chunk.id === selectedChunkId
          ? { ...chunk, characterId: activeMicCharacterId }
          : chunk
      );
    });
    // Only run when either value changes, not on every render
  }, [activeMicCharacterId, selectedChunkId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={styles.content}>
        {/* Removed header and subtitle for a cleaner look */}

        <View style={styles.timelineContainer}>
          <View style={styles.centerLine} />
          <View style={styles.positionIndicator}>
            <Text style={styles.positionText}>
              {formatTime(redLineTime)}
            </Text>
          </View>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentContainerStyle={{
              height: 100,
              width: (duration / 1000) * PIXELS_PER_SECOND + screenWidth,
              paddingLeft: screenWidth / 2,
              paddingRight: screenWidth / 2,
            }}
            scrollEnabled={true}
            bounces={true}
            decelerationRate="normal"
            onScroll={(event) => {
              const newOffset = event.nativeEvent.contentOffset.x;
              setScrollPosition(newOffset);
              setScrollOffset(newOffset);
            }}
          >
            <View style={styles.timeline}>
              <View style={styles.timeMarkers}>
                {Array.from({ length: Math.ceil(duration / 1000) + 1 }, (_, i) => {
                  const markerTime = i * 1000;
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
              <View style={styles.keyframeContainer}>
                {keyframes && keyframes.map((keyframe, index) => (
                  <KeyframeMarker key={keyframe.id} keyframe={keyframe} index={index} />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Controls */}
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

        {/* Info sections can be hidden for more simplicity, or keep if needed */}
        {/* {selectedChunkId && (
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
        )} */}
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
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  timelineContainer: {
    height: 90,
    marginVertical: 8,
    position: 'relative',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: CENTER_LINE_POSITION,
    width: 3,
    backgroundColor: '#EF4444',
    zIndex: 20,
    borderRadius: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  positionIndicator: {
    position: 'absolute',
    top: -18,
    left: CENTER_LINE_POSITION - 50,
    width: 100,
    alignItems: 'center',
    zIndex: 21,
  },
  positionText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
    backgroundColor: '#FFF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  timeline: {
    height: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  timeMarkers: {
    height: 18,
    marginBottom: 6,
    position: 'relative',
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginBottom: 2,
  },
  markerText: {
    fontSize: 9,
    color: '#64748B',
  },
  chunksContainer: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chunk: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 6,
    backgroundColor: '#E0E7FF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    overflow: 'visible', // <-- Change from 'hidden' to 'visible'
  },
  chunkContent: {
    flex: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  chunkCharacterLabel: {
    position: "absolute",
    top: -32,
    left: "50%",
    transform: [{ translateX: -20 }],
    alignItems: "center",
    justifyContent: "center",
  },
  chunkCharacterImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#FFF',
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 6,
  },
  leftResizeHandle: {
    left: -8,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rightResizeHandle: {
    right: -8,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  resizeIcon: {
    width: 12,
    height: 24,
    backgroundColor: '#FFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  resizeIconText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  betweenResizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  betweenResizeIcon: {
    width: 14,
    height: 28,
    backgroundColor: '#FFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  betweenResizeIconText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 1,
  },
  bar: {
    width: 2,
    marginHorizontal: 1,
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 8,
  },
  controlButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  chunkButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 40,
    height: 26,
    borderRadius: 13,
    marginHorizontal: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  iconText: {
    fontSize: 13,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 2,
  },
  actionControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 13,
    marginHorizontal: 2,
    minWidth: 40,
    height: 26,
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
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
    fontWeight: '700',
    marginLeft: 4,
  },
  selectionInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    marginHorizontal: 6,
  },
  selectionText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: '500',
  },
  keyframeInfo: {
    marginTop: 4,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    marginHorizontal: 6,
  },
  keyframeInfoText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
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
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  activeKeyframeMarker: {
    transform: [{ scale: 1.2 }],
  },
  activeKeyframeIndicator: {
    backgroundColor: '#F59E0B',
    borderColor: '#FFF',
  },
  keyframeNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  activeKeyframeNumber: {
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mergeModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 28,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  mergeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  mergeModalText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  mergeButtonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  mergeDirectionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  mergeLeftButton: {
    backgroundColor: '#6366F1',
  },
  mergeRightButton: {
    backgroundColor: '#10B981',
  },
  mergeDirectionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mergeCancelButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  mergeCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  chunkCharacterLabelFixed: {
    position: "absolute",
    top: -28, // Move further up so the icon is fully visible
    left: "50%",
    transform: [{ translateX: -18 }],
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    pointerEvents: "none",
  },
  chunkCharacterImageFixed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#FFF',
    // Add shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
});