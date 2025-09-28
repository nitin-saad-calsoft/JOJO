//@ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
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
}

Sound.setCategory('Playback');

export default function AudioTimeline({
  addKeyframe,
  goToKeyframe,
  activeMicCharacterId,
  onPlayChange,
  onTimeUpdate,
  keyframes = [],
  currentKeyframeIndex = 0
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
    },
  ]);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingChunkId, setResizingChunkId] = useState<string | null>(null);
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeChunkId, setMergeChunkId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const positionIntervalRef = useRef<any>(null);

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

  // Use a single useEffect to handle playback position updates and auto-scrolling
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(position);
    }

    // Auto-scroll timeline during playback
    if (isPlaying && scrollViewRef.current) {
      const playbackPixelPosition = (position / 1000) * PIXELS_PER_SECOND;
      const targetScrollPosition = playbackPixelPosition - CENTER_LINE_POSITION;
      const clampedScrollPosition = Math.max(0, targetScrollPosition);

      // Scroll to the calculated position without animation for a continuous feel
      scrollViewRef.current.scrollTo({
        x: clampedScrollPosition,
        animated: false,
      });
    }
  }, [position, isPlaying, onTimeUpdate]);


  useEffect(() => {
    if (selectedChunkId) {
      setChunks((prevChunks) =>
        prevChunks.map((chunk) =>
          chunk.id === selectedChunkId
            ? { ...chunk, user: activeMicCharacterId }
            : chunk
        )
      );
    }
  }, [activeMicCharacterId]);

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

  useEffect(() => {
    if (isPlaying) {
      positionIntervalRef.current = setInterval(() => {
        if (sound) {
          sound.getCurrentTime((seconds) => {
            setPosition(seconds * 1000); // ms
          });
        } else {
          // Simulate playback for demo if no sound is loaded
          setPosition(prev => {
            const newPos = prev + 50; // Simulate 50ms passing
            return newPos >= duration ? 0 : newPos;
          });
        }
      }, 50);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [isPlaying, sound, duration]);

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
      }]);

      console.log(`Audio loaded, duration: ${audioDuration}ms`);
    });
  };

  const togglePlayback = () => {
    if (!sound) {
      setIsPlaying(!isPlaying);
      onPlayChange(!isPlaying);
      return;
    }

    if (isPlaying) {
      sound.pause();
      onPlayChange(false);
    } else {
      sound.play((success) => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        setIsPlaying(false);
        onPlayChange(false);
      });
      onPlayChange(true);
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    if (sound) {
      sound.stop();
      sound.setCurrentTime(0);
    }

    setIsPlaying(false);
    setPosition(0);
    onPlayChange(false);
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
      sound.setCurrentTime(startTimeSeconds, () => {
        sound.play((success) => {
          if (!success) {
            console.log('Playback of chunk failed');
          }
        });
        setIsPlaying(true);
      });
      // Pause after chunk duration
      setTimeout(() => {
        if (sound && isPlaying) {
          sound.pause();
          setIsPlaying(false);
        }
      }, chunk.endTime - chunk.startTime);
    } else {
      setPosition(chunk.startTime);
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, chunk.endTime - chunk.startTime);
    }
  };

  const splitAtCurrentPosition = () => {
    const redLineTime = position;
    const clampedTime = Math.max(0, Math.min(duration, redLineTime));

    const targetChunk = chunks.find(chunk =>
      clampedTime >= chunk.startTime && clampedTime <= chunk.endTime
    );

    if (!targetChunk) {
      Alert.alert('Split Error', `No chunk found at time ${formatTime(clampedTime)}`);
      return;
    }

    if (clampedTime <= targetChunk.startTime + MIN_CHUNK_DURATION ||
      clampedTime >= targetChunk.endTime - MIN_CHUNK_DURATION) {
      Alert.alert('Split Error', `Cannot split too close to chunk edges.\nSplit time: ${formatTime(clampedTime)}\nChunk: ${formatTime(targetChunk.startTime)} - ${formatTime(targetChunk.endTime)}`);
      return;
    }

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
    };

    const newChunks = chunks.filter(chunk => chunk.id !== targetChunk.id);
    newChunks.push(leftChunk, rightChunk);
    const sortedChunks = newChunks.sort((a, b) => a.startTime - b.startTime);

    setChunks(sortedChunks);
    addKeyframe();
    Alert.alert('Split Success', `Split chunk "${targetChunk.id}" at ${formatTime(clampedTime)}\nCreated: ${leftChunk.id} and ${rightChunk.id}`);
  };

  const getRandomColor = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const selectChunk = (chunkId: string) => {
    setSelectedChunkId(selectedChunkId === chunkId ? null : chunkId);
    setChunks(chunks.map(chunk => ({
      ...chunk,
      selected: chunk.id === chunkId ? !chunk.selected : false,
    })));
    const index = chunks.findIndex(r => r.id === chunkId);
    goToKeyframe(index);
  };

  const resetChunks = () => {
    setChunks([{
      id: '1',
      startTime: 0,
      endTime: duration,
      selected: false,
      color: '#3B82F6',
      user: 'User 1',
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
        const deltaTime = (gestureState.dx / PIXELS_PER_SECOND) * 1000;
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
        let newStartTime = Math.max(0, chunk.startTime + deltaTime);
        const prevChunk = chunkIndex > 0 ? newChunks[chunkIndex - 1] : null;
        const minStartTime = prevChunk ? prevChunk.endTime : 0;
        const maxStartTime = chunk.endTime - MIN_CHUNK_DURATION;
        newStartTime = Math.max(minStartTime, Math.min(maxStartTime, newStartTime));

        newChunks[chunkIndex] = { ...chunk, startTime: newStartTime };
      } else {
        let newEndTime = Math.min(duration, chunk.endTime + deltaTime);
        const nextChunk = chunkIndex < newChunks.length - 1 ? newChunks[chunkIndex + 1] : null;
        const minEndTime = chunk.startTime + MIN_CHUNK_DURATION;
        const maxEndTime = nextChunk ? nextChunk.startTime : duration;
        newEndTime = Math.min(maxEndTime, Math.max(minEndTime, newEndTime));

        newChunks[chunkIndex] = { ...chunk, endTime: newEndTime };
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

    const mergedChunk: Chunk = {
      id: `merged_${Date.now()}`,
      startTime: Math.min(chunk.startTime, targetChunk.startTime),
      endTime: Math.max(chunk.endTime, targetChunk.endTime),
      selected: false,
      color: chunk.color,
      user: chunk.user,
    };

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
        const deltaTime = (gestureState.dx / PIXELS_PER_SECOND) * 1000;
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

      const currentBoundary = leftChunk.endTime;
      const newBoundary = currentBoundary + deltaTime;

      const minLeftEnd = leftChunk.startTime + MIN_CHUNK_DURATION;
      const maxLeftEnd = rightChunk.endTime - MIN_CHUNK_DURATION;

      const clampedBoundary = Math.max(minLeftEnd, Math.min(maxLeftEnd, newBoundary));

      newChunks[leftIndex] = { ...leftChunk, endTime: clampedBoundary };
      newChunks[rightIndex] = { ...rightChunk, startTime: clampedBoundary };

      return newChunks;
    });
  };

  const jumpToKeyframe = (keyframeIndex: number) => {
    if (keyframes && keyframes[keyframeIndex]) {
      const keyframe = keyframes[keyframeIndex];
      setPosition(keyframe.time);

      const targetScrollOffset = (keyframe.time / 1000) * PIXELS_PER_SECOND - CENTER_LINE_POSITION;
      scrollViewRef.current?.scrollTo({ x: Math.max(0, targetScrollOffset), animated: true });

      if (sound) {
        sound.setCurrentTime(keyframe.time / 1000);
      }
      goToKeyframe(keyframeIndex);
    }
  };

  const formatTime = (milliseconds: number) => {
    if (isNaN(milliseconds)) return '0:00';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const redLineTime = position;

  const AudioChunk = ({ chunk }: { chunk: Chunk }) => {
    const startPosition = (chunk.startTime / 1000) * PIXELS_PER_SECOND;
    const width = ((chunk.endTime - chunk.startTime) / 1000) * PIXELS_PER_SECOND;

    const leftResizer = createResizePanResponder(chunk.id, 'left');
    const rightResizer = createResizePanResponder(chunk.id, 'right');

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
          <View style={styles.userLabel}>
            <Text style={styles.userText}>{chunk.user}</Text>
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
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentContainerStyle={{
              height: 100,
              width: (duration / 1000) * PIXELS_PER_SECOND,
              paddingLeft: CENTER_LINE_POSITION,
            }}
            scrollEnabled={true}
            bounces={true}
            decelerationRate="normal"
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
              style={styles.cancelButton}
              onPress={() => setShowMergeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  timelineContainer: {
    height: 100,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  centerLine: {
    position: 'absolute',
    left: CENTER_LINE_POSITION,
    width: 2,
    height: '100%',
    backgroundColor: '#EF4444',
    zIndex: 10,
  },
  positionIndicator: {
    position: 'absolute',
    top: -30,
    left: CENTER_LINE_POSITION - 50,
    backgroundColor: '#4B5563',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 20,
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  timeline: {
    position: 'relative',
    height: '100%',
  },
  timeMarkers: {
    position: 'absolute',
    top: 0,
    height: '100%',
    flexDirection: 'row',
  },
  timeMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: 10,
    backgroundColor: '#6B7280',
    position: 'absolute',
    top: 0,
  },
  markerText: {
    fontSize: 10,
    color: '#6B7280',
    position: 'absolute',
    top: 12,
  },
  chunksContainer: {
    position: 'absolute',
    top: 30,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chunk: {
    position: 'absolute',
    height: '100%',
    borderRadius: 6,
    borderWidth: 2,
    overflow: 'hidden',
  },
  chunkContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  userLabel: {
    position: 'absolute',
    top: 4,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  userText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  chunkInfo: {
    position: 'absolute',
    bottom: 4,
    left: 8,
  },
  chunkLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  chunkDuration: {
    fontSize: 10,
    color: 'white',
  },
  waveform: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    bottom: 0,
    left: 8,
    right: 8,
    opacity: 0.7,
  },
  waveformBar: {
    width: 2,
    backgroundColor: 'white',
    marginHorizontal: 1,
  },
  resizeHandle: {
    position: 'absolute',
    width: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  leftResizeHandle: {
    left: -8,
  },
  rightResizeHandle: {
    right: -8,
  },
  resizeIcon: {
    width: 12,
    height: 24,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeIconText: {
    color: 'white',
    fontSize: 10,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectionIndicator: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#1F2937',
    borderRadius: 6,
  },
  betweenResizeHandle: {
    position: 'absolute',
    width: 16,
    height: 30,
    top: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  betweenResizeIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betweenResizeIconText: {
    color: 'white',
    fontSize: 10,
  },
  keyframeContainer: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  keyframeMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  keyframeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    top: 2,
  },
  activeKeyframeMarker: {
    zIndex: 25,
  },
  activeKeyframeIndicator: {
    backgroundColor: '#EF4444',
  },
  keyframeNumber: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  activeKeyframeNumber: {
    color: '#fff',
  },
  actionControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  chunkButton: {
    backgroundColor: '#3B82F6',
  },
  iconText: {
    fontSize: 16,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B5563',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  mergeButton: {
    backgroundColor: '#10B981',
  },
  resetButton: {
    backgroundColor: '#F59E0B',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  selectionInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#374151',
  },
  keyframeInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  keyframeInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mergeModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  mergeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mergeModalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  mergeButtonContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  mergeDirectionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  mergeLeftButton: {
    backgroundColor: '#10B981',
  },
  mergeRightButton: {
    backgroundColor: '#3B82F6',
  },
  mergeDirectionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
