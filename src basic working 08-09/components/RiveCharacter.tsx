import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Rive, { RiveRef } from 'rive-react-native';

interface RiveCharacterProps {
  riveFile: string;
  animationName?: string;
  stateMachineName?: string;
  width: number;
  height: number;
  scale?: number;
  rotation?: number;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

export default function RiveCharacter({
  riveFile,
  animationName="walk",
  stateMachineName,
  width,
  height,
  scale = 1,
  rotation = 0,
  isPlaying = false,
  onPlay,
  onPause,
  onStop,
}: RiveCharacterProps) {
  const riveRef = useRef<RiveRef>(null);

//   useEffect(() => {
//     if (riveRef.current) {
//       if (isPlaying) {
//         riveRef.current.play(animationName);
//         onPlay?.();
//       } else {
//         riveRef.current.pause();
//         onPause?.();
//       }
//     }
//   }, [isPlaying, animationName]);


  

  const playAnimation = (animation: string) => {
    if (riveRef.current) {
      riveRef.current.play(animation);
    }
  };

  const pauseAnimation = () => {
    if (riveRef.current) {
      riveRef.current.pause();
    }
  };

  const stopAnimation = () => {
    if (riveRef.current) {
      riveRef.current.stop();
      onStop?.();
    }
  };

  return (
    <View style={[
      styles.container,
      {
        width,
        height,
        transform: [
          { scale },
          { rotate: `${rotation}deg` }
        ]
      }
    ]}>
      <Rive
        ref={riveRef}
        resourceName={riveFile}
        animationName={animationName}
        autoplay={true}
        stateMachineName={stateMachineName}
        // style={styles.rive}
        onPlay={onPlay}
        onPause={onPause}
        onStop={onStop}
        style={{width: 100, height: 100}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rive: {
    width: '100%',
    height: '100%',
  },
});