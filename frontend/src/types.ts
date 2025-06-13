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