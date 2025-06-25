import React, { useState, useEffect, useMemo } from 'react';
import SceneViewer from '../SceneViewer';
import './styles.css';

interface TourViewerProps {
  tourId: number;
  onBack: () => void;
}

interface Tour {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Scene {
  id: number;
  tour: number;
  title: string;
  description: string;
  panorama_image: string;
  initial_yaw: number;
  initial_pitch: number;
  order: number;
}

interface Hotspot {
  id: number;
  from_scene: number;
  to_scene: number;
  yaw: number;
  pitch: number;
  label: string;
  size: number;
  color: string;
}

const TourViewer: React.FC<TourViewerProps> = ({ tourId, onBack }) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        setLoading(true);
        
        // Fetch tour details
        const tourResponse = await fetch(`/api/tours/${tourId}/`);
        if (!tourResponse.ok) {
          throw new Error('Failed to load tour');
        }
        const tourData = await tourResponse.json();
        setTour(tourData);

        // Fetch scenes for this tour
        const scenesResponse = await fetch(`/api/tours/${tourId}/scenes/`);
        if (!scenesResponse.ok) {
          throw new Error('Failed to load scenes');
        }
        const scenesData = await scenesResponse.json();
        setScenes(scenesData.sort((a: Scene, b: Scene) => a.order - b.order));
        
        // Fetch hotspots for all scenes
        const hotspotsResponse = await fetch(`/api/tours/${tourId}/navigation/`);
        if (hotspotsResponse.ok) {
          const navigationData = await hotspotsResponse.json();
          setHotspots(navigationData.connections || []);
        }
        
      } catch (err) {
        console.error('Error fetching tour data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourId]);

  const handleSceneChange = (sceneId: number) => {
    console.log('🎬 [TourViewer] Scene change requested:', {
      currentSceneId: currentScene?.id,
      currentSceneTitle: currentScene?.title,
      targetSceneId: sceneId,
      currentIndex: currentSceneIndex,
      totalScenes: scenes.length
    });
    
    const sceneIndex = scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex !== -1) {
      console.log('✅ [TourViewer] Scene found, changing to index:', sceneIndex);
      setCurrentSceneIndex(sceneIndex);
    } else {
      console.log('❌ [TourViewer] Scene not found in scenes array:', {
        targetSceneId: sceneId,
        availableScenes: scenes.map(s => ({ id: s.id, title: s.title }))
      });
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="tour-viewer-container">
        <div className="tour-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Tour...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-viewer-container">
        <div className="tour-error">
          <h3>Failed to Load Tour</h3>
          <p>{error}</p>
          <button onClick={onBack} className="back-button">
            ← Back to Tours
          </button>
        </div>
      </div>
    );
  }

  if (!tour || scenes.length === 0) {
    return (
      <div className="tour-viewer-container">
        <div className="tour-error">
          <h3>No Scenes Found</h3>
          <p>This tour doesn't have any scenes yet.</p>
          <button onClick={onBack} className="back-button">
            ← Back to Tours
          </button>
        </div>
      </div>
    );
  }

  const currentScene = scenes[currentSceneIndex];

  // ✅ CRITICAL FIX: Memoize filtered hotspots to prevent re-mounting
  const currentSceneHotspots = useMemo(() => {
    return hotspots.filter(h => h.from_scene === currentScene?.id);
  }, [hotspots, currentScene?.id]);

  return (
    <div className="tour-viewer-container">
      <header className="tour-header">
        <div className="tour-info">
          <h1>{tour.title}</h1>
          <p>{tour.description}</p>
        </div>
        
        <div className="tour-navigation">
          <button onClick={onBack} className="back-button">
            ← Back to Tours
          </button>
          
          <div className="scene-controls">
            <button 
              onClick={handlePrevScene}
              disabled={currentSceneIndex === 0}
              className="nav-button"
            >
              ← Previous
            </button>
            
            <span className="scene-counter">
              Scene {currentSceneIndex + 1} of {scenes.length}
            </span>
            
            <button 
              onClick={handleNextScene}
              disabled={currentSceneIndex === scenes.length - 1}
              className="nav-button"
            >
              Next →
            </button>
          </div>
        </div>
      </header>

      <div className="scene-viewer-container">
        <SceneViewer
          scene={currentScene}
          hotspots={currentSceneHotspots}
          onSceneChange={handleSceneChange}
          isAudioEnabled={true}
        />
      </div>

      <footer className="tour-footer">
        <div className="scene-list">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => setCurrentSceneIndex(index)}
              className={`scene-thumbnail ${index === currentSceneIndex ? 'active' : ''}`}
            >
              <div className="thumbnail-content">
                <span className="scene-number">{index + 1}</span>
                <span className="scene-title">{scene.title}</span>
              </div>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default TourViewer; 