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
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';

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
  stateMachine?: string;
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

  // Video Export State
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Refs
  const canvasRef = useRef<ViewShot>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch characters from API
  const fetchCharacters = async () => {
    try {
      const response = await fetch('http://10.0.2.2:5000/api/characters');
      const data = await response.json();
      console.log('API Characters loaded:', data);

      const transformedCharacters = (data.characters || []).map((char: any) => {
        let previewUrl = 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400';
        if (char.previewImage?.filename) {
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
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Load selected data from navigation params
  useEffect(() => {
    console.log('=== MOVIE CREATION PARAMS ===');
    console.log('Route params:', route?.params);

    const selectedCharacterData = route?.params?.selectedCharacters || [];
    const selectedBackgroundData = route?.params?.selectedBackground;
    const selectedAudioData = route?.params?.selectedAudio;

    // Load characters
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

      setKeyframes([{
        id: 'keyframe_0',
        time: 0,
        characters: [...newCharacters]
      }]);
    }

    // Load background
    if (selectedBackgroundData) {
      setSelectedBackground(selectedBackgroundData);
    } else {
      setSelectedBackground(availableBackgrounds[0]);
    }

    // Store audio data
    if (selectedAudioData) {
      setSelectedAudio(selectedAudioData);
    }
  }, [route?.params]);

  // Initialize mic states
  useEffect(() => {
    if (characters.length === 0) return;

    setMicStates((prev) => {
      if (Object.keys(prev).length > 0) return prev;

      const initialMicStates: { [id: string]: boolean } = {};
      characters.forEach((char, index) => {
        initialMicStates[char.id] = index === 0;
      });
      return initialMicStates;
    });
  }, [characters]);

  // Get audio duration when audio is selected
  useEffect(() => {
    if (selectedAudio?.duration) {
      let totalMs = 0;
      if (typeof selectedAudio.duration === 'string') {
        const parts = selectedAudio.duration.split(':');
        const minutes = parseInt(parts[0] || '0');
        const seconds = parseInt(parts[1] || '0');
        totalMs = (minutes * 60 + seconds) * 1000;
      } else if (typeof selectedAudio.duration === 'number') {
        totalMs = selectedAudio.duration * 1000;
      }
      
      setAudioDuration(totalMs);
      console.log('Audio duration set to:', totalMs, 'ms');
    } else {
      setAudioDuration(30000); // 30 seconds default
    }
  }, [selectedAudio]);

  // More robust frame capture with extensive error handling
  const captureFrame = async (): Promise<string | null> => {
    if (!canvasRef.current) {
      console.error('❌ Canvas ref not available');
      return null;
    }

    try {
      // Wait longer for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Try multiple capture attempts with different settings
      let tmpUri = null;
      let attempt = 0;
      const maxAttempts = 5;
      
      while (!tmpUri && attempt < maxAttempts) {
        attempt++;
        console.log(`📸 Frame capture attempt ${attempt}/${maxAttempts}`);
        
        try {
          // Use different quality and size settings on each attempt
          const captureOptions = {
            format: "png" as const,
            quality: attempt === 1 ? 1.0 : attempt === 2 ? 0.8 : attempt === 3 ? 0.6 : 0.3,
            result: 'tmpfile' as const,
            snapshotContentContainer: false,
            ...(attempt > 2 && { width: 320, height: 240 }), // Smaller size for later attempts
          };
          
          tmpUri = await canvasRef.current.capture(captureOptions);
          
          if (tmpUri) {
            console.log(`✅ Capture attempt ${attempt} succeeded`);
            break;
          }
        } catch (captureError) {
          console.warn(`⚠️ Capture attempt ${attempt} failed:`, captureError);
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait before retry
            continue;
          }
          throw captureError;
        }
      }
      
      if (!tmpUri) {
        throw new Error('All capture attempts failed - no URI returned');
      }
      
      console.log('📋 Capture result:', tmpUri);
      
      // Verify file exists and has content
      const tmpExists = await RNFS.exists(tmpUri);
      if (!tmpExists) {
        throw new Error('Captured file does not exist at path');
      }
      
      const tmpStats = await RNFS.stat(tmpUri);
      console.log(`📊 Captured file size: ${tmpStats.size} bytes`);
      
      if (tmpStats.size < 100) { // Very minimal size check
        console.error('❌ Captured file too small:', tmpStats.size, 'bytes');
        await RNFS.unlink(tmpUri).catch(() => {});
        throw new Error(`Captured file too small: ${tmpStats.size} bytes`);
      }
      
      // Create final path
      const timestamp = Date.now();
      const filename = `frame_${timestamp}_${Math.random().toString(36).substr(2, 6)}.png`;
      const finalPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      
      // Move file to final location
      await RNFS.moveFile(tmpUri, finalPath);
      
      // Verify final file
      const finalExists = await RNFS.exists(finalPath);
      if (!finalExists) {
        throw new Error('Failed to move frame to final location');
      }
      
      const finalStats = await RNFS.stat(finalPath);
      console.log(`✅ Frame saved successfully: ${finalPath} (${finalStats.size} bytes)`);
      
      return finalPath;
    } catch (error) {
      console.error('❌ Frame capture completely failed:', error);
      return null;
    }
  };

  // Test frame capture with minimal settings
  const testFrameCapture = async (): Promise<boolean> => {
    if (!canvasRef.current) {
      console.error('❌ Canvas ref not available for test');
      return false;
    }

    try {
      console.log('🧪 Testing frame capture...');
      
      // Wait for UI to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test with minimal settings
      const testUri = await canvasRef.current.capture({
        format: "png",
        quality: 0.5,
        result: 'tmpfile'
      });
      
      console.log('📋 Test capture result:', testUri);
      
      if (!testUri) {
        console.error('❌ Test capture returned no URI');
        return false;
      }
      
      // Check if file exists
      const exists = await RNFS.exists(testUri);
      console.log('📋 Test file exists:', exists);
      
      if (!exists) {
        console.error('❌ Test file does not exist');
        return false;
      }
      
      // Check file size
      const stats = await RNFS.stat(testUri);
      console.log('📋 Test file size:', stats.size, 'bytes');
      
      if (stats.size < 100) {
        console.error('❌ Test file too small:', stats.size);
        await RNFS.unlink(testUri).catch(() => {});
        return false;
      }
      
      // Try to read first few bytes to verify it's a real file
      try {
        const header = await RNFS.read(testUri, 8, 0, 'base64');
        console.log('📋 Test file header length:', header.length);
        
        if (header.length === 0) {
          console.error('❌ Test file appears to be empty');
          await RNFS.unlink(testUri).catch(() => {});
          return false;
        }
      } catch (readError) {
        console.error('❌ Cannot read test file:', readError);
        await RNFS.unlink(testUri).catch(() => {});
        return false;
      }
      
      // Cleanup test file
      await RNFS.unlink(testUri).catch(() => {});
      
      console.log('✅ Frame capture test successful');
      return true;
    } catch (error) {
      console.error('❌ Frame capture test failed:', error);
      return false;
    }
  };

  // Enhanced auto-capture with dynamic frame requirements
  const startAutoCapture = async () => {
    try {
      if (!audioDuration || audioDuration === 0) {
        Alert.alert('No Audio', 'Please select an audio track to determine video length.');
        return;
      }

      console.log('🎬 Starting enhanced auto-capture...');
      console.log('📊 Audio duration:', audioDuration, 'ms');
      
      // Run comprehensive pre-flight test
      console.log('🧪 Running comprehensive pre-flight test...');
      const testResult = await testFrameCapture();
      if (!testResult) {
        Alert.alert(
          'Frame Capture Test Failed', 
          'The system cannot capture frames from the canvas. Please try:\n\n• Restart the app\n• Ensure characters are visible\n• Check device storage space',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('✅ Pre-flight test passed - starting capture process');
      
      setIsAutoCapturing(true);
      setCaptureProgress(0);
      setCapturedFrames([]);
      
      // Calculate frame requirements based on audio duration
      const audioDurationSeconds = Math.ceil(audioDuration / 1000);
      const frameRate = 0.5; // 0.5 FPS = 1 frame every 2 seconds
      const frameInterval = 1000 / frameRate; // 2000ms between frames
      const expectedFrames = Math.max(3, Math.ceil(audioDurationSeconds * frameRate)); // At least 3, but scale with audio
      const minRequiredFrames = Math.max(2, Math.floor(expectedFrames * 0.6)); // At least 60% success rate
      
      console.log(`📊 Enhanced capture settings:`);
      console.log(`  - Audio duration: ${audioDurationSeconds} seconds`);
      console.log(`  - Frame rate: ${frameRate} FPS (every ${frameInterval}ms)`);
      console.log(`  - Expected frames: ${expectedFrames}`);
      console.log(`  - Minimum required: ${minRequiredFrames}`);
      
      setIsPlaying(true);
      
      let frameCount = 0;
      let currentAnimationTime = 0;
      let successfulFrames = 0;
      let consecutiveFailures = 0;
      const capturedFrameURIs: string[] = [];
      const maxConsecutiveFailures = 5; // Allow more failures before giving up
      
      const captureNextFrame = async () => {
        if (currentAnimationTime >= audioDuration || consecutiveFailures >= maxConsecutiveFailures) {
          // Capture complete or too many failures
          if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
          }
          
          setIsPlaying(false);
          
          console.log(`🏁 Capture session complete!`);
          console.log(`📊 Results: ${successfulFrames}/${frameCount} frames captured`);
          console.log(`📊 Expected: ${expectedFrames}, Required: ${minRequiredFrames}`);
          console.log(`📁 Captured frames:`, capturedFrameURIs);
          
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.error('❌ Stopped due to consecutive failures');
            Alert.alert(
              'Capture Stopped - Too Many Failures', 
              `Capture stopped after ${consecutiveFailures} consecutive failures.\n\nCaptured ${successfulFrames} frames before stopping.\n\nTry:\n• Restart the app\n• Use simpler animations\n• Check device performance`
            );
            setIsAutoCapturing(false);
            setCaptureProgress(0);
            return;
          }
          
          // Check if we have sufficient frames
          if (successfulFrames >= minRequiredFrames) {
            console.log(`✅ Sufficient frames captured (${successfulFrames}/${minRequiredFrames} required)`);
            setTimeout(() => {
              createVideoFromFrames(capturedFrameURIs);
            }, 1000);
          } else {
            console.error(`❌ Insufficient frames: ${successfulFrames}/${minRequiredFrames} required`);
            Alert.alert(
              'Insufficient Frames Captured', 
              `Only ${successfulFrames} frames were captured.\n\nFor a ${audioDurationSeconds}-second audio, we need at least ${minRequiredFrames} frames.\n\nPossible issues:\n• Canvas rendering problems\n• Device performance\n• Memory constraints\n\nSolutions:\n• Try shorter audio (10-15 seconds)\n• Restart the app\n• Use fewer characters\n• Simplify the animation`,
              [{ text: 'OK' }]
            );
            setIsAutoCapturing(false);
            setCaptureProgress(0);
          }
          return;
        }
        
        // Update animation time
        setCurrentTime(currentAnimationTime);
        
        // Attempt frame capture with retries
        console.log(`📸 Attempting to capture frame ${frameCount + 1}/${expectedFrames} at ${Math.round(currentAnimationTime/1000)}s`);
        
        try {
          const frameUri = await captureFrame();
          
          if (frameUri) {
            capturedFrameURIs.push(frameUri);
            successfulFrames++;
            consecutiveFailures = 0; // Reset failure counter
            console.log(`✅ Frame ${frameCount + 1} captured successfully`);
          } else {
            consecutiveFailures++;
            console.warn(`⚠️ Frame ${frameCount + 1} capture returned null (consecutive failures: ${consecutiveFailures})`);
          }
        } catch (error) {
          consecutiveFailures++;
          console.error(`❌ Frame ${frameCount + 1} capture error (consecutive failures: ${consecutiveFailures}):`, error);
        }
        
        frameCount++;
        const progress = (currentAnimationTime / audioDuration) * 100;
        setCaptureProgress(progress);
        
        const successRate = frameCount > 0 ? Math.round((successfulFrames / frameCount) * 100) : 0;
        console.log(`📊 Progress: ${Math.round(progress)}% (${successfulFrames}/${frameCount} successful, ${successRate}% success rate, ${consecutiveFailures} consecutive failures)`);
        
        currentAnimationTime += frameInterval;
      };
      
      // Start the capture process with initial delay
      setTimeout(() => {
        captureIntervalRef.current = setInterval(captureNextFrame, frameInterval);
        // Also capture first frame immediately after delay
        setTimeout(captureNextFrame, 500);
      }, 1500); // Longer initial delay

    } catch (error) {
      console.error('❌ Auto-capture initialization failed:', error);
      setIsAutoCapturing(false);
      setCaptureProgress(0);
      Alert.alert('Capture Failed', `Failed to start auto-capture: ${error.message}`);
    }
  };

  // Enhanced video creation that works with variable frame counts
  const createVideoFromFrames = async (frameURIs: string[]) => {
    try {
      console.log('🎞️ Creating video from', frameURIs.length, 'frames...');
      
      if (frameURIs.length === 0) {
        throw new Error('No frames to process');
      }

      setCaptureProgress(55);

      // Basic frame validation - accept any existing file
      const validFrames: string[] = [];
      console.log('🔍 Validating frames...');
      
      for (let i = 0; i < frameURIs.length; i++) {
        const frameUri = frameURIs[i];
        try {
          const exists = await RNFS.exists(frameUri);
          if (exists) {
            const stats = await RNFS.stat(frameUri);
            if (stats.size > 50) { // Very lenient minimum size
              validFrames.push(frameUri);
              console.log(`✅ Frame ${i + 1} validated: ${stats.size} bytes`);
            } else {
              console.warn(`⚠️ Frame ${i + 1} too small: ${stats.size} bytes`);
            }
          } else {
            console.warn(`⚠️ Frame ${i + 1} does not exist`);
          }
        } catch (error) {
          console.warn(`⚠️ Error validating frame ${i + 1}:`, error);
        }
      }

      console.log(`📁 ${validFrames.length} valid frames out of ${frameURIs.length} total`);
      
      if (validFrames.length === 0) {
        throw new Error('No valid frames found');
      }
      
      // Smart frame duplication based on audio duration
      const audioDurationSeconds = Math.ceil(audioDuration / 1000);
      const targetFrameCount = Math.max(validFrames.length, audioDurationSeconds * 2); // Target 2 FPS minimum
      
      let processedFrames = [...validFrames];
      
      // If we don't have enough frames, intelligently duplicate them
      if (validFrames.length < targetFrameCount) {
        console.log(`📋 Duplicating frames: have ${validFrames.length}, target ${targetFrameCount}`);
        const duplicationsNeeded = targetFrameCount - validFrames.length;
        
        for (let i = 0; i < duplicationsNeeded; i++) {
          const sourceIndex = i % validFrames.length;
          processedFrames.push(validFrames[sourceIndex]);
        }
        
        console.log(`📋 After duplication: ${processedFrames.length} total frames`);
      }
      
      // Create temp directory
      const tempDir = `${RNFS.DocumentDirectoryPath}/video_frames_${Date.now()}`;
      await RNFS.mkdir(tempDir);
      console.log('📁 Created temp directory:', tempDir);
      
      setCaptureProgress(65);
      
      // Copy frames with sequential naming
      console.log('📁 Copying frames to temp directory...');
      for (let i = 0; i < processedFrames.length; i++) {
        const frameUri = processedFrames[i];
        const paddedIndex = String(i + 1).padStart(4, '0');
        const destPath = `${tempDir}/frame_${paddedIndex}.png`;
        
        await RNFS.copyFile(frameUri, destPath);
        
        // Basic verification
        const copyExists = await RNFS.exists(destPath);
        if (!copyExists) {
          throw new Error(`Failed to copy frame ${i + 1}`);
        }
        
        console.log(`✅ Copied frame ${i + 1}`);
      }
      
      setCaptureProgress(75);
      
      // Create output path
      const timestamp = Date.now();
      const outputPath = `${RNFS.DocumentDirectoryPath}/HareRam_Animation_${timestamp}.mp4`;
      console.log('🎯 Output video path:', outputPath);
      
      // Dynamic FFmpeg command based on frame count and audio duration
      const inputPattern = `${tempDir}/frame_%04d.png`;
      const inputFrameRate = Math.max(0.5, processedFrames.length / audioDurationSeconds); // Calculate input FPS
      const videoDuration = Math.max(5, audioDurationSeconds); // At least 5 seconds
      
      console.log('📊 Video encoding parameters:');
      console.log(`  - Frames: ${processedFrames.length}`);
      console.log(`  - Audio duration: ${audioDurationSeconds}s`);
      console.log(`  - Input frame rate: ${inputFrameRate} FPS`);
      console.log(`  - Target duration: ${videoDuration}s`);
      
      const ffmpegCommand = [
        '-y',
        '-framerate', inputFrameRate.toString(), // Use calculated input framerate
        '-i', inputPattern,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', '15', // Output at 15 FPS (good balance)
        '-t', videoDuration.toString(), // Use actual duration
        '-vf', 'scale=640:480,fps=15', // Ensure consistent output
        outputPath
      ];
      
      const commandString = ffmpegCommand.join(' ');
      console.log('🔧 FFmpeg command:', commandString);
      
      setCaptureProgress(85);
      
      // Execute FFmpeg
      console.log('⚙️ Starting FFmpeg execution...');
      const session = await FFmpegKit.execute(commandString);
      const returnCode = await session.getReturnCode();
      
      console.log(`📊 FFmpeg return code: ${returnCode}`);
      
      setCaptureProgress(95);
      
      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ FFmpeg completed successfully');
        
        const outputExists = await RNFS.exists(outputPath);
        console.log('📁 Output file exists:', outputExists);
        
        if (outputExists) {
          const fileStat = await RNFS.stat(outputPath);
          const fileSizeMB = Math.round(fileStat.size / (1024 * 1024) * 100) / 100;
          
          console.log('✅ Video created successfully');
          console.log('📊 Video size:', fileSizeMB, 'MB');
          
          setCaptureProgress(100);
          
          Alert.alert(
            '🎉 Video Export Complete!',
            `Animation video created successfully!\n\n🎬 Frames used: ${processedFrames.length}\n⏱️ Duration: ${videoDuration}s\n📁 Size: ${fileSizeMB}MB\n\n${validFrames.length < processedFrames.length ? 'Note: Some frames were duplicated to match audio length.' : ''}`,
            [
              { text: 'Great!' },
              { text: 'View Gallery', onPress: () => navigation.navigate('VideoGallery') },
              { text: 'Share Now', onPress: () => shareVideo(outputPath) }
            ]
          );
        } else {
          throw new Error('Video file was not created');
        }
      } else {
        const logs = await session.getAllLogsAsString();
        console.error('❌ FFmpeg failed:', logs);
        throw new Error(`FFmpeg failed (code ${returnCode})`);
      }
      
      // Cleanup
      try {
        await RNFS.unlink(tempDir);
        console.log('🧹 Cleaned up temp directory');
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError);
      }
      
    } catch (error) {
      console.error('❌ Video creation failed:', error);
      Alert.alert('Export Error', `Video creation failed: ${error.message}`);
    } finally {
      setIsAutoCapturing(false);
      setCaptureProgress(0);
      setCapturedFrames([]);
    }
  };

  // Share created video - Updated for Documents directory
  const shareVideo = async (videoPath: string) => {
    try {
      // For Android, we might need to copy to external storage first
      if (Platform.OS === 'android') {
        const externalPath = `${RNFS.ExternalDirectoryPath}/HareRam_Animation_${Date.now()}.mp4`;
        await RNFS.copyFile(videoPath, externalPath);
        
        await Share.share({
          url: `file://${externalPath}`,
          type: 'video/mp4',
          title: 'My HareRam Animation',
        });
      } else {
        await Share.share({
          url: `file://${videoPath}`,
          type: 'video/mp4',
          title: 'My HareRam Animation',
        });
      }
    } catch (error) {
      console.log('Share not available:', error);
      Alert.alert('Video Saved', `Video saved to: ${videoPath}`);
    }
  };

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Direct export on button click
  const handleExportClick = () => {
    console.log('🎬 Export video clicked');
    console.log('📊 Audio duration:', audioDuration, 'ms');
    
    if (!audioDuration || audioDuration === 0) {
      Alert.alert(
        'No Audio Selected',
        'Please select an audio track first. The video duration will be based on the audio length.',
        [{ text: 'OK' }]
      );
      return;
    }

    const durationSeconds = Math.ceil(audioDuration / 1000);
    const expectedFrames = Math.max(3, Math.ceil(durationSeconds * 0.5)); // 0.5 FPS
    const minRequired = Math.max(2, Math.floor(expectedFrames * 0.6));

    Alert.alert(
      'Enhanced Video Export',
      `Ready to create your animation!\n\n⏱️ Duration: ${durationSeconds} seconds\n🎬 Expected frames: ${expectedFrames}\n📋 Minimum needed: ${minRequired}\n\nThe system will capture frames every 2 seconds and automatically adjust for the audio length.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Capture', 
          onPress: handleTestCapture,
          style: 'default'
        },
        { 
          text: 'Start Export', 
          onPress: startAutoCapture,
          style: 'default'
        }
      ]
    );
  };

  const handleTestCapture = async () => {
    console.log('🧪 Testing single frame capture...');
    const success = await testFrameCapture();
    Alert.alert(
      'Test Result', 
      success ? 'Frame capture test successful!' : 'Frame capture test failed. Check console for details.',
      [{ text: 'OK' }]
    );
  };

  const addKeyframe = () => {
    const newKeyframe: Keyframe = {
      id: `keyframe_${Date.now()}`,
      time: currentTime,
      characters: [...characters],
    };

    const newIndex = keyframes.length;
    setKeyframes(prev => [...prev, newKeyframe]);

    // Auto-select the new keyframe
    setCurrentKeyframeIndex(newIndex);
  };

  const goToKeyframe = (index: number) => {
    if (index >= 0 && index < keyframes.length) {
      setCurrentKeyframeIndex(index);
      const keyframe = keyframes[index];
      setCharacters([...keyframe.characters]);
      setCurrentTime(keyframe.time);

      if (selectedCharacter && !keyframe.characters.find(c => c.id === selectedCharacter)) {
        setSelectedCharacter(keyframe.characters.length > 0 ? keyframe.characters[0].id : null);
      }
    }
  };

  const updateCurrentKeyframe = (updatedCharacters?: Character[]) => {
    setKeyframes(prev => {
      const updated = [...prev];
      updated[currentKeyframeIndex] = {
        ...updated[currentKeyframeIndex],
        characters: updatedCharacters || characters,
      };
      return updated;
    });
  };

  const handleChunkActive = useCallback((characterId: any) => {
    setActiveMicCharacterId(characterId);

    setCharacters((prevCharacters: any) => {
      if (isPlaying && characterId) {
        const updated = prevCharacters.map((char: any) => ({
          ...char,
          animation: char.id === characterId ? "talk" : "walk",
        }));
        updateCurrentKeyframe(updated);
        return updated;
      }
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
  }, []);

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

  const setUnassignChunksFromCharacter = (characterId: string) => {
    setUnassignTrigger({ characterId, ts: Date.now() });
  };

  const fetchCharacterById = async (id: string) => {
    try {
      const response = await fetch(`http://10.0.2.2:5000/api/characters/full/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  };

  const [fullCharacter, setFullCharacter] = useState<any>(null);

  useEffect(() => {
    if (showPropertiesModal && selectedChar?.id) {
      fetchCharacterById(selectedChar.id).then(data => {
        setFullCharacter(data);
      });
    }
  }, [showPropertiesModal]);

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

  const handleCharacterModalSelect = (characterId: string) => {
    const isSelected = !!characters.find(c => c.id === characterId);
    if (isSelected) {
      const updated = characters.filter(c => c.id !== characterId);
      setCharacters(updated);
      updateCurrentKeyframe(updated);
      if (selectedCharacter === characterId) setSelectedCharacter(null);
    } else {
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

  const selectedChar = characters?.find(char => char.id === selectedCharacter);

  const handleVideoGallery = () => {
    navigation.navigate('VideoGallery');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Movie Creation</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleVideoGallery}
          >
            <Icon name="video-library" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, isAutoCapturing && styles.disabledButton]}
            onPress={handleExportClick}
            disabled={isAutoCapturing}
          >
            <Icon name="file-download" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto-capture Status Indicator */}
      {isAutoCapturing && (
        <View style={styles.captureStatusBar}>
          <View style={styles.captureIndicator}>
            <View style={styles.captureDot} />
            <Text style={styles.captureText}>
              Auto-Capturing Frames... {Math.round(captureProgress)}%
            </Text>
          </View>
          <Text style={styles.captureHint}>
            {capturedFrames.length} frames captured • {Math.round(audioDuration / 1000)}s total
          </Text>
        </View>
      )}

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
      <ViewShot 
        ref={canvasRef} 
        options={{ 
          format: "png", 
          quality: 0.8,
          result: 'tmpfile'
        }} 
        style={styles.canvas}
      >
        <View style={styles.canvasBackground}>
          {/* Background Layer */}
          {selectedBackground && (
            <View style={styles.backgroundLayer}>
              {selectedBackground.preview ? (
                <Image
                  source={{ uri: selectedBackground.preview }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[
                  styles.backgroundColorLayer,
                  { backgroundColor: selectedBackground.color }
                ]} />
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

                        if (updated[character.id] && selectedChunkId) {
                          setAssignChunkToCharacter({
                            chunkId: selectedChunkId,
                            characterId: character.id,
                            ts: Date.now(),
                          });
                        }
                        if (!updated[character.id]) {
                          setUnassignChunksFromCharacter(character.id);
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
                  <RiveCharacter
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

                <Text style={styles.characterName}>{character.name}</Text>
              </Animated.View>
            );
          })}
        </View>
      </ViewShot>

      {/* Compact Control Panel */}
      <View style={styles.compactControlPanel}>
        <View style={styles.quickControls}>
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
          selectedAudio={selectedAudio} // <-- This prop is already being passed
          onMicAssign={(characterId: any) => {
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Character Properties</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPropertiesModal(false)}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {fullCharacter && (
              <View style={styles.propertiesContainer}>
                <Image
                  source={{ uri: fullCharacter.preview }}
                  style={styles.propertiesImage}
                  resizeMode="contain"
                />
                <Text style={styles.propertiesName}>{fullCharacter.name}</Text>
                <Text style={styles.propertiesType}>
                  {fullCharacter.isRive ? '🎭 Rive' : '🖼️ Static'} • {fullCharacter.category}
                </Text>
                <Text style={styles.propertiesDescription}>
                  {fullCharacter.description}
                </Text>

                <View style={styles.propertiesRow}>
                  <Text style={styles.propertiesLabel}>Animations:</Text>
                  <View style={styles.animationsContainer}>
                    {fullCharacter.animations?.map((anim: any) => (
                      <View key={anim.name} style={styles.animationBadge}>
                        <Text style={styles.animationText}>{anim.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.propertiesRow}>
                  <Text style={styles.propertiesLabel}>State Machine:</Text>
                  <Text style={styles.stateMachineText}>
                    {fullCharacter.stateMachine || 'None'}
                  </Text>
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
              data={allCharacters}
              renderItem={({ item }) => {
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
  captureStatusBar: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  captureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  captureText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.5,
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
  selectedCharacterItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
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
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertiesContainer: {
    padding: 16,
  },
  propertiesImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  propertiesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  propertiesType: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 8,
  },
  propertiesDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  propertiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  propertiesLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  animationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  animationBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  animationText: {
    fontSize: 12,
    color: '#1E293B',
  },
  stateMachineText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});