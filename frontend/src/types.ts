export interface Tour {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
  scenes?: Scene[];
}

export interface Scene {
  id: number;
  tour_id: number;
  title: string;
  description?: string;
  panorama_image: string;
  default_yaw: number;
  default_pitch: number;
  order: number;
  navigation_connections?: NavigationConnection[];
  checkpoints?: Checkpoint[];
}

export interface NavigationConnection {
  id: number;
  from_scene: number;
  to_scene: number;
  yaw: number;
  pitch: number;
  label: string;
  size: number;
  color: string;
}

export interface Checkpoint {
  id: number;
  scene_id: number;
  yaw: number;
  pitch: number;
  title: string;
  description: string;
  type: 'info' | 'video' | 'image' | 'gallery';
  content: {
    text?: string;
    videoUrl?: string;
    imageUrl?: string;
    images?: string[];
    audioUrl?: string;
  };
  size?: number;
  color?: string;
  icon?: string;
} 