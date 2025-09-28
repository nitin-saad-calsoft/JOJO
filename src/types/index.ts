export interface AudioFile {
  _id: string;
  name: string;
  filename: string;
  originalName: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  category: 'background' | 'effect' | 'voice' | 'music';
  tags: string[];
  description: string;
  isActive: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  downloadCount: number;
  metadata: {
    bitrate?: string;
    sampleRate?: string;
    channels?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Background {
  _id: string;
  name: string;
  type: 'image' | 'color' | 'gradient';
  filename?: string;
  originalName?: string;
  fileSize?: number;
  mimeType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  colorData?: {
    primary: string;
    secondary?: string;
    direction?: string;
  };
  category: 'nature' | 'urban' | 'fantasy' | 'space' | 'abstract' | 'solid';
  tags: string[];
  description: string;
  isActive: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  _id: string;
  name: string;
  type: 'rive' | 'static' | 'sprite';
  category: 'fantasy' | 'sci-fi' | 'modern' | 'cartoon' | 'animal';
  riveFile?: {
    filename: string;
    originalName: string;
    fileSize: number;
  };
  animations: Array<{
    name: string;
    description: string;
  }>;
  stateMachines: Array<{
    name: string;
    description: string;
  }>;
  previewImage?: {
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
  };
  spriteSheet?: {
    filename: string;
    originalName: string;
    fileSize: number;
    frames: number;
    frameWidth: number;
    frameHeight: number;
  };
  description: string;
  tags: string[];
  isActive: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  usageCount: number;
  properties: {
    defaultScale: number;
    defaultRotation: number;
    boundingBox?: {
      width: number;
      height: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdMovies: string[];
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}