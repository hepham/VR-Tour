import React, { useState, useCallback, useEffect } from 'react';
import { Tour, Scene } from '../../../types';
import { VRScene } from '../../VR';
import './styles.css';

interface EditorPreviewProps {
  tour: Tour;
  scenes: Scene[];
  currentSceneId?: number;
  editMode?: boolean;
  onHotspotPlace?: (yaw: number, pitch: number, type?: string) => void;
  onSetInitialView?: (yaw: number, pitch: number, zoom: number) => void;
  onExitPreview?: () => void;
}

type HotspotType = 'map' | 'image' | 'video' | 'article' | 'link';

const HOTSPOT_TYPES: { type: HotspotType; icon: string; label: string }[] = [
  { type: 'map', icon: '🗺️', label: 'Map' },
  { type: 'image', icon: '🖼️', label: 'Image' },
  { type: 'video', icon: '🎥', label: 'Video' },
  { type: 'article', icon: '📄', label: 'Article' },
  { type: 'link', icon: '🔗', label: 'Link' },
];

const EditorPreview: React.FC<EditorPreviewProps> = ({
  tour,
  scenes,
  currentSceneId,
  editMode = false,
  onHotspotPlace,
  onSetInitialView,
  onExitPreview,
}) => {
  const [activeSceneId, setActiveSceneId] = useState<number>(
    currentSceneId || scenes[0]?.id || 0
  );

  const [currentYaw, setCurrentYaw] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(75);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedType, setDraggedType] = useState<HotspotType | null>(null);

  // Sync activeSceneId with currentSceneId prop
  useEffect(() => {
    if (currentSceneId && currentSceneId !== activeSceneId) {
      setActiveSceneId(currentSceneId);
      // Find the scene and reset camera to its default position
      const scene = scenes.find(s => s.id === currentSceneId);
      if (scene) {
        setCurrentYaw(scene.default_yaw || 0);
        setCurrentPitch(scene.default_pitch || 0);
      }
    }
  }, [currentSceneId, activeSceneId, scenes]);

  const activeScene = scenes.find(scene => scene.id === activeSceneId);

  const handleSceneChange = useCallback((sceneId: number) => {
    setActiveSceneId(sceneId);
    // Reset camera to new scene's default position
    const newScene = scenes.find(s => s.id === sceneId);
    if (newScene) {
      setCurrentYaw(newScene.default_yaw);
      setCurrentPitch(newScene.default_pitch);
    }
  }, [scenes]);

  const handleClick = useCallback((yaw: number, pitch: number) => {
    // If we have a dragged type waiting, place the hotspot at the clicked position
    if (editMode && onHotspotPlace && draggedType) {
      console.log('🎯 Placing hotspot via VRScene click:', { yaw, pitch, type: draggedType });
      onHotspotPlace(yaw, pitch, draggedType);
      setDraggedType(null);
      setIsDragging(false);
      return;
    }
    
    // Otherwise, just log for debugging
    console.log('Scene clicked at:', { yaw, pitch }, 'but no hotspot placement needed');
  }, [editMode, onHotspotPlace, draggedType]);

  const handleCameraChange = (yaw: number, pitch: number) => {
    setCurrentYaw(yaw);
    setCurrentPitch(pitch);
  };

  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom);
  };

  // Hotspot toolbar drag handlers
  const handleDragStart = (e: React.DragEvent, type: HotspotType) => {
    console.log('🚀 Drag start:', type);
    setIsDragging(true);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('hotspot-type', type);
    console.log('📦 DataTransfer set:', e.dataTransfer.getData('hotspot-type'));
  };

  const handleDragEnd = () => {
    console.log('🏁 Drag end');
    setIsDragging(false);
    setDraggedType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    // Add visual feedback
    e.currentTarget.classList.add('drag-over');
    // console.log('🔄 Drag over'); // Comment out to avoid spam
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Remove visual feedback
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    console.log('🎯 Drop event triggered');
    e.preventDefault();
    e.stopPropagation();
    
    // Remove drag-over class
    e.currentTarget.classList.remove('drag-over');
    
    const type = e.dataTransfer.getData('hotspot-type') as HotspotType;
    console.log('📥 Retrieved type from drop:', type);
    
    if (editMode && type) {
      // Instead of calculating coordinates here, set the dragged type
      // and let the user click on the exact position they want
      setDraggedType(type);
      console.log('🎯 Ready to place hotspot type:', type, '- Click on the 360° image to place it');
    } else {
      setIsDragging(false);
    }
  };

  const handleSetInitialView = () => {
    if (onSetInitialView) {
      onSetInitialView(
        Math.round(currentYaw),
        Math.round(currentPitch),
        Math.round(currentZoom)
      );
    }
  };

  if (!activeScene) {
    return (
      <div className="editor-preview-error">
        <div className="error-content">
          <h4>No Scene Available</h4>
          <p>Please create a scene with a panoramic image to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-preview">
      {/* VR Scene */}
      <div 
        className="preview-viewer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <VRScene
          panoramaUrl={activeScene.panorama_image}
          yaw={currentYaw}
          pitch={currentPitch}
          zoomLevel={currentZoom}
          hotspots={activeScene.navigation_connections || []}
          checkpoints={activeScene.checkpoints || []}
          onHotspotClick={handleSceneChange}
          onCameraChange={handleCameraChange}
          onZoomChange={handleZoomChange}
          onSceneClick={handleClick}
        />

        {/* Hotspot Toolbar */}
        {editMode && (
          <div className="hotspot-toolbar">
            <div className="toolbar-content">
              <div className="toolbar-title">Drag to place hotspots</div>
              
              {/* Camera Info Display */}
              <div className="camera-info">
                <div className="camera-info-content">
                  <div className="camera-values">
                    <span className="camera-item" onClick={() => navigator.clipboard?.writeText(Math.round(currentYaw).toString())} title="Click to copy yaw value">
                      <strong>Yaw:</strong> {Math.round(currentYaw)}°
                    </span>
                    <span className="camera-item" onClick={() => navigator.clipboard?.writeText(Math.round(currentPitch).toString())} title="Click to copy pitch value">
                      <strong>Pitch:</strong> {Math.round(currentPitch)}°
                    </span>
                    <span className="camera-item" onClick={() => navigator.clipboard?.writeText(Math.round(currentZoom).toString())} title="Click to copy zoom value">
                      <strong>Zoom:</strong> {Math.round(currentZoom)}%
                    </span>
                  </div>
                  <div className="camera-hint">
                    💡 Click values to copy • {onSetInitialView ? 'Click button to apply' : 'Use for initial camera position'}
                  </div>
                </div>
                
                {onSetInitialView && (
                  <button 
                    className="set-initial-view-btn"
                    onClick={handleSetInitialView}
                    title="Set current camera position as initial view"
                  >
                    📍 Set Initial View
                  </button>
                )}
              </div>
              
              <div className="hotspot-icons">
                {HOTSPOT_TYPES.map((hotspot) => (
                  <div
                    key={hotspot.type}
                    className={`hotspot-icon ${draggedType === hotspot.type ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, hotspot.type)}
                    onDragEnd={handleDragEnd}
                    title={hotspot.label}
                  >
                    <span className="icon">{hotspot.icon}</span>
                    <span className="label">{hotspot.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Drop indicator */}
        {isDragging && (
          <div className="drop-indicator">
            <div className="drop-message">
              Drop here to select {draggedType} hotspot type
            </div>
          </div>
        )}

        {/* Placement indicator when hotspot type is selected */}
        {draggedType && !isDragging && (
          <div className="placement-indicator">
            <div className="placement-message">
              🎯 Click on the 360° image to place {draggedType} hotspot
            </div>
          </div>
        )}
      </div>

      {/* Navigation Help */}
      {editMode && !isDragging && !draggedType && (
        <div className="edit-help-overlay">
          <div className="help-content">
            <h5>Hotspot Placement</h5>
            <ul>
              <li>Drag icons from the toolbar to select hotspot type</li>
              <li>Then click on the 360° image to place it precisely</li>
              <li>Use mouse/touch to rotate the view</li>
              <li>Zoom with scroll wheel or pinch gesture</li>
            </ul>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!activeScene.panorama_image && (
        <div className="preview-loading">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading panoramic image...</p>
          </div>
        </div>
      )}


    </div>
  );
};

export default EditorPreview; 