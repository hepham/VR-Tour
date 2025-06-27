// Hotspot icon and type configurations
export interface HotspotIcon {
  id: string;
  icon: string;
  label: string;
  category: 'navigation' | 'information' | 'media';
  color: string;
}

// Unified icon definitions for all hotspot components
export const HOTSPOT_ICONS: HotspotIcon[] = [
  // Navigation
  { id: 'arrow', icon: '➡️', label: 'Arrow', category: 'navigation', color: '#3b82f6' },
  { id: 'door', icon: '🚪', label: 'Door', category: 'navigation', color: '#3b82f6' },
  { id: 'stairs', icon: '🏃‍♂️', label: 'Stairs', category: 'navigation', color: '#3b82f6' },
  { id: 'elevator', icon: '🛗', label: 'Elevator', category: 'navigation', color: '#3b82f6' },
  
  // Information
  { id: 'info', icon: 'ℹ️', label: 'Information', category: 'information', color: '#f59e0b' },
  { id: 'question', icon: '❓', label: 'Question', category: 'information', color: '#f59e0b' },
  { id: 'warning', icon: '⚠️', label: 'Warning', category: 'information', color: '#ef4444' },
  { id: 'star', icon: '⭐', label: 'Featured', category: 'information', color: '#f59e0b' },
  
  // Media
  { id: 'image', icon: '🖼️', label: 'Image', category: 'media', color: '#10b981' },
  { id: 'video', icon: '🎥', label: 'Video', category: 'media', color: '#ef4444' },
  { id: 'audio', icon: '🔊', label: 'Audio', category: 'media', color: '#8b5cf6' },
  { id: 'document', icon: '📄', label: 'Document', category: 'media', color: '#f59e0b' },
  
  // Additional legacy support
  { id: 'map', icon: '🗺️', label: 'Map', category: 'information', color: '#10b981' },
  { id: 'link', icon: '🔗', label: 'Link', category: 'media', color: '#8b5cf6' },
  { id: 'article', icon: '📄', label: 'Article', category: 'media', color: '#f59e0b' },
  { id: 'navigation', icon: '🚪', label: 'Navigation', category: 'navigation', color: '#3b82f6' },
];

// Helper function to get icon by id
export const getHotspotIcon = (iconId?: string): string => {
  const hotspotIcon = HOTSPOT_ICONS.find(icon => icon.id === iconId);
  return hotspotIcon?.icon || '📍'; // Default fallback icon
};

// Helper function to get icon data by id
export const getHotspotIconData = (iconId?: string): HotspotIcon | null => {
  return HOTSPOT_ICONS.find(icon => icon.id === iconId) || null;
};

// Legacy support - convert old system to new
export const HOTSPOT_TYPE_CONFIGS: Record<string, { label: string; color: string; icon: string }> = {
  map: { label: 'Map hotspot', color: '#10b981', icon: '🗺️' },
  image: { label: 'Image hotspot', color: '#3b82f6', icon: '🖼️' },
  video: { label: 'Video hotspot', color: '#ef4444', icon: '🎥' },
  article: { label: 'Article hotspot', color: '#f59e0b', icon: '📄' },
  link: { label: 'Link hotspot', color: '#8b5cf6', icon: '🔗' },
  navigation: { label: 'Navigation hotspot', color: '#3b82f6', icon: '🚪' }
};

// Legacy icon mapping for backward compatibility
export const HOTSPOT_ICONS_LEGACY: Record<string, string> = Object.fromEntries(
  Object.entries(HOTSPOT_TYPE_CONFIGS).map(([key, config]) => [key, config.icon])
);

// Hotspot types for forms and selectors
export const HOTSPOT_TYPES = Object.entries(HOTSPOT_TYPE_CONFIGS).map(([type, config]) => ({
  type,
  ...config
}));

export type HotspotType = keyof typeof HOTSPOT_TYPE_CONFIGS; 