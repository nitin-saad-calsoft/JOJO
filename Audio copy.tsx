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
} from 'react-native';
import Sound from 'react-native-sound';
// import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');
const TIMELINE_WIDTH = screenWidth * 2; // Audio content width
const TOTAL_SCROLL_WIDTH = screenWidth * 4; // Total scrollable width with padding
const CENTER_LINE_POSITION = screenWidth / 2;
const MIN_CHUNK_DURATION = 2000; // Minimum 2 seconds
const RESIZE_HANDLE_WIDTH = 12;

interface Chunk {
  id: string;
  startTime: number;
  endTime: number;
  selected: boolean;
  color: string;
  user: string;
}

// Enable playback in silence mode for iOS
Sound.setCategory('Playback');

export default function AudioTimeline() {
  const [sound, setSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [chunks, setChunks] = useState<Chunk[]>([
    {
      id: '1',
      startTime: 0,
      endTime: 60000, // 60 seconds in ms (demo duration)
      selected: false,
      color: '#3B82F6',
      user: 'User 1',
    },
  ]);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingChunk, setResizingChunk] = useState<string | null>(null);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const positionIntervalRef = useRef({});
    const PIXELS_PER_SECOND = 50; 


  const onResize = (chunkId: number, deltaStart: number, deltaEnd: number) => {
  setChunks(prev =>
    prev.map(chunk => {
      if (chunk.id !== chunkId) return chunk;

      let newStart = chunk.start + deltaStart;
      let newEnd = chunk.end + deltaEnd;

      // Prevent invalid resizing (e.g. negative width)
      if (newEnd - newStart < 20) {
        return chunk;
      }

      // Prevent dragging before 0
      if (newStart < 0) newStart = 0;

      return {
        ...chunk,
        start: newStart,
        end: newEnd,
      };
    })
  );
};


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

  const loadAudio = () => {
    // For demo purposes, we'll use a mock duration
    // In a real app, you would load an actual audio file
    const mockDuration = 60000; // 60 seconds
    setDuration(mockDuration);
    
    // Update initial chunk duration
    setChunks([{
      id: '1',
      startTime: 0,
      endTime: mockDuration,
      selected: false,
      color: '#3B82F6',
      user: 'User 1',
    }]);

    // Uncomment below for real audio file loading:
    /*
    const audioFile = new Sound('your-audio-file.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        return;
      }
      
      const audioDuration = audioFile.getDuration() * 1000; // Convert to ms
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
    });
    */
  };

  const togglePlayback = () => {
    if (!sound) {
      // Demo mode - simulate playback
      if (isPlaying) {
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
        }
      } else {
        startPositionTracking();
      }
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      sound.pause();
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
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
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }
  };

  const startPositionTracking = () => {
    positionIntervalRef.current = setInterval(() => {
      if (sound) {
        sound.getCurrentTime((seconds) => {
          setPosition(seconds * 1000); // Convert to ms
        });
      } else {
        // Demo mode - simulate position tracking
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
      
      // Stop playback when chunk ends
      setTimeout(() => {
        sound.pause();
        setIsPlaying(false);
      }, chunk.endTime - chunk.startTime);
      
      startPositionTracking();
    } else {
      // Demo mode
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
    const currentTimelinePosition = scrollPosition + CENTER_LINE_POSITION;
    const timeAtPosition = (currentTimelinePosition / TIMELINE_WIDTH) * duration;
    
    // Clamp the time position to valid range
    const clampedTime = Math.max(0, Math.min(duration, timeAtPosition));

    // Find the chunk that contains this time position
    const targetChunk = chunks.find(chunk => 
      clampedTime >= chunk.startTime && clampedTime <= chunk.endTime
    );

    if (!targetChunk) {
      // If no chunk contains this position, create a new chunk
      const newChunk = {
        id: `chunk_${Date.now()}`,
        startTime: Math.max(0, clampedTime - MIN_CHUNK_DURATION / 2),
        endTime: Math.min(duration, clampedTime + MIN_CHUNK_DURATION / 2),
        selected: false,
        color: getRandomColor(),
        user: `User ${chunks.length + 1}`,
      };
      
      setChunks([...chunks, newChunk].sort((a, b) => a.startTime - b.startTime));
      Alert.alert('Success', 'New chunk created!');
      return;
    }

    // Split the existing chunk
    if (clampedTime <= targetChunk.startTime + MIN_CHUNK_DURATION || 
        clampedTime >= targetChunk.endTime - MIN_CHUNK_DURATION) {
      Alert.alert('Split Error', 'Cannot split too close to chunk edges. Minimum chunk duration is 2 seconds.');
      return;
    }

    const newChunks = chunks.map(chunk => {
      if (chunk.id === targetChunk.id) {
        return [
          {
            ...chunk,
            id: `${chunk.id}_left`,
            endTime: clampedTime,
            color: chunk.color,
          },
          {
            ...chunk,
            id: `${chunk.id}_right`,
            startTime: clampedTime,
            color: getRandomColor(),
            user: `User ${chunks.length + 1}`,
          }
        ];
      }
      return chunk;
    }).flat();

    setChunks(newChunks.sort((a, b) => a.startTime - b.startTime));
    Alert.alert('Success', 'Chunk split successfully!');
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

  const handleChunkResize = (chunkId, side, deltaX) => {
  // Convert px → ms (since your chunks use ms)
  const deltaMs = (deltaX / PIXELS_PER_SECOND) * 1000;

  setChunks((prev) => {
    const updated = [...prev];
    const index = updated.findIndex((c) => c.id === chunkId);
    if (index === -1) return prev;

    const chunk = { ...updated[index] };

    if (side === "start") {
      const newStart = chunk.startTime + deltaMs;

      // enforce min width (2s)
      if (chunk.endTime - newStart < MIN_CHUNK_DURATION) return prev;

      // prevent going before 0
      if (newStart < 0) return prev;

      // shift neighbor left
      if (index > 0) {
        updated[index - 1] = {
          ...updated[index - 1],
          endTime: newStart,
        };
      }

      chunk.startTime = newStart;
    } else if (side === "end") {
      const newEnd = chunk.endTime + deltaMs;

      // enforce min width (2s)
      if (newEnd - chunk.startTime < MIN_CHUNK_DURATION) return prev;

      // prevent going beyond total duration
      if (newEnd > duration) return prev;

      // shift neighbor right
      if (index < updated.length - 1) {
        updated[index + 1] = {
          ...updated[index + 1],
          startTime: newEnd,
        };
      }

      chunk.endTime = newEnd;
    }

    updated[index] = chunk;
    return updated;
  });
};



  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const scrollToPosition = (targetTime: number) => {
    const scrollX = Math.max(0, (targetTime / duration) * TIMELINE_WIDTH - CENTER_LINE_POSITION);
    scrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
  };

  const playheadPosition = (position / duration) * TIMELINE_WIDTH;

  // Audio Chunk Component with Resize Handles
  const AudioChunk = ({ chunk, onResize }: { chunk: Chunk, onResize:any }) => {
    const startPosition = (chunk.startTime / duration) * TIMELINE_WIDTH;
    const width = ((chunk.endTime - chunk.startTime) / duration) * TIMELINE_WIDTH;
    const resizeState = useRef(null);
    const MIN_CHUNK_DURATION = 500; // ms
    const PIXELS_PER_SECOND = 50;
    // Create pan responders for resize handles
  // Create pan responders for resize handles
// Create pan responders for resize handles
const createResizePanResponder = (chunk, side) =>
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      resizeState.current = {
        chunkId: chunk.id,
        side,
        initialX: gestureState.x0,
      };
    },
    onPanResponderMove: (_, gestureState) => {
      if (!resizeState.current) return;

      const { chunkId, side, initialX } = resizeState.current;
      const deltaX = gestureState.moveX - initialX;
      const deltaMs = (deltaX / PIXELS_PER_SECOND) * 1000;

      setChunks((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((c) => c.id === chunkId);
        if (index === -1) return prev;

        const current = { ...updated[index] };

        if (side === "start" && index > 0) {
          const neighbor = { ...updated[index - 1] };
          let newStart = current.startTime + deltaMs;

          // Clamp: cannot cross neighbor or shrink too much
          newStart = Math.max(
            neighbor.startTime + MIN_CHUNK_DURATION,
            Math.min(newStart, current.endTime - MIN_CHUNK_DURATION)
          );

          // Adjust both
          neighbor.endTime = newStart;
          current.startTime = newStart;

          updated[index - 1] = neighbor;
          updated[index] = current;
        }

        if (side === "end" && index < updated.length - 1) {
          const neighbor = { ...updated[index + 1] };
          let newEnd = current.endTime + deltaMs;

          // Clamp: cannot cross neighbor or shrink too much
          newEnd = Math.min(
            neighbor.endTime - MIN_CHUNK_DURATION,
            Math.max(newEnd, current.startTime + MIN_CHUNK_DURATION)
          );

          // Adjust both
          neighbor.startTime = newEnd;
          current.endTime = newEnd;

          updated[index + 1] = neighbor;
          updated[index] = current;
        }

        return updated;
      });

      // update initial for smooth dragging
      resizeState.current.initialX = gestureState.moveX;
    },
    onPanResponderRelease: () => {
      resizeState.current = null;
    },
  });








   

     const leftResizeResponder = createResizePanResponder("start", chunk.id);
    const rightResizeResponder = createResizePanResponder("end", chunk.id);

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
        {/* Left resize handle */}
        {/* <View
            style={{
                width: 10,
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.1)",
                position: "absolute",
                left: 0,
                justifyContent: "center",
                alignItems: "center",
            }}
            {...createResizePanResponder(chunk, "start").panHandlers}
            >
            <View style={{ width: 2, height: "50%", backgroundColor: "#333" }} />
            </View> */}

        {/* Main chunk content */}
        <TouchableOpacity
          style={styles.chunkContent}
          onPress={() => selectChunk(chunk.id)}
          activeOpacity={0.8}
        >
          {/* User label at top */}
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
          
          {/* Waveform simulation */}
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

        {/* Right resize handle */}
        <View
            style={{
                width: 10,
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.1)",
                position: "absolute",
                right: 0,
                justifyContent: "center",
                alignItems: "center",
            }}
            {...createResizePanResponder(chunk, "end").panHandlers}
            >
            <View style={{ width: 2, height: "50%", backgroundColor: "#333" }} />
            </View>
        
        {chunk.selected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.selectionIndicator} />
          </View>
        )}
      </View>
    );
  };

  // Helper function to scroll timeline to specific positions
  const scrollToStart = () => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollToEnd = () => {
    const maxScroll = TIMELINE_WIDTH - screenWidth;
    scrollViewRef.current?.scrollTo({ x: maxScroll, animated: true });
  };

  const scrollToMiddle = () => {
    const middleScroll = (TIMELINE_WIDTH - screenWidth) / 2;
    scrollViewRef.current?.scrollTo({ x: middleScroll, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Audio Timeline Editor</Text>
          <Text style={styles.subtitle}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
          <Text style={styles.instructionText}>
            Use scroll buttons or drag timeline to position red line anywhere
          </Text>
        </View>

        {/* Playback Controls */}
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

        {/* Timeline Navigation Controls */}
        <View style={styles.navigationControls}>
          <TouchableOpacity style={styles.navButton} onPress={scrollToStart}>
            <Text style={styles.navButtonText}>⏮️ Start</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={scrollToMiddle}>
            <Text style={styles.navButtonText}>⏺️ Middle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={scrollToEnd}>
            <Text style={styles.navButtonText}>⏭️ End</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {/* Center red line */}
          <View style={styles.centerLine} />
          
          {/* Timeline position indicator */}
          <View style={styles.positionIndicator}>
            <Text style={styles.positionText}>
              Red Line: {formatTime(Math.max(0, Math.min(duration, (scrollPosition + CENTER_LINE_POSITION) / TIMELINE_WIDTH * duration)))}
            </Text>
          </View>
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            onScroll={(event) => setScrollPosition(event.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentContainerStyle={{ width: TIMELINE_WIDTH }}
            scrollEnabled={!isResizing} 
          >
            <View style={styles.timeline}>
              {/* Time markers */}
              <View style={styles.timeMarkers}>
                {Array.from({ length: 31 }, (_, i) => (
                  <View key={i} style={[
                    styles.timeMarker,
                    { left: (i / 30) * TIMELINE_WIDTH }
                  ]}>
                    <View style={styles.markerLine} />
                    <Text style={styles.markerText}>
                      {formatTime((i / 30) * duration)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Audio chunks */}
              <View style={styles.chunksContainer}>
                {chunks.map((chunk) => (
                  <AudioChunk key={chunk.id} chunk={chunk} onResize={onResize} />
                ))}
              </View>

              {/* Playhead */}
              {playheadPosition >= 0 && (
                <View
                  style={[
                    styles.playhead,
                    { left: playheadPosition }
                  ]}
                />
              )}
            </View>
          </ScrollView>
        </View>

        {/* Action Controls */}
        <View style={styles.actionControls}>
          <TouchableOpacity style={styles.actionButton} onPress={splitAtCurrentPosition}>
            <Text style={styles.iconText}>✂️</Text>
            <Text style={styles.actionButtonText}>Split</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetChunks}>
            <Text style={styles.iconText}>🔄</Text>
            <Text style={styles.actionButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Selection Info */}
        {selectedChunkId && (
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              Selected: {selectedChunkId} ({chunks.find(c => c.id === selectedChunkId)?.user})
            </Text>
            <Text style={styles.selectionSubtext}>
              Drag the edges to resize • Tap to deselect
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to use:</Text>
          <Text style={styles.instructionItem}>• Use navigation buttons or scroll to position red line</Text>
          <Text style={styles.instructionItem}>• Split works at ANY position including start/end</Text>
          <Text style={styles.instructionItem}>• Tap chunks to select them</Text>
          <Text style={styles.instructionItem}>• Drag chunk edges to resize</Text>
          <Text style={styles.instructionItem}>• Selected chunk shows user info and can be played</Text>
        </View>
      </View>
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
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  chunkButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    width: 'auto',
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  iconText: {
    fontSize: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  timelineContainer: {
    height: 220,
    marginVertical: 20,
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: CENTER_LINE_POSITION,
    width: 3,
    backgroundColor: '#EF4444',
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  positionIndicator: {
    position: 'absolute',
    top: -25,
    left: CENTER_LINE_POSITION - 50,
    width: 100,
    alignItems: 'center',
    zIndex: 11,
  },
  positionText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  timeline: {
    height: '100%',
    position: 'relative',
  },
  timeMarkers: {
    height: 30,
    marginBottom: 10,
    position: 'relative',
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: 15,
    backgroundColor: '#D1D5DB',
    marginBottom: 4,
  },
  markerText: {
    fontSize: 9,
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
    width: RESIZE_HANDLE_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftHandle: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rightHandle: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  chunkContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    minHeight: 60,
  },
  userLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    maxWidth: '80%',
  },
  userText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chunkInfo: {
    alignItems: 'center',
  },
  chunkLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  chunkDuration: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minHeight: 20,
    marginTop: 4,
  },
  waveformBar: {
    width: 2,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  playhead: {
    position: 'absolute',
    top: 30,
    bottom: 0,
    width: 3,
    backgroundColor: '#10B981',
    zIndex: 5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  actionControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  selectionText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  selectionSubtext: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  instructions: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
});