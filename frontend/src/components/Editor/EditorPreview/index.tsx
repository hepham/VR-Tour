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
  const [debugDropPosition, setDebugDropPosition] = useState<{x: number, y: number} | null>(null);

  // RADICAL RETHINK: Reverse engineer from VRScene's working logic
  const screenToSpherical = (
    screenX: number, 
    screenY: number, 
    canvasWidth: number, 
    canvasHeight: number,
    cameraYaw: number,
    cameraPitch: number,
    cameraZoom: number
  ) => {
    // Step 1: Convert screen to NDC (normalized device coordinates)
    const ndcX = (screenX / canvasWidth) * 2 - 1;
    const ndcY = -((screenY / canvasHeight) * 2 - 1); // Flip Y
    
    // Step 2: Convert NDC to view space using camera projection
    const fovRad = (cameraZoom * Math.PI) / 180;
    const aspect = canvasWidth / canvasHeight;
    const viewX = ndcX * Math.tan(fovRad / 2) * aspect;
    const viewY = ndcY * Math.tan(fovRad / 2);
    const viewZ = -1; // View space points down -Z
    
    // Step 3: Transform view space to world space using OrbitControls logic
    // VRScene uses: azimuthal = ((yaw - 90) * PI) / 180; polar = ((90 - pitch) * PI) / 180
    const azimuthalAngle = ((cameraYaw - 90) * Math.PI) / 180;
    const polarAngle = ((90 - cameraPitch) * Math.PI) / 180;
    
    // Step 4: Apply SAME rotation order as OrbitControls
    // OrbitControls applies: polar first (around X), then azimuthal (around Y)
    
    // First apply polar rotation (rotation around X-axis)
    const cosP = Math.cos(polarAngle);
    const sinP = Math.sin(polarAngle);
    const rotX1 = viewX;
    const rotY1 = viewY * cosP - viewZ * sinP;
    const rotZ1 = viewY * sinP + viewZ * cosP;
    
    // Then apply azimuthal rotation (rotation around Y-axis)
    const cosA = Math.cos(azimuthalAngle);
    const sinA = Math.sin(azimuthalAngle);
    const worldX = rotX1 * cosA + rotZ1 * sinA;
    const worldY = rotY1;
    const worldZ = -rotX1 * sinA + rotZ1 * cosA;
    
    // Step 5: Scale to sphere surface (radius 500)
    const length = Math.sqrt(worldX * worldX + worldY * worldY + worldZ * worldZ);
    const sphereRadius = 500;
    const pointX = (worldX / length) * sphereRadius;
    const pointY = (worldY / length) * sphereRadius;
    const pointZ = (worldZ / length) * sphereRadius;
    
    // Step 6: Convert to spherical coordinates (EXACT same as VRScene)
    const radius = Math.sqrt(pointX * pointX + pointY * pointY + pointZ * pointZ);
    const pitch = Math.asin(pointY / radius) * (180 / Math.PI);
    
    // NOTE: Don't invert pitch here - VRScene's sphericalToCartesian does the inversion
    // when rendering hotspots, but the stored coordinate should be positive
    
    let yaw = Math.atan2(pointX, pointZ) * (180 / Math.PI);
    yaw = ((yaw - 180) + 360) % 360; // Apply same offset as VRScene
    
    console.log('🎯 ORBITCONTROLS-CORRECT conversion:', {
      screen: { x: screenX, y: screenY },
      ndc: { x: ndcX, y: ndcY },
      view: { x: viewX, y: viewY, z: viewZ },
      angles: { azimuthal: azimuthalAngle * 180 / Math.PI, polar: polarAngle * 180 / Math.PI },
      world: { x: worldX, y: worldY, z: worldZ },
      point: { x: pointX, y: pointY, z: pointZ },
      camera: { yaw: cameraYaw, pitch: cameraPitch, zoom: cameraZoom },
      result: { yaw, pitch },
      method: 'OrbitControls rotation order: polar then azimuthal'
    });
    
    return { yaw, pitch };
  };

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
    // Just log clicks for debugging, hotspots are placed via drag & drop
    console.log('🔍 VRScene CLICK coordinates:', { yaw, pitch });
    console.log('📍 Current camera state:', { yaw: currentYaw, pitch: currentPitch, zoom: currentZoom });
  }, [currentYaw, currentPitch, currentZoom]);

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
      // Calculate coordinates using the same method as VRScene
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log('📍 Drop coordinates:', { 
        x, y, 
        canvas: { width: rect.width, height: rect.height },
        rect,
        relativePosition: {
          x: (x / rect.width).toFixed(3),
          y: (y / rect.height).toFixed(3)
        },
        screenPosition: `${Math.round((x / rect.width) * 100)}% from left, ${Math.round((y / rect.height) * 100)}% from top`
      });
      
      // Convert screen coordinates to spherical coordinates
      // This replicates VRScene's raycasting logic
      const { yaw: targetYaw, pitch: targetPitch } = screenToSpherical(
        x, y, rect.width, rect.height, currentYaw, currentPitch, currentZoom
      );
      
      console.log('🧭 FINAL COORDINATES FOR COMPARISON:', { 
        screen: { x, y },
        camera: { yaw: currentYaw, pitch: -currentPitch, zoom: currentZoom },
        calculated: { yaw: targetYaw, pitch: targetPitch },
        type,
        'NEXT_STEP': 'Now click this EXACT screen position and compare coordinates!'
      });
      
      onHotspotPlace(targetYaw, targetPitch, type);
      
      // Set debug position for visual feedback (temporary)
      setDebugDropPosition({ x, y });
      // setTimeout(() => setDebugDropPosition(null), 2000); // Clear after 2s
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

        {/* Debug crosshair for drop position */}
        {debugDropPosition && (
          <div 
            className="debug-crosshair"
            style={{
              position: 'absolute',
              left: debugDropPosition.x - 10,
              top: debugDropPosition.y - 10,
              width: 20,
              height: 20,
              border: '2px solid #ff0000',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 0, 0, 0.3)'
            }}
          />
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