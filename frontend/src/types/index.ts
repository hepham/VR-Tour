/**
 * TypeScript type definitions for VR Tours platform
 */

export interface Tour {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  scene_count: number;
  first_scene?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  scenes?: Scene[];
}

export interface Scene {
  id: number;
  tour: number;
  tour_title?: string;
  title: string;
  description: string;
  panorama_image: string;
  voiceover_audio?: string;
  initial_yaw: number;
  initial_pitch: number;
  map_image?: string;
  order: number;
  hotspots?: Hotspot[];
  hotspot_count: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  
  // New extended properties for scene configuration
  default_yaw?: number;
  default_pitch?: number;
  initial_zoom?: number;
  
  // Background audio settings
  background_audio?: string;
  background_audio_file?: File;
  background_audio_volume?: number;
  background_audio_autoplay?: boolean;
  
  // Voiceover audio settings (extended)
  voiceover_audio_file?: File;
  voiceover_audio_volume?: number;
  voiceover_audio_autoplay?: boolean;
  
  // Legacy audio settings (for backwards compatibility)
  audio_volume?: number;
  audio_autoplay?: boolean;
  
  // Text overlay settings
  overlay_text?: string;
  text_position?: string;
  
  // Article settings
  article_title?: string;
  article_content?: string;
  article_url?: string;
  
  navigation_connections?: NavigationConnection[];
  checkpoints?: any[];
}

export interface Hotspot {
  id: number;
  target_scene: number;
  target_scene_title?: string;
  yaw: number;
  pitch: number;
  label?: string;
  size: number;
  color: string;
  is_active: boolean;
}

export interface NavigationData {
  tour: {
    id: number;
    title: string;
    scene_count: number;
  };
  scenes: NavigationScene[];
  connections: NavigationConnection[];
}

export interface NavigationScene {
  id: number;
  title: string;
  order: number;
  initial_yaw: number;
  initial_pitch: number;
  panorama_image?: string;
  map_image?: string;
  voiceover_audio?: string;
}

export interface NavigationConnection {
  id: number;
  from_scene: number;
  to_scene: number;
  yaw: number;
  pitch: number;
  label?: string;
  size: number;
  color: string;
  type?: string; // Hotspot type (map, image, video, article, link, navigation)
  icon?: string; // Emoji icon for the hotspot
  isPreview?: boolean; // Whether this is a preview hotspot from drag & drop
  action_type?: string; // Action type (navigation, image, video, link, info, none) - defaults to 'none'
  url?: string; // URL for link type hotspots
}

export interface CameraPosition {
  yaw: number;
  pitch: number;
}

export interface TourViewerProps {
  tourId: number;
  onBack?: () => void;
}

export interface SceneViewerProps {
  scene: NavigationScene;
  hotspots: NavigationConnection[];
  onSceneChange: (sceneId: number) => void;
  onBack?: () => void;
}

export interface PanoramaViewerProps {
  panoramaUrl: string;
  initialYaw: number;
  initialPitch: number;
  hotspots: NavigationConnection[];
  onHotspotClick: (sceneId: number) => void;
}

export interface HotspotProps {
  hotspot: NavigationConnection;
  onClick: () => void;
}

export interface ControlsProps {
  onBack?: () => void;
  onFullscreen?: () => void;
  onAudioToggle?: () => void;
  isFullscreen: boolean;
  isAudioEnabled: boolean;
}

export interface MinimapProps {
  mapImageUrl?: string;
  currentScene?: NavigationScene;
  allScenes?: NavigationScene[];
}

export interface APIResponse<T> {
  count?: number;
  next?: string;
  previous?: string;
  results?: T[];
  data?: T;
}

export interface APIError {
  message: string;
  status?: number;
  details?: Record<string, string[]>;
} 