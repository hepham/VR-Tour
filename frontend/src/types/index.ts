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