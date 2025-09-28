import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { computeAmplitude } from 'react-native-audio-analyzer';

export default function AudioWaveform() {
  const [amplitudeData, setAmplitudeData] = useState<number[]>([]);

  const analyzeAudio = useCallback(async () => {
    try {
      const result = computeAmplitude(
        'aa.mp3',
        1000 // Number of amplitude samples to generate
      );
      setAmplitudeData(result);
    } catch (error) {
      console.error('Error analyzing audio:', error);
    }
  }, []);

  useEffect(() => {
    analyzeAudio();
  }, [analyzeAudio]);

  return (<ScrollView horizontal contentContainerStyle={styles.container}>
    <View style={styles.waveform}>
      {amplitudeData.map((amplitude, index) => (
        <View key={index} style={styles.barWrapper}>
          <View
            style={[
              styles.bar,
              { height: 400 * amplitude } // scale amplitude
            ]}
          />
        </View>
      ))}
    </View>
  </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',   // center vertically inside ScrollView
    justifyContent: 'center', // center horizontally if needed
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 50, // add vertical breathing space
  },
  barWrapper: {
    justifyContent: 'center', // ensures bar is centered vertically
    alignItems: 'center',
    height: 200, // fixed container height for waveform
    marginHorizontal: 1, // spacing between bars
  },
  bar: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
