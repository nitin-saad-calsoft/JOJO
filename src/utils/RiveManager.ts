export interface RiveCharacterData {
  id: string;
  name: string;
  riveFile: string;
  animations: string[];
  stateMachines?: string[];
  preview: string;
}

export const RIVE_CHARACTERS: RiveCharacterData[] = [
  {
    id: 'knight',
    name: 'Hero Knight',
    riveFile: 'fifth.riv',
    animations: ['idle', 'walk', 'run', 'attack', 'jump', 'defend'],
    stateMachines: ['combat_state', 'movement_state'],
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 'wizard',
    name: 'Wizard Mage',
    riveFile: 'fifth.riv',
    animations: ['idle', 'cast_spell', 'walk', 'teleport', 'meditate'],
    stateMachines: ['magic_state', 'movement_state'],
    preview: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 'robot',
    name: 'Robot Assistant',
    riveFile: 'fifth.riv',
    animations: ['idle', 'walk', 'work', 'dance', 'malfunction', 'repair'],
    stateMachines: ['work_state', 'entertainment_state'],
    preview: 'https://images.pexels.com/photos/2085831/pexels-photo-2085831.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export class RiveManager {
  private static instance: RiveManager;
  private loadedRiveFiles: Map<string, any> = new Map();

  static getInstance(): RiveManager {
    if (!RiveManager.instance) {
      RiveManager.instance = new RiveManager();
    }
    return RiveManager.instance;
  }

  async loadRiveFile(fileName: string): Promise<any> {
    if (this.loadedRiveFiles.has(fileName)) {
      return this.loadedRiveFiles.get(fileName);
    }

    try {
      // In a real app, you would load the .riv file from assets
      // For now, we'll simulate the loading
      console.log(`Loading Rive file: ${fileName}`);
      
      // Simulate async loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const riveData = {
        fileName,
        loaded: true,
        timestamp: Date.now()
      };
      
      this.loadedRiveFiles.set(fileName, riveData);
      return riveData;
    } catch (error) {
      console.error(`Failed to load Rive file: ${fileName}`, error);
      throw error;
    }
  }

  getRiveCharacter(id: string): RiveCharacterData | undefined {
    return RIVE_CHARACTERS.find(char => char.id === id);
  }

  getAllRiveCharacters(): RiveCharacterData[] {
    return RIVE_CHARACTERS;
  }

  getAvailableAnimations(characterId: string): string[] {
    const character = this.getRiveCharacter(characterId);
    return character?.animations || [];
  }

  getAvailableStateMachines(characterId: string): string[] {
    const character = this.getRiveCharacter(characterId);
    return character?.stateMachines || [];
  }
}

export default RiveManager;