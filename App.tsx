import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import AudioSelectionScreen from './src/screens/AudioSelectionScreen';
import BackgroundSelectionScreen from './src/screens/BackgroundSelectionScreen';
import CharacterSelectionScreen from './src/screens/CharacterSelectionScreen';
import MovieCreationScreen from './src/screens/MovieCreationScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    // You can show a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "Audio" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        {!user ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : null}
        
        {/* Main App Stack - Always available */}
        <Stack.Screen name="Audio" component={AudioSelectionScreen} />
        <Stack.Screen name="Background" component={BackgroundSelectionScreen} />
        <Stack.Screen name="Characters" component={CharacterSelectionScreen} />
        <Stack.Screen name="Movie" component={MovieCreationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}