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

  // Function to convert screen coordinates to spherical coordinates
  // EXACTLY matches VRScene's OrbitControls and coordinate system
  const screenToSpherical = (
    screenX: number, 
    screenY: number, 
    canvasWidth: number, 
    canvasHeight: number,
    cameraYaw: number,
    cameraPitch: number,
    cameraZoom: number
  ) => {
    // Convert screen coordinates to normalized device coordinates (-1 to 1)
    const x = (screenX / canvasWidth) * 2 - 1;
    const y = -((screenY / canvasHeight) * 2 - 1); // Flip Y axis for WebGL
    
    // Calculate field of view in radians
    const fov = (cameraZoom * Math.PI) / 180;
    const aspect = canvasWidth / canvasHeight;
    
    // Create ray from camera through screen point (matching Three.js raycasting)
    const rayX = Math.tan(fov * 0.5) * x * aspect;
    const rayY = Math.tan(fov * 0.5) * y;
    const rayZ = -1; // Camera looks down negative Z
    
    // Normalize ray direction
    const rayLength = Math.sqrt(rayX * rayX + rayY * rayY + rayZ * rayZ);
    let normalizedX = rayX / rayLength;
    let normalizedY = rayY / rayLength;
    let normalizedZ = rayZ / rayLength;
    
    // Convert camera yaw/pitch to OrbitControls' azimuthal/polar angles
    // VRScene uses: yaw = ((azimuthal * 180) / Math.PI + 90 + 360) % 360
    // So: azimuthal = (yaw - 90) * Math.PI / 180
    const azimuthalAngle = ((cameraYaw - 90) * Math.PI) / 180;
    
    // VRScene uses: pitch = 90 - (polar * 180) / Math.PI  
    // So: polar = (90 - pitch) * Math.PI / 180
    const polarAngle = ((90 - cameraPitch) * Math.PI) / 180;
    
    // Apply OrbitControls transformations (note: rotateSpeed=-0.5 in VRScene)
    // Apply polar (pitch) rotation first (around X axis)
    const polarCos = Math.cos(polarAngle);
    const polarSin = Math.sin(polarAngle);
    
    let rotatedY = normalizedY * polarCos + normalizedZ * polarSin;
    let rotatedZ = -normalizedY * polarSin + normalizedZ * polarCos;
    normalizedY = rotatedY;
    normalizedZ = rotatedZ;
    
    // Apply azimuthal (yaw) rotation (around Y axis)
    const azimuthalCos = Math.cos(azimuthalAngle);
    const azimuthalSin = Math.sin(azimuthalAngle);
    
    const finalX = normalizedX * azimuthalCos + normalizedZ * azimuthalSin;
    const finalZ = -normalizedX * azimuthalSin + normalizedZ * azimuthalCos;
    const finalY = normalizedY;
    
    // Scale ray to intersect with sphere (radius = 500, matching VRScene)
    const sphereRadius = 500;
    const intersectionX = finalX * sphereRadius;
    const intersectionY = finalY * sphereRadius;
    const intersectionZ = finalZ * sphereRadius;
    
    // Convert 3D intersection point to spherical coordinates (matching VRScene logic)
    const radius = Math.sqrt(intersectionX * intersectionX + intersectionY * intersectionY + intersectionZ * intersectionZ);
    const pitch = Math.asin(intersectionY / radius) * (180 / Math.PI);
    
    // Calculate yaw with proper offset for coordinate system (matching VRScene)
    let yaw = Math.atan2(intersectionX, intersectionZ) * (180 / Math.PI);
    yaw = ((yaw - 180) + 360) % 360; // Adjust for coordinate system offset (matching VRScene)
    
    // Clamp pitch to valid range
    const clampedPitch = Math.max(-85, Math.min(85, pitch));
    
    console.log('🎯 OrbitControls-matching spherical calculation:', {
      screen: { x: screenX, y: screenY },
      ndc: { x, y },
      camera: { yaw: cameraYaw, pitch: cameraPitch, zoom: cameraZoom },
      orbitAngles: { azimuthal: azimuthalAngle * 180/Math.PI, polar: polarAngle * 180/Math.PI },
      intersection: { x: intersectionX, y: intersectionY, z: intersectionZ },
      target: { yaw, pitch: clampedPitch }
    });
    
    return { yaw, pitch: clampedPitch };
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
    console.log('Scene clicked at:', { yaw, pitch });
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
      // Calculate coordinates using the same method as VRScene
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log('📍 Drop coordinates:', { 
        x, y, rect,
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
      
      console.log('🧭 FINAL COORDINATES:', { 
        screen: { x, y },
        camera: { yaw: currentYaw, pitch: currentPitch, zoom: currentZoom },
        calculated: { yaw: targetYaw, pitch: targetPitch },
        type,
        'TEST_CLICK_SAME_SPOT': 'Click this exact position to compare with VRScene click!'
      });
      
      onHotspotPlace(targetYaw, targetPitch, type);
      
      // Set debug position for visual feedback (temporary)
      setDebugDropPosition({ x, y });
      setTimeout(() => setDebugDropPosition(null), 2000); // Clear after 2s
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