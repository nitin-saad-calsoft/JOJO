//@ts-nocheck
import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { SafeAreaView, Text } from 'react-native';
import { View, PanResponder,Animated, StyleSheet, Dimensions, DeviceEventEmitter } from 'react-native';
import {  TouchableOpacity, ScrollView, Image, ImageBackground } from "react-native";
import { SvgXml, Svg, Rect, Path, Text as SvgText  } from "react-native-svg";

import Rive, { RiveRef } from 'rive-react-native';
import AudioTimeline from './Audio';

// कैरेक्टर डेटा (अब Rive और SVG दोनों शामिल हैं)
const characters = [
  {
    id: 'char-1',
    name: 'फर्स्ट कैरेक्टर (Rive)',
    type: 'rive',
    riveSrc: 'fifth.riv',
    stateMachine: 'talk-state-machine',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="40" height="80" fill="#FFDDC1" stroke="#333" strokeWidth="2"/>
        <text x="30" y="55" fontSize="12" textAnchor="middle" fill="#333">F.C.</text>
      </svg>`
    ),
  },
  {
    id: 'char-2',
    name: 'talk कैरेक्टर (Rive)',
    type: 'rive',
    riveSrc: 'https://cdn.rive.app/animations/vehicles.riv',
    stateMachine: 'State Machine 1',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="40" height="80" fill="#FFDDC1" stroke="#333" strokeWidth="2"/>
        <text x="30" y="55" fontSize="12" textAnchor="middle" fill="#333">F.C.</text>
      </svg>`
    ),
  },
  {
    id: 'char-3',
    name: 'second कैरेक्टर (Rive)',
    type: 'rive',
    riveSrc: 'https://cdn.rive.app/animations/vehicles.riv',
    stateMachine: 'State Machine 1',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="40" height="80" fill="#FFDDC1" stroke="#333" strokeWidth="2"/>
        <text x="30" y="55" fontSize="12" textAnchor="middle" fill="#333">F.C.</text>
      </svg>`
    ),
  },
  {
    id: 'char-4',
    name: 'वाहन (SVG)',
    type: 'svg',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="30" width="40" height="20" fill="#FFDDC1" stroke="#333" strokeWidth="2"/>
        <circle cx="20" cy="55" r="8" fill="#333"/>
        <circle cx="40" cy="55" r="8" fill="#333"/>
        <rect x="20" y="20" width="20" height="10" fill="#88B04B" stroke="#333" strokeWidth="2"/>
      </svg>`
    ),
  },
  {
    id: 'char-5',
    name: 'छोटा लड़का (SVG)',
    type: 'svg',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="20" r="15" fill="#FFDDC1" stroke="#333" strokeWidth="2"/>
        <rect x="20" y="35" width="20" height="40" fill="#88B04B" stroke="#333" strokeWidth="2"/>
        <rect x="15" y="75" width="10" height="25" fill="#6B5B95" stroke="#333" strokeWidth="2"/>
        <rect x="35" y="75" width="10" height="25" fill="#6B5B95" stroke="#333" strokeWidth="2"/>
        <rect x="10" y="40" width="10" height="25" fill="#F7CAC9" stroke="#333" strokeWidth="2" transform="rotate(-15 10 40)"/>
        <rect x="40" y="40" width="10" height="25" fill="#F7CAC9" stroke="#333" strokeWidth="2" transform="rotate(15 40 40)"/>
        <circle cx="25" cy="18" r="2" fill="black"/>
        <circle cx="35" cy="18" r="2" fill="black"/>
        <path d="M25 25 Q30 30 35 25" stroke="black" strokeWidth="1.5" fill="none"/>
        <line x1="30" y1="5" x2="30" y2="15" stroke="black" strokeWidth="2"/>
      </svg>`
    ),
  },
  {
    id: 'char-6',
    name: 'रोबोट (SVG)',
    type: 'svg',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="10" width="30" height="30" rx="5" fill="#B0C4DE" stroke="#333" strokeWidth="2"/>
        <rect x="10" y="40" width="40" height="40" rx="5" fill="#778899" stroke="#333" strokeWidth="2"/>
        <rect x="5" y="80" width="10" height="20" fill="#B0C4DE" stroke="#333" strokeWidth="2"/>
        <rect x="45" y="80" width="10" height="20" fill="#B0C4DE" stroke="#333" strokeWidth="2"/>
        <rect x="0" y="45" width="10" height="30" fill="#B0C4DE" stroke="#333" strokeWidth="2"/>
        <rect x="50" y="45" width="10" height="30" fill="#B0C4DE" stroke="#333" strokeWidth="2"/>
        <circle cx="25" cy="25" r="3" fill="black"/>
        <circle cx="35" cy="25" r="3" fill="black"/>
        <line x1="20" y1="35" x2="40" y2="35" stroke="black" strokeWidth="1.5"/>
      </svg>`
    ),
  },
  {
    id: 'char-7',
    name: 'टेडी (SVG)',
    type: 'svg',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="25" r="20" fill="#D2B48C" stroke="#333" strokeWidth="2"/>
        <circle cx="20" cy="15" r="8" fill="#D2B48C" stroke="#333" strokeWidth="2"/>
        <circle cx="40" cy="15" r="8" fill="#D2B48C" stroke="#333" strokeWidth="2"/>
        <circle cx="25" cy="22" r="2" fill="black"/>
        <circle cx="35" cy="22" r="2" fill="black"/>
        <circle cx="30" cy="30" r="3" fill="black"/>
        <path d="M25 35 Q30 38 35 35" stroke="black" strokeWidth="1.5" fill="none"/>
        <ellipse cx="30" cy="65" rx="25" ry="20" fill="#D2B48C" stroke="#333" strokeWidth="2"/>
        <rect x="5" y="55" width="10" height="25" fill="#D2B48C" stroke="#333" strokeWidth="2" transform="rotate(-15 5 55)"/>
        <rect x="45" y="55" width="10" height="25" fill="#D2B48C" stroke="#333" strokeWidth="2" transform="rotate(15 45 55)"/>
        <rect x="15" y="80" width="10" height="20" fill="#D2B48C" stroke="#333" strokeWidth="2"/>
        <rect x="35" y="80" width="10" height="20" fill="#D2B48C" stroke="#333" strokeWidth="2"/>
      </svg>`
    ),
  },
  {
    id: 'char-8',
    name: 'व्यक्ति 1 (SVG)',
    type: 'svg',
    svg: (
      `<svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="20" r="15" fill="#FFDDC1" stroke="#333" strokeWidth="2"/>
        <rect x="20" y="35" width="20" height="40" fill="#88B04B" stroke="#333" strokeWidth="2"/>
        <rect x="15" y="75" width="10" height="25" fill="#6B5B95" stroke="#333" strokeWidth="2"/>
        <rect x="35" y="75" width="10" height="25" fill="#6B5B95" stroke="#333" strokeWidth="2"/>
        <rect x="10" y="40" width="10" height="25" fill="#F7CAC9" stroke="#333" strokeWidth="2" transform="rotate(-15 10 40)"/>
        <rect x="40" y="40" width="10" height="25" fill="#F7CAC9" stroke="#333" strokeWidth="2" transform="rotate(15 40 40)"/>
        <circle cx="25" cy="18" r="2" fill="black"/>
        <circle cx="35" cy="18" r="2" fill="black"/>
        <path d="M25 25 Q30 30 35 25" stroke="black" strokeWidth="1.5" fill="none"/>
        <line x1="30" y1="5" x2="30" y2="15" stroke="black" strokeWidth="2"/>
      </svg>`
    ),
  },
  {
    id: 'char-9',
    name: 'कुत्ता 1 (SVG)',
    type: 'svg',
    svg: (
      `<svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="40" cy="30" rx="30" ry="20" fill="#A0522D" stroke="#333" strokeWidth="2"/>
        <circle cx="60" cy="20" r="15" fill="#A0522D" stroke="#333" strokeWidth="2"/>
        <polygon points="50,10 60,0 70,10" fill="#A0522D" stroke="#333" strokeWidth="2"/>
        <polygon points="30,10 20,0 10,10" fill="#A0522D" stroke="#333" strokeWidth="2"/>
        <circle cx="55" cy="18" r="2" fill="black"/>
        <circle cx="65" cy="18" r="2" fill="black"/>
        <circle cx="60" cy="25" r="3" fill="black"/>
        <rect x="30" y="45" width="10" height="15" fill="#A0522D" stroke="#333" strokeWidth="2"/>
        <rect x="50" y="45" width="10" height="15" fill="#A0522D" stroke="#333" strokeWidth="2"/>
        <line x1="60" y1="5" x2="60" y2="15" stroke="black" strokeWidth="2"/>
      </svg>`
    ),
  },
  {
    id: 'char-10',
    name: 'पेड़ 1 (SVG)',
    type: 'svg',
    svg: (
      `<svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="35" y="60" width="10" height="60" fill="#8B4513" stroke="#333" strokeWidth="2"/>
        <circle cx="40" cy="40" r="30" fill="#228B22" stroke="#333" strokeWidth="2"/>
        <circle cx="25" cy="30" r="20" fill="#228B22" stroke="#333" strokeWidth="2"/>
        <circle cx="55" cy="30" r="20" fill="#228B22" stroke="#333" strokeWidth="2"/>
        <line x1="40" y1="55" x2="40" y2="65" stroke="black" strokeWidth="2"/>
      </svg>`
    ),
  },
];

const backgrounds = [
  { id: 'grassland', name: 'घास का मैदान', color: '#B2EBF2', image: 'https://picsum.photos/600/400' },
  { id: 'city', name: 'शहर', color: '#A9A9A9', image: 'https://picsum.photos/600/400' },
  { id: 'forest', name: 'जंगल', color: '#8BC34A', image: 'https://picsum.photos/600/400' },
];

// दो बिंदुओं के बीच लीनियर इंटरपोलेशन के लिए हेल्पर फ़ंक्शन
const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
};

// Rive कैरेक्टर के लिए इंटरैक्टिव कंपोनेंट
const InteractiveRiveCharacter = forwardRef(({riveRef, character, action, frameIndex }, ref) => {
  // const { RiveComponent, rive } = useRive({
  //   src: character.riveSrc,
  //   stateMachines: [character.stateMachine],
  //   layout: new Layout({
  //     fit: Fit.Contain,
  //     alignment: Alignment.Center,
  //   }),
  //   autoplay: true,
  //   autoBind:true
  // });

  // useStateMachineInput हुक का उपयोग करें
  // यह 'action' नाम के Rive स्टेट मशीन इनपुट को नियंत्रित करता है
  const rive = ref.current;
  console.log("----0-rive",rive)
  // const actionInput = useStateMachineInput(rive, 'talk-state-machine', 'action');
  const vmi = rive?.viewModelInstance;
  const pointerX = vmi?.string('action');

  // `action` prop और `frameIndex` के बदलने पर Rive इनपुट को अपडेट करें
  useEffect(() => {
    // अगर rive या actionInput मौजूद नहीं है, तो कुछ न करें
    if (!rive || !vmi) return;

    // Rive state machine में 'action' इनपुट की वैल्यू को अपडेट करें।
    // `frameIndex` को डिपेंडेंसी के रूप में शामिल करने से यह सुनिश्चित होता है कि
    // एनीमेशन हर नए कीफ्रेम सेगमेंट की शुरुआत में फिर से ट्रिगर होता है,
    // भले ही `action` स्ट्रिंग वही हो।
    pointerX.value = action;
    console.log(`Rive action updated to: ${action} at frame ${frameIndex}`);

  }, [vmi, action, frameIndex]); // `actionInput`, `action`, और `frameIndex` के बदलने पर यह इफेक्ट चलेगा

  if (!character || !character.riveSrc) {
    return null;
  }

  return <Rive ref={ref}
    style={{
        width: 60,
        height: 100,
        backgroundColor: "transparent", // ✅ No background
      }}
      pointerEvents="none" 
        // url="https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv"
        resourceName={"fifth"}
        // style={{ width: 200, height: 200 }}
        // artboardName="Avatar 1"
        // stateMachineName="talk-state-machine" n bv 
    />;
});


export default function App() {
   const riveRef = useRef<RiveRef>(null);
  const [scenes, setScenes] = useState([
      {
        id: 'scene-1',
        name: 'सीन 1',
        background: backgrounds[0],
        placedCharacters: [],
        keyframes: [],
      },
    ]);
    const [currentSceneId, setCurrentSceneId] = useState('scene-1');
    const [nextSceneId, setNextSceneId] = useState(2);
  
    const currentScene = scenes.find((scene) => scene.id === currentSceneId);
  
    const [nextCharId, setNextCharId] = useState(1);
    const [activeCharacterId, setActiveCharacterId] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const animationFrameIdRef = useRef(null);
    const animationStartTimeRef = useRef(0);
    const frameDuration = 500;
    const [isPlayingAllScenes, setIsPlayingAllScenes] = useState(false);
    const [currentPlayingSceneIndex, setCurrentPlayingSceneIndex] = useState(0);
    const [modalMessage, setModalMessage] = useState(null);
    // एनीमेशन प्लेबैक स्पीड को नियंत्रित करने के लिए नया राज्य
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const audioRef = useRef(null);
  
    const isPlayingRef = useRef(isPlaying);
    const isPlayingAllScenesRef = useRef(isPlayingAllScenes);
    const currentPlayingSceneIndexRef = useRef(currentPlayingSceneIndex);
    const scenesRef = useRef(scenes);
    const currentSceneRef = useRef(currentScene);
    const selectedCharacterIdRef = useRef(selectedCharacterId);
    const playbackSpeedRef = useRef(playbackSpeed);
    const [activeMicCharacterId, setActiveMicCharacterId] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const [responders, setResponders] = useState<{ [id: string]: any }>({});
    const panValues = useRef<{ [id: string]: Animated.ValueXY }>({}).current;
    const panOffsets = useRef<{ [id: string]: { x: number; y: number } }>({}).current;


    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { isPlayingAllScenesRef.current = isPlayingAllScenes; }, [isPlayingAllScenes]);
    useEffect(() => { currentPlayingSceneIndexRef.current = currentPlayingSceneIndex; }, [currentPlayingSceneIndex]);
    useEffect(() => { scenesRef.current = scenes; }, [scenes]);
    useEffect(() => { currentSceneRef.current = currentScene; }, [currentScene]);
    useEffect(() => { selectedCharacterIdRef.current = selectedCharacterId; }, [selectedCharacterId]);
    useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  
    useEffect(() => {
      if (characters.length > 0) {
        setActiveMicCharacterId(characters[0].id); // mic ON for first character
      }
    }, []);

    useEffect(() => {
      return () => {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    }, [audioUrl]);
  
    const closeModal = () => {
      setModalMessage(null);
    };
  
    const updateCurrentScene = useCallback((updates) => {
      setScenes(prevScenes => prevScenes.map(scene =>
        scene.id === currentSceneId
          ? { ...scene, ...updates }
          : scene
      ));
    }, [currentSceneId]);
  
    const stopAnimation = useCallback(() => {
      console.log("स्टॉप पर क्लिक किया गया / stopAnimation को कॉल किया गया।");
      setIsPlaying(false);
      setIsPlayingAllScenes(false);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      setCurrentFrameIndex(0);
      setCurrentPlayingSceneIndex(0);
      if (scenesRef.current[0] && currentSceneId !== scenesRef.current[0].id) {
        setCurrentSceneId(scenesRef.current[0].id);
      } else if (!scenesRef.current[0]) {
        setCurrentSceneId(null);
      }
    }, [currentSceneId]);
  
    const pauseAnimation = useCallback(() => {
      console.log("पॉज़ पर क्लिक किया गया।");
      setIsPlaying(false);
      setIsPlayingAllScenes(false);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }, []);
  
    const animateFrame = useCallback((currentTime) => {
      const isPlayingCurrent = isPlayingRef.current;
      const isPlayingAllScenesCurrent = isPlayingAllScenesRef.current;
      const currentPlayingSceneIndexCurrent = currentPlayingSceneIndexRef.current;
      const scenesCurrent = scenesRef.current;
      const currentSceneCurrent = currentSceneRef.current;
      const playbackSpeedCurrent = playbackSpeedRef.current;
  
      if (!isPlayingCurrent) {
        console.log("animateFrame: एनीमेशन नहीं चल रहा है। लूप रोक रहा है।");
        return;
      }
  
      const currentSceneToPlay = isPlayingAllScenesCurrent ? scenesCurrent[currentPlayingSceneIndexCurrent] : currentSceneCurrent;
  
      if (!currentSceneToPlay) {
        console.error("animateFrame: currentSceneToPlay अपरिभाषित है। एनीमेशन रोक रहा है।");
        stopAnimation();
        return;
      }
  
      const currentKeyframes = currentSceneToPlay.keyframes || [];
      const numKeyframes = currentKeyframes.length;
  
      if (numKeyframes < 2) {
        if (numKeyframes === 1) {
          updateCurrentScene({ placedCharacters: currentKeyframes[0].characters.map(char => ({ ...char })) });
          setCurrentFrameIndex(0);
        }
        console.log(`animateFrame: सीन ${currentSceneToPlay.name} में एनीमेशन के लिए पर्याप्त कीफ्रेम नहीं हैं। रोक रहा है।`);
        stopAnimation();
        return;
      }
  
      const effectiveFrameDuration = frameDuration / playbackSpeedCurrent;
      const totalSceneDuration = (numKeyframes - 1) * effectiveFrameDuration;
  
      let elapsed = currentTime - animationStartTimeRef.current;
      if (elapsed < 0) {
          console.warn("animateFrame: बीता हुआ समय नकारात्मक है। एनीमेशन शुरू होने के समय को रीसेट कर रहा है।");
          animationStartTimeRef.current = currentTime;
          animationFrameIdRef.current = requestAnimationFrame(animateFrameRef.current);
          return;
      }
  
      let interpolatedCharacters;
      let newFrameIndex;
  
      if (elapsed >= totalSceneDuration) {
        interpolatedCharacters = (currentKeyframes[numKeyframes - 1].characters || []).map(char => ({ ...char }));
        newFrameIndex = numKeyframes - 1;
  
        updateCurrentScene({ placedCharacters: interpolatedCharacters });
        setCurrentFrameIndex(newFrameIndex);
  
        if (isPlayingAllScenesCurrent) {
          const nextSceneIdx = currentPlayingSceneIndexRef.current + 1;
          if (nextSceneIdx < scenesCurrent.length) {
            setCurrentPlayingSceneIndex(nextSceneIdx);
            setCurrentSceneId(scenesCurrent[nextSceneIdx].id);
            animationStartTimeRef.current = performance.now();
          } else {
            console.log("animateFrame: सभी सीन का एनीमेशन समाप्त हो गया।");
            stopAnimation();
          }
        } else {
          console.log("animateFrame: एकल सीन एनीमेशन समाप्त हो गया।");
          stopAnimation();
        }
        return;
      }
  
      const currentSegmentIndex = Math.floor(elapsed / effectiveFrameDuration);
      const startKeyframeIndex = Math.min(currentSegmentIndex, numKeyframes - 2);
      const t = (elapsed % effectiveFrameDuration) / effectiveFrameDuration;
      const startKeyframe = currentKeyframes[startKeyframeIndex];
      const endKeyframe = currentKeyframes[startKeyframeIndex + 1];
  
      if (!startKeyframe || !endKeyframe) {
        console.error("animateFrame: Interpolation के लिए अप्रत्याशित रूप से कीफ्रेम गायब है। एनीमेशन रोक रहा है।", { startKeyframe, endKeyframe, currentSegmentIndex, numKeyframes });
        stopAnimation();
        return;
      }
  
      // कैरेक्टर की स्थिति और Rive 'action' को interpolate करें
      interpolatedCharacters = (startKeyframe.characters || []).map(startChar => {
        const endChar = (endKeyframe.characters || []).find(ec => ec.instanceId === startChar.instanceId);
  
        if (!endChar) {
          return startChar;
        }
  
        return {
          ...startChar,
          x: lerp(startChar.x, endChar.x, t),
          y: lerp(startChar.y, endChar.y, t),
          rotation: lerp(startChar.rotation, endChar.rotation, t),
          scale: lerp(startChar.scale, endChar.scale, t),
          // Rive 'action' को इंटरपोलेट नहीं किया जाता है, बल्कि यह कीफ्रेम के साथ बदलता है।
          // इसलिए, हम वर्तमान सेगमेंट के startKeyframe से action का उपयोग करते हैं।
          action: startChar.action,
        };
      });
  
      (endKeyframe.characters || []).forEach(endChar => {
          if (!(startKeyframe.characters || []).some(sc => sc.instanceId === endChar.instanceId)) {
              interpolatedCharacters.push(endChar);
          }
      });
  
      newFrameIndex = currentSegmentIndex;
  
      updateCurrentScene({ placedCharacters: interpolatedCharacters });
      setCurrentFrameIndex(newFrameIndex);
      animationFrameIdRef.current = requestAnimationFrame(animateFrameRef.current);
    }, [stopAnimation, updateCurrentScene, frameDuration, lerp, setCurrentFrameIndex, setCurrentPlayingSceneIndex, setCurrentSceneId, playbackSpeed]);
  
    const animateFrameRef = useRef(animateFrame);
    useEffect(() => {
      animateFrameRef.current = animateFrame;
    }, [animateFrame]);
  
    const playAnimation = useCallback(() => {
      console.log("प्ले (वर्तमान सीन) पर क्लिक किया गया।");
      if (!currentScene || (currentScene.keyframes || []).length < 2) {
        setModalMessage('एनीमेशन चलाने के लिए कम से कम 2 कीफ्रेम जोड़ें।');
        return;
      }
      // एनीमेशन शुरू करने से पहले पहले कीफ्रेम पर जाएँ
      // goToKeyframe(0);
      setIsPlaying(true);
      setIsPlayingAllScenes(false);
      setCurrentFrameIndex(0);
      animationStartTimeRef.current = performance.now();
      if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
      }
      animationFrameIdRef.current = requestAnimationFrame(animateFrameRef.current);
      console.log("playAnimation: एनीमेशन लूप का अनुरोध किया गया।");
    }, [currentScene, animateFrameRef]);
  
    const playAllScenes = useCallback(() => {
      console.log("सभी सीन चलाएँ पर क्लिक किया गया।");
      if (scenesRef.current.some(scene => (scene.keyframes || []).length < 2)) {
        setModalMessage('सभी सीन में एनीमेशन के लिए कम से कम 2 कीफ्रेम होने चाहिए।');
        return;
      }
      setIsPlayingAllScenes(true);
      setIsPlaying(true);
      setCurrentPlayingSceneIndex(0);
      if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
      }
      setCurrentSceneId(scenesRef.current[0].id);
      console.log("playAllScenes: सीन स्विच और एनीमेशन शुरू करने का अनुरोध किया गया।");
    }, [animateFrameRef]);
  
    useEffect(() => {
      console.log(`useEffect [currentSceneId] सक्रिय हुआ। वर्तमान सीन ID: ${currentSceneId}`);
      setCurrentFrameIndex(0);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
  
      if (selectedCharacterIdRef.current) {
        const charExistsInNewScene = currentSceneRef.current?.placedCharacters.some(c => c.instanceId === selectedCharacterIdRef.current);
        if (!charExistsInNewScene) {
          setSelectedCharacterId(null);
        }
      }
  
      if (isPlayingAllScenesRef.current && currentSceneRef.current && (currentSceneRef.current.keyframes || []).length >= 2) {
        console.log(`नए सीन के लिए एनीमेशन फिर से शुरू हो रहा है: ${currentSceneRef.current.name}`);
        animationStartTimeRef.current = performance.now();
        animationFrameIdRef.current = requestAnimationFrame(animateFrameRef.current);
      } else if (isPlayingAllScenesRef.current && currentSceneRef.current && (currentSceneRef.current.keyframes || []).length < 2) {
          console.warn(`सीन ${currentSceneRef.current.name} में एनीमेशन के लिए पर्याप्त कीफ्रेम नहीं हैं। सभी सीन चलाएँ बंद कर रहा है।`);
          stopAnimation();
      }
    }, [currentSceneId, stopAnimation, animateFrameRef]);
  
    useEffect(() => {
      console.log(`useEffect [isPlaying, currentScene] सक्रिय हुआ। isPlaying: ${isPlaying}`);
      if (isPlaying && currentSceneRef.current && (currentSceneRef.current.keyframes || []).length >= 2) {
        if (!animationFrameIdRef.current) {
          animationStartTimeRef.current = performance.now();
          animationFrameIdRef.current = requestAnimationFrame(animateFrameRef.current);
          console.log("isPlaying useEffect द्वारा एनीमेशन लूप शुरू किया गया।");
        }
      } else if (!isPlaying && animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
        console.log("isPlaying useEffect द्वारा एनीमेशन लूप रोक दिया गया।");
      }
    }, [isPlaying, animateFrameRef]);
  
    const addCharacterToCanvas = (charData) => {
      const newCharacter = {
        instanceId: `char-${nextCharId}`,
        type: charData.type,
        x: 50,
        y: 50,
        rotation: 0,
        scale: 1,
        riveSrc: charData.riveSrc,
        artboard: charData.artboard,
        stateMachine: charData.stateMachine,
        // Rive ViewModel के लिए 'action' को डिफ़ॉल्ट रूप से 'idle' पर सेट करें
        action: charData.type === 'rive' ? 'idle' : null,
        svg: charData.svg,
      };
      updateCurrentScene({ placedCharacters: [...(currentScene?.placedCharacters || []), newCharacter] });
      setNextCharId((prev) => prev + 1);
      setSelectedCharacterId(newCharacter.instanceId);
    };
  
    const handleMouseDown = (e, instanceId) => {
      e.stopPropagation();
      console.log("****************", instanceId)
      // if (isPlayingRef.current || isPlayingAllScenesRef.current) return;
      setSelectedCharacterId(instanceId);
      setActiveCharacterId(instanceId);
      setAudioUrl(null);
      const charRect = e.currentTarget.getBoundingClientRect();
      setOffset({
        x: e.clientX - charRect.left,
        y: e.clientY - charRect.top,
      });
    };
  
    const handleMouseMove = useCallback((e) => {
      console.log("******")
      if (activeCharacterId === null || !canvasRef.current || isPlayingRef.current || isPlayingAllScenesRef.current) return;
  
      const canvasRect = canvasRef.current.getBoundingClientRect();
      let newX = e.clientX - canvasRect.left - offset.x;
      let newY = e.clientY - canvasRect.top - offset.y;
  
      const characterElement = document.getElementById(activeCharacterId);
      if (characterElement) {
        const charWidth = (characterElement.offsetWidth || 60) * ((currentSceneRef.current?.placedCharacters.find(c => c.instanceId === activeCharacterId)?.scale) || 1);
        const charHeight = (characterElement.offsetHeight || 100) * ((currentSceneRef.current?.placedCharacters.find(c => c.instanceId === activeCharacterId)?.scale) || 1);
  
        newX = Math.max(0, Math.min(newX, canvasRect.width - charWidth));
        newY = Math.max(0, Math.min(newY, canvasRect.height - charHeight));
      }
  
      const updatedChars = (currentSceneRef.current?.placedCharacters || []).map((char) =>
        char.instanceId === activeCharacterId ? { ...char, x: newX, y: newY } : char
      );
      updateCurrentScene({ placedCharacters: updatedChars });
        
    }, [activeCharacterId, offset, updateCurrentScene]);
  
    const handleMouseUp = useCallback(() => {
      setActiveCharacterId(null);
      updateKeyframe(currentFrameIndex);
    }, []);

    useEffect(() => {
        if (!currentScene) return;

        currentScene.placedCharacters.forEach((char) => {
          if (!panValues[char.instanceId]) {
            panValues[char.instanceId] = new Animated.ValueXY({ x: char.x, y: char.y });
          } else {
            // keep Animated in sync if scene changes
            panValues[char.instanceId].setValue({ x: char.x, y: char.y });
          }
        });
}, [currentScene]);

    useEffect(() => {
  if (!currentScene) return;

  const newResponders: { [id: string]: any } = {};

  currentScene.placedCharacters.forEach((char) => {
    newResponders[char.instanceId] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setActiveCharacterId(char.instanceId);
          setSelectedCharacterId(char.instanceId);
          const pos = panValues[char.instanceId];
          panOffsets[char.instanceId] = {
            x: pos.x._value,
            y: pos.y._value,
          };
        },

        onPanResponderMove: (evt, gestureState) => {
          let newX = panOffsets[char.instanceId].x + gestureState.dx;
          let newY = panOffsets[char.instanceId].y + gestureState.dy;

          // get real canvas dimensions
          const canvasWidth = canvasSize.width || 0;
          const canvasHeight = canvasSize.height || 0;

          // character size (scaled)
          const charScale = char.scale || 1;
          const charWidth = 60 * charScale;
          const charHeight = 100 * charScale;

          // ✅ clamp inside canvas
          newX = Math.max(0, Math.min(newX, canvasWidth - charWidth));
          newY = Math.max(0, Math.min(newY, canvasHeight - charHeight));

          panValues[char.instanceId].setValue({ x: newX, y: newY });
        },
        
        onPanResponderRelease: () => {
          // ensure clamp again on release
          const canvasWidth = canvasSize.width || 0;
          const canvasHeight = canvasSize.height || 0;
          const charScale = char.scale || 1;
          const charWidth = 60 * charScale;
          const charHeight = 100 * charScale;

          let finalX = panValues[char.instanceId].x._value;
          let finalY = panValues[char.instanceId].y._value;

          finalX = Math.max(0, Math.min(finalX, canvasWidth - charWidth));
          finalY = Math.max(0, Math.min(finalY, canvasHeight - charHeight));

          // commit to scene
          const updatedChars = (currentSceneRef.current?.placedCharacters || []).map((c) =>
            c.instanceId === char.instanceId ? { ...c, x: finalX, y: finalY } : c
          );
          updateCurrentScene({ placedCharacters: updatedChars });

          // reset Animated value for next drag
          panValues[char.instanceId].setValue({ x: finalX, y: finalY });
        },

      });
  });

  setResponders(newResponders);
}, [currentScene, canvasSize]);


  
//     const panResponder = useRef(
//   PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onPanResponderGrant: (evt, gestureState) => {
//       console.log("-evt", evt)
//       // setActiveCharacterId(char.instanceId);
//       // store initial offsets if needed
//     },
//     onPanResponderMove: (evt, gestureState) => {
//       console.log("&*&*&*&*&*&*&")
//       // if (
//       //   activeCharacterId === null ||
//       //   isPlayingRef.current ||
//       //   isPlayingAllScenesRef.current
//       // ) {
//       //   return;
//       // }

//       let newX = gestureState.moveX - offset.x;
//       let newY = gestureState.moveY - offset.y;
//       // clamp inside canvas bounds
//       const canvasWidth = canvasSize.width;   // you can get with onLayout
//       const canvasHeight = canvasSize.height;

//       const charScale =
//         currentSceneRef.current?.placedCharacters.find(
//           (c) => c.instanceId === activeCharacterId
//         )?.scale || 1;
//       const charWidth = 60 * charScale;
//       const charHeight = 100 * charScale;
//  console.log("()*))()()()(", activeCharacterId)
//       // newX = Math.max(0, Math.min(newX, canvasWidth - charWidth));
//       // newY = Math.max(0, Math.min(newY, canvasHeight - charHeight));
     
//       // update state
//       const updatedChars = (currentSceneRef.current?.placedCharacters || []).map(
//         (c) =>
//           c.instanceId === activeCharacterId ? { ...c, x: newX, y: newY } : c
//       );
//       console.log("00updatedChars", updatedChars)
//       updateCurrentScene({ placedCharacters: updatedChars });
//     },
//     onPanResponderRelease: () => {
//       setActiveCharacterId(null);
//       updateKeyframe(currentFrameIndex);
//     },
//   })
// ).current;


  const isInsideCanvas = (x, y) => {
    // Optional: check if inside your "canvas" area
    const { width, height } = Dimensions.get('window');
    return x >= 0 && y >= 0 && x <= width && y <= height / 2; // Example
  };

   useEffect(() => {
    const handler = (charId) => {
      setSelectedCharacterId(charId);
    };

    // Subscribe to custom event
    const subscription = DeviceEventEmitter.addListener(
      'set-selected-character',
      handler
    );

    return () => {
      // Remove listener
      subscription.remove();
    };
  }, [setSelectedCharacterId]);
  
    const deleteCharacter = (instanceId) => {
      setScenes(prevScenes => prevScenes.map(scene => {
        if (scene.id === currentSceneId) {
          const updatedChars = (scene.placedCharacters || []).filter((char) => char.instanceId !== instanceId);
          const updatedKeyframes = (scene.keyframes || []).map((frame) => ({
            ...frame,
            characters: (frame.characters || []).filter((char) => char.instanceId !== instanceId),
          }));
          return { ...scene, placedCharacters: updatedChars, keyframes: updatedKeyframes };
        }
        return scene;
      }));
      if (selectedCharacterId === instanceId) {
        setSelectedCharacterId(null);
        setAudioUrl(null);
      }
    };
  
    const rotateCharacter = (instanceId, degrees) => {
      updateCurrentScene({
        placedCharacters: (currentScene?.placedCharacters || []).map((char) =>
          char.instanceId === instanceId
            ? { ...char, rotation: (char.rotation + degrees) % 360 }
            : char
        ),
      });
      updateKeyframe(currentFrameIndex);
    };
  
    const scaleCharacter = (instanceId, factor) => {
      updateCurrentScene({
        placedCharacters: (currentScene?.placedCharacters || []).map((char) =>
          char.instanceId === instanceId
            ? { ...char, scale: Math.max(0.1, char.scale * factor) }
            : char
        ),
      });
      updateKeyframe(currentFrameIndex);
    };
  
    // Rive ViewModel 'action' स्ट्रिंग को अपडेट करने का नया फ़ंक्शन
    const updateRiveAction = (instanceId, newAction) => {
      setScenes(prevScenes => {
        return prevScenes.map(scene => {
          if (scene.id !== currentSceneId) return scene;
    
          const updatedCharacters = (scene.placedCharacters || []).map((char) => {
            if (char.instanceId === instanceId && char.type === 'rive') {
              return { ...char, action: newAction };
            }
            return char;
          });
    
          // ✅ Immediately update keyframe with the new characters
          updateKeyframeWithCharacters(updatedCharacters);
    
          return {
            ...scene,
            placedCharacters: updatedCharacters,
          };
        });
      });
    };

    const makePanResponder = (instanceId: string) => {
    let startX = 0, startY = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedCharacterId(instanceId);
        const c = currentScene?.placedCharacters.find((p) => p.instanceId === instanceId);
        if (c) {
          startX = c.x;
          startY = c.y;
        }
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (!currentScene) return;
        updateCurrentScene({
          placedCharacters: currentScene.placedCharacters.map((c) =>
            c.instanceId === instanceId ? { ...c, x: startX + gesture.dx, y: startY + gesture.dy } : c
          ),
        });
      },
      onPanResponderRelease: () => {},
    });
  };
    
    // ✅ Helper function to update keyframe with custom character list
    const updateKeyframeWithCharacters = (newCharacters) => {
      setScenes(prevScenes =>
        prevScenes.map(scene => {
          if (scene.id === currentSceneId && scene.keyframes?.[currentFrameIndex]) {
            const updatedKeyframes = scene.keyframes.map((kf, idx) =>
              idx === currentFrameIndex
                ? { ...kf, characters: newCharacters.map(c => ({ ...c })) }
                : kf
            );
            return { ...scene, keyframes: updatedKeyframes };
          }
          return scene;
        })
      );
    };
  
    const addScene = () => {
      const newSceneId = `scene-${nextSceneId}`;
      const newScene = {
        id: newSceneId,
        name: `सीन ${nextSceneId}`,
        background: backgrounds[0],
        placedCharacters: [],
        keyframes: [],
      };
      setScenes((prev) => [...prev, newScene]);
      setCurrentSceneId(newSceneId);
      setNextCharId((prev) => prev + 1);
    };
  
    const deleteScene = (sceneIdToDelete) => {
      if (scenes.length === 1) {
        setModalMessage('आप अंतिम सीन को डिलीट नहीं कर सकते।');
        return;
      }
      setScenes((prevScenes) => {
        const filteredScenes = prevScenes.filter((scene) => scene.id !== sceneIdToDelete);
        if (currentSceneId === sceneIdToDelete) {
          setCurrentSceneId(filteredScenes[0].id);
        }
        return filteredScenes;
      });
    };
  
    const switchScene = (sceneId) => {
      console.log(`सीन पर स्विच कर रहा है: ${sceneId}`);
      setCurrentSceneId(sceneId);
    };
  
    const addKeyframe = () => {
      // Rive कैरेक्टर के लिए वर्तमान 'action' को keyframe में सेव करें
      const newKeyframe = {
        frameIndex: (currentScene?.keyframes || []).length,
        characters: (currentScene?.placedCharacters || []).map(char => ({
          instanceId: char.instanceId,
          type: char.type,
          x: char.x,
          y: char.y,
          rotation: char.rotation,
          scale: char.scale,
          svg: char.svg,
          riveSrc: char.riveSrc,
          artboard: char.artboard,
          stateMachine: char.stateMachine,
          action: char.action, // <-- Rive animation action को सेव करें
        })),
      };
      updateCurrentScene({ keyframes: [...(currentScene?.keyframes || []), newKeyframe] });
      setCurrentFrameIndex((currentScene?.keyframes || []).length);
    };
  console.log("--------- frame index", currentFrameIndex)
    const goToKeyframe = useCallback((index) => {
      // Set current frame index
      setCurrentFrameIndex(index);
      setScenes(prevScenes => {
        return prevScenes.map(scene => {
          if (scene.id !== currentSceneId) return scene;
    
          if (!scene.keyframes || !scene.keyframes[index]) {
            console.warn("Keyframe not found at index:", index);
            return scene;
          }
    
          const keyframe = scene.keyframes[index];
    
          // Update placedCharacters directly from keyframe
          return {
            ...scene,
            placedCharacters: keyframe.characters.map(c => ({ ...c }))
          };
        });
      });
    }, [currentSceneId]);
  
    const deleteKeyframe = (indexToDelete) => {
      setScenes(prevScenes => prevScenes.map(scene => {
        if (scene.id === currentSceneId) {
          const updatedKeyframes = (scene.keyframes || []).filter((_, idx) => idx !== indexToDelete)
                                       .map((frame, idx) => ({ ...frame, frameIndex: idx }));
          const newPlacedCharacters = (currentFrameIndex === indexToDelete && updatedKeyframes.length > 0)
                                      ? updatedKeyframes[Math.max(0, indexToDelete - 1)].characters.map(char => ({...char}))
                                      : (scene.placedCharacters || []);
          return { ...scene, placedCharacters: newPlacedCharacters, keyframes: updatedKeyframes };
        }
        return scene;
      }));
  
      if (currentFrameIndex >= indexToDelete && currentFrameIndex > 0) {
        setCurrentFrameIndex(currentFrameIndex - 1);
      } else if ((currentScene?.keyframes || []).length === 1 && indexToDelete === 0) {
        setCurrentFrameIndex(0);
      }
    };
  
    const updateKeyframe = (indexToUpdate) => {
      if (currentScene?.keyframes && currentScene.keyframes[indexToUpdate]) {
        // मौजूदा कैरेक्टर की स्थिति और Rive 'action' के साथ keyframe को अपडेट करें
        updateCurrentScene({
          keyframes: (currentScene.keyframes || []).map((frame, idx) =>
            idx === indexToUpdate ? { ...frame, characters: (currentScene.placedCharacters || []).map(char => ({ ...char })) } : frame
          ),
        });
      }
    };
  
    const selectedCharacter = currentScene?.placedCharacters.find(
      (char) => char.instanceId === selectedCharacterId
    );
  
    const handleAudioFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setAudioFile(file);
        const url = URL.createObjectURL(file);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(url);
      } else {
        setAudioFile(null);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
      }
    };
  
    const playAudio = () => {
      if (audioRef.current && audioUrl) {
        audioRef.current.play();
      }
    };

   const toggleMic = (id) => {
  setActiveMicCharacterId(prev => prev === id ? null : id);
};

  const handleTogglePreview = () => {
    const newPreviewState = !isPreviewMode;
    setIsPreviewMode(newPreviewState);
  
    // If turning ON preview, play the clip
    if (newPreviewState && audioRef.current?.playFullClip) {
      audioRef.current.playFullClip();  // call internxal method
    }
  };

  return (
    <SafeAreaView style={styles.root}>
       <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      {/* Side panel (compact) */}
      <View style={styles.side}>
        <Text style={styles.h2}>कैरेक्टर चुनें</Text>
        <View style={styles.grid}>
          {characters.map((char) => (
            <TouchableOpacity key={char.id} style={styles.card} onPress={() => addCharacterToCanvas(char)}>
              <View style={styles.iconBox}>
                {char.type === "rive" ? (
                  <Svg width="60" height="100" viewBox="0 0 60 100">
                    <Rect x="10" y="10" width="40" height="80" fill="#ADD8E6" stroke="#333" strokeWidth="2" />
                    <Path d="M20 30 L30 20 L40 30 L30 40 Z" fill="#333" />
                    <SvgText x="30" y="65" fontSize="10" textAnchor="middle" fill="#333">Rive</SvgText>
                  </Svg>
                ) : (
                  <Text>SVG</Text>
                )}
              </View>
              <Text style={styles.cardLabel}>{char.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.h2, { marginTop: 12 }]}>बैकग्राउंड चुनें</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {backgrounds.map((bg) => {
            const active = currentScene?.background.id === bg.id;
            return (
              <TouchableOpacity
                key={bg.id}
                style={[styles.bgCard, active && { borderColor: "#3b82f6", backgroundColor: "#eff6ff" }]}
                onPress={() => updateCurrentScene({ background: bg })}
              >
                <Image source={{ uri: bg.image }} style={styles.bgImg} />
                <Text style={styles.cardLabel}>{bg.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Scenes */}
        <Text style={[styles.h3, { marginTop: 8 }]}>सीन कंट्रोल</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {scenes.map((scene) => (
            <TouchableOpacity
              key={scene.id}
              style={[styles.sceneBtn, currentSceneId === scene.id && styles.sceneBtnActive]}
              onPress={() => switchScene(scene.id)}
            >
              <Text style={[styles.sceneBtnText, currentSceneId === scene.id && { color: "white" }]}>{scene.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={[styles.action, { backgroundColor: "#2563eb" }]} onPress={addScene}>
            <Text style={styles.actionText}>नया सीन जोड़ें</Text>
          </TouchableOpacity>
          {scenes.length > 1 && (
            <TouchableOpacity style={[styles.action, { backgroundColor: "#dc2626" }]} onPress={() => deleteScene(currentSceneId)}>
              <Text style={styles.actionText}>वर्तमान सीन डिलीट करें</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected character controls */}
        {selectedCharacter && (
          <View style={styles.selectedPanel}>
            <Text style={styles.h3}>चयनित कैरेक्टर</Text>
            <Text style={styles.meta}>ID: {selectedCharacter.instanceId}</Text>
            <View style={styles.rowWrap}>
              <TinyBtn label="डिलीट" color="#ef4444" onPress={() => deleteCharacter(selectedCharacter.instanceId)} />
              <TinyBtn label="घुमाएँ (दाएँ)" color="#9333ea" onPress={() => rotateCharacter(selectedCharacter.instanceId, 45)} />
              <TinyBtn label="घुमाएँ (बाएँ)" color="#9333ea" onPress={() => rotateCharacter(selectedCharacter.instanceId, -45)} />
              <TinyBtn label="बड़ा करें" color="#10b981" onPress={() => scaleCharacter(selectedCharacter.instanceId, 1.1)} />
              <TinyBtn label="छोटा करें" color="#f59e0b" onPress={() => scaleCharacter(selectedCharacter.instanceId, 0.9)} />
            </View>

            {selectedCharacter.type === "rive" && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.h4, { color: "#2563eb" }]}>एक्शन</Text>
                <View style={styles.rowWrap}>
                  <Pill
                    active={selectedCharacter.action === "walk"}
                    label="चलना (Walk)"
                    onPress={() => updateRiveAction(selectedCharacter.instanceId, "walk")}
                  />
                  <Pill
                    active={selectedCharacter.action === "talk"}
                    label="बात करना (Talk)"
                    onPress={() => updateRiveAction(selectedCharacter.instanceId, "talk")}
                  />
                  <Pill
                    active={selectedCharacter.action === "idle"}
                    label="आइडल (Idle)"
                    onPress={() => updateRiveAction(selectedCharacter.instanceId, "idle")}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        <Text style={styles.footerNote}>यह एक प्रोटोटाइप है — वीडियो एक्सपोर्ट शामिल नहीं है।</Text>
      </View>

      {/* Main area: Canvas + Timeline */}
      <View style={styles.main}
      
      style={{ flex: 1, backgroundColor: "#eee" }}
      // {...panResponder.panHandlers}
      
      >
        <Text style={styles.title}>अपनी कार्टून मूवी बनाएँ!</Text>

        <TouchableOpacity
        ref={canvasRef}
          activeOpacity={1}
          onStartShouldSetResponder={(evt) => {
              // if user taps canvas background (not a character), clear selection
              if (evt.target === canvasRef.current) {
                setSelectedCharacterId(null);
              }
              return false; // don’t block children
            }}
          style={styles.canvasTapper}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasSize({ width, height });
        }}
        >
          <ImageBackground
            source={{ uri: currentScene?.background.image }}
            resizeMode="cover"
            imageStyle={styles.canvasBgInner}
            style={styles.canvas}
          >
            {currentScene?.placedCharacters.map((char) => {
              const pan = makePanResponder(char.instanceId);
              const selected = selectedCharacterId === char.instanceId;
              return (
                <Animated.View
                  key={char.instanceId}
                  {...(responders[char.instanceId]?.panHandlers || {})}
                  style={[
                      styles.characterWrap,
                      {
                        transform: [
                          { translateX: panValues[char.instanceId]?.x || 0 },
                          { translateY: panValues[char.instanceId]?.y || 0 },
                          { rotate: `${char.rotation}deg` },
                          { scale: char.scale },
                        ],
                        zIndex: selectedCharacterId === char.instanceId ? 1000 : 1, // ✅ bring selected on top
                        elevation: selectedCharacterId === char.instanceId ? 1000 : 1, // ✅ for Android shadow order
                      },
                      selectedCharacterId === char.instanceId && styles.selectedCharacter,
                    ]}
                >
                  <TouchableOpacity
                    onPress={() => toggleMic(char.instanceId)}
                    style={[
                      styles.micBtn,
                      activeMicCharacterId === char.instanceId && { borderColor: "#ef4444" },
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>{activeMicCharacterId === char.instanceId ? "🎤" : "🎙️"}</Text>
                  </TouchableOpacity>

                  {char.type === "rive" ? (
                    // Replace this stub with rive-react-native <Rive /> using your artboard/state machine
                    <View pointerEvents="none">
                      <InteractiveRiveCharacter pointerEvents="none"  ref={riveRef} character={char} action={char.action} frameIndex={currentFrameIndex} />
                    </View>
                  ) : (
                    <SvgXml pointerEvents="none"  xml={char.svg || SAMPLE_SVG} width="100%" height="100%"
                    style={{ backgroundColor: "transparent" }} />
                  )}
                </Animated.View>
              );
            })}
          </ImageBackground>
        </TouchableOpacity>

        <Text style={styles.helper}>कैरेक्टर को ड्रैग करके कैनवास पर रखें!</Text>
        <Text style={styles.helperSmall}>कैरेक्टर पर टैप करके सेलेक्ट करें और कंट्रोल करें।</Text>

        {/* Timeline controls */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>टाइमलाइन कंट्रोल</Text>

          <View style={styles.row}>
            <BigBtn label="कीफ्रेम जोड़ें" color="#2563eb" disabled={isPlaying || isPlayingAllScenes} onPress={addKeyframe} />
            <BigBtn label="प्ले (वर्तमान सीन)" color="#16a34a" disabled={isPlaying || isPlayingAllScenes || (currentScene?.keyframes.length ?? 0) < 2} onPress={playAnimation} />
            <BigBtn label="सभी सीन प्ले करें" color="#4f46e5" disabled={isPlaying || isPlayingAllScenes || scenes.some(s => (s.keyframes.length) < 2)} onPress={playAllScenes} />
            <BigBtn label="पॉज" color="#ca8a04" disabled={!isPlaying && !isPlayingAllScenes} onPress={pauseAnimation} />
            <BigBtn label="स्टॉप" color="#dc2626" onPress={stopAnimation} />
          </View>

          <View style={{ width: "100%", marginVertical: 8 }}>
            <Text style={styles.sliderLabel}>
              प्लेबैक स्पीड: <Text style={{ fontWeight: "700" }}>{playbackSpeed.toFixed(1)}x</Text>
            </Text>
            {/* <Slider
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={playbackSpeed}
              onValueChange={setPlaybackSpeed}
            /> */}
          </View>

          <View style={[styles.row, { alignItems: "center" }]}>
            <SmallBtn
              label="पिछला"
              onPress={() => goToKeyframe(Math.max(0, currentFrameIndex - 1))}
              disabled={currentFrameIndex === 0 || isPlaying || isPlayingAllScenes}
            />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              {/* <Slider
                minimumValue={0}
                maximumValue={Math.max(0, (currentScene?.keyframes.length ?? 1) - 1)}
                step={1}
                value={currentFrameIndex}
                onValueChange={(v) => goToKeyframe(Math.round(v))}
                disabled={isPlaying || isPlayingAllScenes}
              /> */}
            </View>
            <SmallBtn
              label="अगला"
              onPress={() =>
                goToKeyframe(
                  Math.min(
                    (currentScene?.keyframes.length ?? 1) - 1,
                    currentFrameIndex + 1
                  )
                )
              }
              disabled={
                currentFrameIndex === ((currentScene?.keyframes.length ?? 1) - 1) ||
                (currentScene?.keyframes.length ?? 0) === 0 ||
                isPlaying || isPlayingAllScenes
              }
            />
          </View>

          <Text style={styles.kfMeta}>
            कीफ्रेम: {currentScene ? Math.min(currentFrameIndex + 1, Math.max(1, currentScene.keyframes.length)) : 0} / {currentScene?.keyframes.length ?? 0}
          </Text>
          {(currentScene?.keyframes.length ?? 0) < 2 && (
            <Text style={styles.warn}>एनीमेशन चलाने के लिए कम से कम 2 कीफ्रेम जोड़ें।</Text>
          )}

          {(currentScene?.keyframes.length ?? 0) > 0 && (
            <View style={{ width: "100%", marginTop: 12 }}>
              <Text style={styles.h3}>कीफ्रेम लिस्ट</Text>
              <View style={styles.kfRow}>
                {currentScene?.keyframes.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.kfPill,
                      currentFrameIndex === idx && { backgroundColor: "#6366f1" },
                    ]}
                    onPress={() => goToKeyframe(idx)}
                    disabled={isPlaying || isPlayingAllScenes}
                  >
                    <Text
                      style={[
                        styles.kfPillText,
                        currentFrameIndex === idx && { color: "white" },
                      ]}
                    >
                      फ्रेम {idx + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.rowWrap}>
                <TinyBtn
                  label="सेलेक्टेड कीफ्रेम डिलीट करें"
                  color="#ef4444"
                  onPress={() => deleteKeyframe(currentFrameIndex)}
                  disabled={isPlaying || isPlayingAllScenes || (currentScene?.keyframes.length ?? 0) === 0}
                />
                <TinyBtn
                  label="सेलेक्टेड कीफ्रेम अपडेट करें"
                  color="#f59e0b"
                  onPress={() => updateKeyframe(currentFrameIndex)}
                  disabled={isPlaying || isPlayingAllScenes || (currentScene?.keyframes.length ?? 0) === 0}
                />
                <TinyBtn
                  label={isPreviewMode ? "Exit Preview" : "Preview Clip"}
                  color="#334155"
                  onPress={handleTogglePreview}
                />
              </View>
            </View>
          )}
        </View>

          <View style={{ width: "100%" }}>
          {/* <AudioTimeline
            ref={audioRef}
            url={audioUrl} // pass your current audio URL/path
            addKeyframe={addKeyframe}
            goToKeyframe={goToKeyframe}
            activeMicCharacterId={activeMicCharacterId}
            characters={currentScene?.placedCharacters || []}
            isPreviewMode={isPreviewMode}
            currentFrameIndex={currentFrameIndex}
            keyframeCount={(currentScene?.keyframes || []).length || 0}
          /> */}
        </View>
        {/* Audio Timeline placeholder wired to your props API */}
        <AudioTimeline
          addKeyframe={addKeyframe}
          goToKeyframe={goToKeyframe}
          activeMicCharacterId={activeMicCharacterId}
          characters={characters}
          isPreviewMode={isPreviewMode}
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function BigBtn({
  label,
  color,
  disabled,
  onPress,
}: {
  label: string;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.bigBtn,
        { backgroundColor: color },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={styles.bigBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SmallBtn({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.smallBtn, disabled && { opacity: 0.5 }]}
    >
      <Text style={styles.smallBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TinyBtn({
  label,
  color,
  onPress,
  disabled,
}: {
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.tinyBtn, { backgroundColor: color }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.tinyBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        active ? { backgroundColor: "#10b981" } : { backgroundColor: "#e5e7eb" },
      ]}
    >
      <Text style={[styles.pillText, active && { color: "white" }]}>{label}</Text>
    </TouchableOpacity>
  );
}



const styles = StyleSheet.create({
  root: { flexDirection: "column",   // 👈 stack vertically
  backgroundColor: "#f3f4f6",
  flex: 1,   },

  side: {  
     width: "100%", 
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
   },
  main: { 
   flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center", // center vertically
    backgroundColor: "#f9fafb",
    },

  h2: { fontSize: 18, fontWeight: "800", color: "#1d4ed8", marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: "700", color: "#1d4ed8", marginBottom: 6 },
  h4: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, color: "#475569" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { width: "47%", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 8, alignItems: "center" },
  cardLabel: { marginTop: 4, fontSize: 12, fontWeight: "600" },
  iconBox: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },

  bgCard: { borderWidth: 2, borderColor: "#e5e7eb", padding: 6, borderRadius: 10, marginRight: 8, alignItems: "center", backgroundColor: "white" },
  bgImg: { width: 120, height: 70, borderRadius: 8, marginBottom: 6 },

  sceneBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#e5e7eb", borderRadius: 8, marginRight: 6, marginBottom: 6 },
  sceneBtnActive: { backgroundColor: "#3b82f6" },
  sceneBtnText: { fontSize: 12, fontWeight: "700", color: "#374151" },

  selectedCharacter: {
  borderWidth: 2,
  borderColor: "#3b82f6", // blue highlight
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 4,
},

  action: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  actionText: { color: "white", fontWeight: "700", fontSize: 12 },

  selectedPanel: { marginTop: 12, padding: 10, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },

  footerNote: { marginTop: "auto", fontSize: 12, color: "#6b7280" },

  title: { 
    fontSize: 20,
  fontWeight: "bold",
  color: "#16a34a",          // green-700
  marginBottom: 16,
   },

  canvasTapper: { width: "100%" },
  canvas: {
    // width: "100%",
    // height: 380, // ~ h-96
    // borderWidth: 4,
    // borderColor: "#93c5fd",
    // borderRadius: 16,
    // overflow: "hidden",
    // shadowColor: "#000",
    // shadowOpacity: 0.2,
    // shadowRadius: 12,
    // elevation: 3,

      width: "100%",
  height: 380, // or whatever size you want
  borderWidth: 4,
  borderColor: "#93c5fd",
  borderRadius: 16,
  overflow: "hidden",
  },
  canvasBgInner: { borderRadius: 12 },

  characterWrap: {
    position: "absolute",
    width: 100,
    height: 100,
    // backgroundColor: "white",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  micBtn: {
    position: "absolute",
    top: -14,
    left: "50%",
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  riveStub: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  helper: { marginTop: 8, fontSize: 16, color: "#475569" },
  helperSmall: { fontSize: 12, color: "#6b7280" },

  timelineCard: {
    marginTop: 16,
    width: "100%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    alignItems: "center",
  },
  timelineTitle: { fontSize: 20, fontWeight: "800", color: "#1d4ed8", marginBottom: 10 },

  row: { flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" },

  bigBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  bigBtnText: { color: "white", fontWeight: "800", fontSize: 13 },

  sliderLabel: { textAlign: "center", fontSize: 12, color: "#334155", marginBottom: 6 },

  smallBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "#e5e7eb", borderRadius: 8 },
  smallBtnText: { fontWeight: "700", color: "#1f2937" },

  kfMeta: { marginTop: 6, fontSize: 12, color: "#475569" },
  warn: { marginTop: 6, fontSize: 12, color: "#ef4444" },

  kfRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  kfPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#e5e7eb" },
  kfPillText: { fontSize: 12, fontWeight: "700", color: "#374151" },

  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "700", color: "#111827" },

  tinyBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  tinyBtnText: { color: "white", fontWeight: "700", fontSize: 12 },

  audioCard: {
    marginTop: 16,
    width: "100%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});