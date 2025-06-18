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
    // Only create hotspots via drag & drop, not on direct clicks
    // Direct clicking on the 360° image should only rotate the camera
    console.log('Scene clicked at:', { yaw, pitch }, 'but hotspots only created via drag & drop');
  }, []);

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
    
    if (editMode && onHotspotPlace && type) {
      // Get drop coordinates
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log('📍 Drop coordinates:', { x, y, rect });
      
      // Simplified approach: Calculate spherical coordinates based on viewport position
      // Convert screen coordinates to normalized viewport coordinates (-1 to 1)
      const normalizedX = (x / rect.width) * 2 - 1;
      const normalizedY = -((y / rect.height) * 2 - 1); // Flip Y for correct orientation
      
      // Calculate field of view angles
      const fovRad = (currentZoom * Math.PI) / 180;
      const aspectRatio = rect.width / rect.height;
      
      // Calculate angular offsets from center of view
      const horizontalFOV = fovRad * aspectRatio;
      const yawOffset = normalizedX * (horizontalFOV / 2) * (180 / Math.PI);
      const pitchOffset = normalizedY * (fovRad / 2) * (180 / Math.PI);
      
      // Apply offsets to current camera position
      let targetYaw = currentYaw + yawOffset;
      let targetPitch = currentPitch + pitchOffset;
      
      // Normalize yaw to 0-360 range
      targetYaw = ((targetYaw % 360) + 360) % 360;
      
      // Clamp pitch to valid range
      targetPitch = Math.max(-89, Math.min(89, targetPitch));
      
      console.log('🧭 Calculated position:', { 
        dropScreen: { x, y },
        normalized: { x: normalizedX, y: normalizedY },
        camera: { yaw: currentYaw, pitch: currentPitch, zoom: currentZoom },
        offsets: { yaw: yawOffset, pitch: pitchOffset },
        target: { yaw: targetYaw, pitch: targetPitch },
        type 
      });
      
      onHotspotPlace(targetYaw, targetPitch, type);
    } else {
      console.log('❌ Drop failed - conditions not met:', { editMode, onHotspotPlace: !!onHotspotPlace, type });
    }
    
    setIsDragging(false);
    setDraggedType(null);
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
              Drop here to place {draggedType} hotspot
            </div>
          </div>
        )}
      </div>

      {/* Navigation Help */}
      {editMode && !isDragging && (
        <div className="edit-help-overlay">
          <div className="help-content">
            <h5>Hotspot Placement</h5>
            <ul>
              <li>Drag icons from the toolbar to place hotspots</li>
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