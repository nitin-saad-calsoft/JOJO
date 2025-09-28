import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import AudioSelectionScreen from './src/screens/AudioSelectionScreen';
import BackgroundSelectionScreen from './src/screens/BackgroundSelectionScreen';
import CharacterSelectionScreen from './src/screens/CharacterSelectionScreen';
import MovieCreationScreen from './src/screens/MovieCreationScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1F2937',
              borderTopColor: '#374151',
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#9CA3AF',
          }}>
          <Tab.Screen
            name="Audio"
            component={AudioSelectionScreen}
            options={{
              tabBarIcon: ({ size, color }) => (
                <Icon name="music-note" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Background"
            component={BackgroundSelectionScreen}
            options={{
              tabBarIcon: ({ size, color }) => (
                <Icon name="image" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Characters"
            component={CharacterSelectionScreen}
            options={{
              tabBarIcon: ({ size, color }) => (
                <Icon name="people" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Movie"
            component={MovieCreationScreen}
            options={{
              tabBarIcon: ({ size, color }) => (
                <Icon name="movie" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}