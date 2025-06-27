import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Tour, Scene } from '../../../types';
import { VRScene } from '../../VR';
import { 
  performSharedRaycasting,
  getThreeCanvas,
  cartesianToSpherical,
  debugCoordinateComparison,
  type ScreenCoordinate,
  type SphericalCoordinate,
  type CameraState 
} from '../../../utils/coordinateSystem';
import { HOTSPOT_ICONS } from '../../../constants/hotspots';
import './styles.css';

interface EditorPreviewProps {
  tour: Tour;
  scenes: Scene[];
  currentSceneId?: number;
  editMode?: boolean;
  onHotspotPlace?: (yaw: number, pitch: number, type?: string) => void;
  onSetInitialView?: (yaw: number, pitch: number, zoom: number) => void;
  onExitPreview?: () => void;
  onSceneChange?: (sceneId: number) => void;
}

// Use unified icon system - filter for commonly used drag & drop types
type HotspotType = string;

const EDITOR_HOTSPOT_TYPES = HOTSPOT_ICONS.filter(icon => 
  ['map', 'image', 'video', 'document', 'link', 'info', 'star'].includes(icon.id)
).map(icon => ({
  type: icon.id as HotspotType,
  icon: icon.icon,
  label: icon.label
}));

// Create HOTSPOT_TYPES alias for backwards compatibility
const HOTSPOT_TYPES = EDITOR_HOTSPOT_TYPES;

const EditorPreview: React.FC<EditorPreviewProps> = ({
  tour,
  scenes,
  currentSceneId,
  editMode = false,
  onHotspotPlace,
  onSetInitialView,
  onExitPreview,
  onSceneChange,
}) => {
  const [activeSceneId, setActiveSceneId] = useState<number>(
    currentSceneId || scenes[0]?.id || 0
  );

  const [currentYaw, setCurrentYaw] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(75);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedType, setDraggedType] = useState<HotspotType | null>(null);
  
  // ✅ State cho temporary/preview hotspots từ drag & drop
  const [previewHotspots, setPreviewHotspots] = useState<Array<{
    id: string;
    yaw: number;
    pitch: number;
    type: HotspotType;
    icon: string;
    isPreview: boolean;
  }>>([]);

  // ✅ Using centralized coordinate system from utils
  // This ensures ALL VR components use the SAME coordinate conversion logic

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
    // Notify parent component about scene change
    if (onSceneChange) {
      onSceneChange(sceneId);
    }
  }, [scenes, onSceneChange]);

  const handleClick = useCallback((yaw: number, pitch: number) => {
    // For debugging coordinate placement
    (window as any).lastClickCoordinate = { yaw, pitch };
  }, []);

  const clearPreviewHotspots = useCallback(() => {
    setPreviewHotspots([]);
  }, []);

  const removePreviewHotspot = useCallback((hotspotId: string) => {
    setPreviewHotspots(prev => prev.filter(h => h.id !== hotspotId));
  }, []);

  const handleCameraChange = (yaw: number, pitch: number) => {
    setCurrentYaw(yaw);
    setCurrentPitch(pitch);
  };

  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom);
  };

  const handleDragStart = (e: React.DragEvent, type: HotspotType) => {
    setIsDragging(true);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('hotspot-type', type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const type = e.dataTransfer.getData('hotspot-type') as HotspotType;
    
    if (editMode && onHotspotPlace && type) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const canvas = getThreeCanvas(e.currentTarget as HTMLElement);
      const camera = (window as any).vrSceneCamera;
      const sphereMesh = (window as any).vrSphereMesh;
      
      let finalCoord;
      
      if (canvas && camera && sphereMesh) {
        const raycastResult = performSharedRaycasting(e.clientX, e.clientY, canvas, camera, sphereMesh);
        finalCoord = raycastResult;
      } else {
        // Fallback calculation
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (x - centerX) / centerX;
        const offsetY = (centerY - y) / centerY;
        
        const fovRad = (currentZoom * Math.PI) / 180;
        const yawOffset = offsetX * (fovRad / 2) * (rect.width / rect.height) * (180 / Math.PI);
        const pitchOffset = offsetY * (fovRad / 2) * (180 / Math.PI);
        
        finalCoord = {
          yaw: (currentYaw + yawOffset + 360) % 360,
          pitch: Math.max(-90, Math.min(90, currentPitch + pitchOffset))
        };
      }
      
      if (finalCoord && onHotspotPlace) {
        onHotspotPlace(finalCoord.yaw, finalCoord.pitch, type);
      }
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

  const convertedPreviewHotspots = useMemo(() => {
    return previewHotspots.map((hotspot, index) => ({
      id: -1000 - index,
      from_scene: activeScene?.id || 0,
      to_scene: -1,
      yaw: hotspot.yaw,
      pitch: hotspot.pitch,
      label: `${hotspot.type} hotspot`,
      size: 40,
      color: '#ff6644',
      icon_type: hotspot.type, // Use unified icon_type system
      isPreview: true
    }));
  }, [previewHotspots, activeScene?.id]);

  // ✅ CRITICAL FIX: Memoize combined hotspots array to prevent re-mounting
  const combinedHotspots = useMemo(() => {
    return [
      ...(activeScene?.navigation_connections || []),
      ...convertedPreviewHotspots
    ];
  }, [activeScene?.navigation_connections, convertedPreviewHotspots]);

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
          hotspots={combinedHotspots}
          checkpoints={activeScene.checkpoints || []}
          onHotspotClick={handleSceneChange}
          onCameraChange={handleCameraChange}
          onZoomChange={handleZoomChange}
          onSceneClick={handleClick}
          previewMode={true}
        />

        {/* Hotspot Toolbar */}
        {editMode && (
          <div className="hotspot-toolbar">
            <div className="toolbar-content">
              <div className="toolbar-title">
                Drag to place hotspots
                {previewHotspots.length > 0 && (
                  <button 
                    className="clear-previews-btn"
                    onClick={clearPreviewHotspots}
                    title="Clear all preview hotspots"
                    style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🧹 Clear {previewHotspots.length} preview{previewHotspots.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              
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
              <li>Drag icons from the toolbar to place hotspots precisely</li>
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