import React, { useEffect, useRef, useState } from 'react';
import { NavigationScene, NavigationConnection } from '../../../types';
import VRScene from '../../VR/VRScene';
import AudioPlayer from '../../Common/AudioPlayer';
import './styles.css';

interface SceneViewerProps {
  scene: NavigationScene;
  hotspots: NavigationConnection[];
  onSceneChange: (sceneId: number) => void;
  isAudioEnabled: boolean;
}

const SceneViewer: React.FC<SceneViewerProps> = ({
  scene,
  hotspots,
  onSceneChange,
  isAudioEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load panoramic image');
  };

  const handleHotspotClick = (sceneId: number) => {
    onSceneChange(sceneId);
  };

  return (
    <div ref={containerRef} className="scene-viewer">
      {isLoading && (
        <div className="scene-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading 360° Scene...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="scene-error">
          <h3>Unable to Load Scene</h3>
          <p>{error}</p>
        </div>
      )}

      <VRScene
        panoramaUrl={scene.panorama_image || ''}
        yaw={scene.default_yaw ?? scene.initial_yaw}
        pitch={scene.default_pitch ?? scene.initial_pitch}
        zoomLevel={scene.initial_zoom ?? 75}
        hotspots={hotspots}
        onHotspotClick={handleHotspotClick}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
        previewMode={true}
      />

      {scene.voiceover_audio && (
        <AudioPlayer
          audioUrl={scene.voiceover_audio}
          isEnabled={isAudioEnabled}
          autoPlay={true}
        />
      )}

      {scene.map_image && (
        <div className="minimap">
          <img src={scene.map_image} alt="Scene map" />
        </div>
      )}
    </div>
  );
};

export default SceneViewer; 