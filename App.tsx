import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AudioSelectionScreen from './src/screens/AudioSelectionScreen';
import BackgroundSelectionScreen from './src/screens/BackgroundSelectionScreen';
import CharacterSelectionScreen from './src/screens/CharacterSelectionScreen';
import MovieCreationScreen from './src/screens/MovieCreationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Audio"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Audio" component={AudioSelectionScreen} />
          <Stack.Screen name="Background" component={BackgroundSelectionScreen} />
          <Stack.Screen name="Characters" component={CharacterSelectionScreen} />
          <Stack.Screen name="Movie" component={MovieCreationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}