import React, { useState, useCallback, useEffect } from 'react';
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
  }, [scenes]);

  const handleClick = useCallback((yaw: number, pitch: number, event?: any) => {
    // Just log clicks for debugging, hotspots are placed via drag & drop
    console.log('🔍 VRScene CLICK coordinates:', { yaw, pitch });
    console.log('📍 Current camera state:', { yaw: currentYaw, pitch: currentPitch, zoom: currentZoom });
    
    const yawDiff = Math.abs(yaw - currentYaw);
    const pitchDiff = Math.abs(pitch - currentPitch);
    
    console.log('🔍 CLICK vs CAMERA DIFF:', { 
      yawDiff: yawDiff.toFixed(2), 
      pitchDiff: pitchDiff.toFixed(2),
      status: (yawDiff < 5 && pitchDiff < 5) ? '✅ Coordinates match!' : '❌ Large difference - check coordinate system'
    });
    
    // 🔍 Store for drop comparison with screen position if available
    (window as any).lastClickCoordinate = { yaw, pitch };
    
    // ✅ If this is a click from drop debugging, store additional info
    if (event?.debugScreenPosition) {
      console.log('🎯 CLICK WITH SCREEN DEBUG:', {
        clickCoord: { yaw, pitch },
        screenPos: event.debugScreenPosition,
        camera: { yaw: currentYaw, pitch: currentPitch }
      });
      (window as any).lastClickWithScreen = {
        clickCoord: { yaw, pitch },
        screenPos: event.debugScreenPosition,
        camera: { yaw: currentYaw, pitch: currentPitch }
      };
    }
  }, [currentYaw, currentPitch, currentZoom]);

  // ✅ Function để clear preview hotspots
  const clearPreviewHotspots = useCallback(() => {
    setPreviewHotspots([]);
    setDebugDropPosition(null);
    console.log('🧹 Preview hotspots cleared');
  }, []);

  // ✅ Function để remove specific preview hotspot
  const removePreviewHotspot = useCallback((hotspotId: string) => {
    setPreviewHotspots(prev => prev.filter(h => h.id !== hotspotId));
    console.log('🗑️ Removed preview hotspot:', hotspotId);
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
        x, y, 
        canvas: { width: rect.width, height: rect.height },
        rect,
        relativePosition: {
          x: (x / rect.width).toFixed(3),
          y: (y / rect.height).toFixed(3)
        },
        screenPosition: `${Math.round((x / rect.width) * 100)}% from left, ${Math.round((y / rect.height) * 100)}% from top`
      });
      
      // ✅ PERFECT SOLUTION: Use shared raycasting utility!
      // This ensures EXACT same coordinate system as VRScene click
      
      console.log('🎯 USING SHARED RAYCASTING UTILITY');
      
      // Get Three.js canvas and objects from VRScene
      const canvas = getThreeCanvas(e.currentTarget as HTMLElement);
      
      if (!canvas) {
        console.error('❌ Cannot find Three.js canvas for raycasting');
        return;
      }
      
      // Get Three.js camera and sphere mesh from VRScene
      // Note: We'll need to expose these via VRScene or get them via context
      // For now, use a temporary approach by storing them globally
      const camera = (window as any).vrSceneCamera;
      const sphereMesh = (window as any).vrSphereMesh;
      
      if (!camera || !sphereMesh) {
        console.warn('⚠️ Three.js objects not available, falling back to coordinate calculation');
        // Fallback to simpler calculation if objects not available
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (x - centerX) / centerX;  // -1 to 1
        const offsetY = (centerY - y) / centerY;  // -1 to 1, flipped Y
        
        const fovRad = (currentZoom * Math.PI) / 180;
        const yawOffset = offsetX * (fovRad / 2) * (rect.width / rect.height) * (180 / Math.PI);
        const pitchOffset = offsetY * (fovRad / 2) * (180 / Math.PI);
        
        var finalCoord = {
          yaw: (currentYaw + yawOffset + 360) % 360,
          pitch: Math.max(-90, Math.min(90, currentPitch + pitchOffset))
        };
      } else {
        // ✅ Use perfect shared raycasting!
        const absoluteX = e.clientX;
        const absoluteY = e.clientY;
        
        const raycastResult = performSharedRaycasting(absoluteX, absoluteY, canvas, camera, sphereMesh);
        
        if (raycastResult) {
          var finalCoord = raycastResult;
          console.log('✅ SHARED RAYCASTING SUCCESS:', finalCoord);
        } else {
          console.error('❌ Shared raycasting failed');
          return;
        }
      }
      
      console.log('🎯 FINAL DROP COORDINATES:', finalCoord);
      
      // 🔍 Debug: So sánh với last click coordinate để validate accuracy  
      const lastClickData = (window as any).lastClickCoordinate;
      if (lastClickData) {
        const yawDiff = Math.abs(finalCoord.yaw - lastClickData.yaw);
        const pitchDiff = Math.abs(finalCoord.pitch - lastClickData.pitch);
        
        console.log('⚖️ DROP vs LAST CLICK COMPARISON:', {
          dropCoord: finalCoord,
          lastClickCoord: lastClickData,
          yawDiff: yawDiff.toFixed(2),
          pitchDiff: pitchDiff.toFixed(2),
          status: (yawDiff < 10 && pitchDiff < 10) ? '✅ Close match!' : '❌ Still misaligned'
        });
      }
      
      // ✅ Tạo preview hotspot với unique ID để render ngay tại vị trí drop
      const previewHotspot = {
        id: `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        yaw: finalCoord.yaw,
        pitch: finalCoord.pitch,
        type: type,
        icon: HOTSPOT_TYPES.find(h => h.type === type)?.icon || '📍',
        isPreview: true
      };
      
      // Add to preview hotspots array
      setPreviewHotspots(prev => [...prev, previewHotspot]);
      
      // Set debug position for visual feedback (temporary)
      setDebugDropPosition({ x, y });
      
      // Call parent callback để notify about new hotspot placement
      if (onHotspotPlace) {
        onHotspotPlace(finalCoord.yaw, finalCoord.pitch, type);
      }
      
      console.log('✅ PREVIEW HOTSPOT CREATED:', previewHotspot);
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
          hotspots={[
            ...(activeScene.navigation_connections || []),
            // ✅ Convert preview hotspots to NavigationConnection format
            ...previewHotspots.map((hotspot, index) => {
              console.log('🔄 Converting preview hotspot to NavigationConnection:', {
                original: hotspot,
                converted: {
                  id: -1000 - index,
                  yaw: hotspot.yaw,
                  pitch: hotspot.pitch
                }
              });
              
              return {
                id: -1000 - index, // Ensure negative unique IDs để tránh conflict với real hotspots
                from_scene: activeScene.id,
                to_scene: -1, // Temporary scene ID for preview
                yaw: hotspot.yaw,
                pitch: hotspot.pitch,
                label: `${hotspot.type} hotspot`,
                size: 1.5,
                color: '#ff4444' // Red color for preview hotspots
              };
            })
          ]}
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