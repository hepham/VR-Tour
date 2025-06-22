// Hotspot type configurations
export interface HotspotTypeConfig {
  label: string;
  color: string;
  icon: string;
}

export const HOTSPOT_TYPE_CONFIGS: Record<string, HotspotTypeConfig> = {
  map: { label: 'Map hotspot', color: '#10b981', icon: '🗺️' },
  image: { label: 'Image hotspot', color: '#3b82f6', icon: '🖼️' },
  video: { label: 'Video hotspot', color: '#ef4444', icon: '🎥' },
  article: { label: 'Article hotspot', color: '#f59e0b', icon: '📄' },
  link: { label: 'Link hotspot', color: '#8b5cf6', icon: '🔗' },
  navigation: { label: 'Navigation hotspot', color: '#3b82f6', icon: '🚪' }
};

// Extract just the icons for simple access
export const HOTSPOT_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(HOTSPOT_TYPE_CONFIGS).map(([key, config]) => [key, config.icon])
);

// Hotspot types for forms and selectors
export const HOTSPOT_TYPES = Object.entries(HOTSPOT_TYPE_CONFIGS).map(([type, config]) => ({
  type,
  ...config
}));

export type HotspotType = keyof typeof HOTSPOT_TYPE_CONFIGS; 