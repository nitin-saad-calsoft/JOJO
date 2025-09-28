import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface BackgroundItem {
  id: string;
  name: string;
  type: string;
  preview: string;
  color?: string;
}

const backgroundList: BackgroundItem[] = [
  { id: '1', name: 'Forest Scene', type: 'Nature', preview: 'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '2', name: 'City Skyline', type: 'Urban', preview: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '3', name: 'Beach Paradise', type: 'Nature', preview: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '4', name: 'Mountain View', type: 'Nature', preview: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '5', name: 'Space Galaxy', type: 'Fantasy', preview: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: '6', name: 'Solid Blue', type: 'Color', preview: '', color: '#3B82F6' },
  { id: '7', name: 'Solid Green', type: 'Color', preview: '', color: '#10B981' },
  { id: '8', name: 'Solid Purple', type: 'Color', preview: '', color: '#8B5CF6' },
];

export default function BackgroundSelectionScreen({ navigation }: any) {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId);
  };

  const handleContinue = () => {
    if (!selectedBackground) {
      Alert.alert('Selection Required', 'Please select a background to continue.');
      return;
    }
    
    navigation.navigate('Characters');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderBackgroundItem = ({ item }: { item: BackgroundItem }) => (
    <TouchableOpacity
      style={[
        styles.backgroundItem,
        selectedBackground === item.id && styles.selectedBackgroundItem
      ]}
      onPress={() => handleBackgroundSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.backgroundPreview}>
        {item.preview ? (
          <Image
            source={{ uri: item.preview }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.colorPreview, { backgroundColor: item.color }]} />
        )}
        
        {selectedBackground === item.id && (
          <View style={styles.selectedOverlay}>
            <Icon name="check" size={24} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.backgroundInfo}>
        <Text style={styles.backgroundName}>{item.name}</Text>
        <Text style={styles.backgroundType}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Background</Text>
          <Text style={styles.subtitle}>
            Choose a background for your animation scene
          </Text>
        </View>
      </View>

      <FlatList
        data={backgroundList}
        renderItem={renderBackgroundItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.backgroundList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedBackground && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedBackground}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedBackground && styles.disabledButtonText
          ]}>
            Continue to Character Selection
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  backgroundList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  backgroundItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedBackgroundItem: {
    borderColor: '#3B82F6',
  },
  backgroundPreview: {
    height: 120,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  colorPreview: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundInfo: {
    padding: 12,
  },
  backgroundName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  backgroundType: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#D1D5DB',
  },
});