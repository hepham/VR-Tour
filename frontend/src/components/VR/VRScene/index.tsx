import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, Mesh, RepeatWrapping, DoubleSide } from 'three';
import { NavigationConnection } from '../../../types';
import Hotspot from '../Hotspot';
import { CheckpointMarker } from '../../Checkpoint';
import { cartesianToSpherical, debugCoordinateComparison, type Point3D } from '../../../utils/coordinateSystem';
import './styles.css';

// Temporary checkpoint interface until types are properly imported
interface Checkpoint {
  id: number;
  scene_id: number;
  yaw: number;
  pitch: number;
  title: string;
  description: string;
  type: 'info' | 'video' | 'image' | 'gallery';
  content: {
    text?: string;
    videoUrl?: string;
    imageUrl?: string;
    images?: string[];
    audioUrl?: string;
  };
  size?: number;
  color?: string;
  icon?: string;
}

interface VRSceneProps {
  panoramaUrl: string;
  yaw: number;
  pitch: number;
  zoomLevel?: number;
  hotspots: NavigationConnection[];
  checkpoints?: Checkpoint[];
  onHotspotClick: (sceneId: number) => void;
  onCheckpointClick?: (checkpoint: Checkpoint) => void;
  onImageLoad?: () => void;
  onImageError?: () => void;
  onCameraChange?: (yaw: number, pitch: number) => void;
  onZoomChange?: (zoom: number) => void;
  onSceneClick?: (yaw: number, pitch: number) => void;
  previewMode?: boolean; // true = allow navigation, false = block navigation
}

// ✅ Interface để expose Three.js objects cho shared raycasting
export interface VRSceneRef {
  getThreeObjects: () => {
    camera: any;
    sphereMesh: any;
    canvas: HTMLCanvasElement | null;
  } | null;
}

// Component to handle camera zoom updates with smooth transition and adaptive rotation speed
const CameraController: React.FC<{ 
  zoomLevel: number; 
  controlsRef: React.RefObject<any>;
  targetYaw: number;
  targetPitch: number;
  sceneKey: number | string;
  onCameraChange?: (yaw: number, pitch: number) => void;
}> = ({ zoomLevel, controlsRef, targetYaw, targetPitch, sceneKey, onCameraChange }) => {
  const isUserInteracting = useRef(false);
  const currentYaw = useRef(targetYaw);
  const currentPitch = useRef(targetPitch);
  const lastZoomLevel = useRef(zoomLevel);
  const targetFOV = useRef(zoomLevel);
  const lastNotificationTime = useRef(0);
  const lastCameraValues = useRef({ yaw: targetYaw, pitch: targetPitch });
  const finalUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track previous sceneKey to detect scene changes
  const prevSceneKey = useRef(sceneKey);

  const { camera } = useThree();

  // Chỉ set lại camera về góc initial khi sceneKey đổi
  useEffect(() => {
    if (sceneKey !== prevSceneKey.current && controlsRef.current) {
      const azimuthalAngle = ((targetYaw + 180) * Math.PI) / 180;
      const polarAngle = ((90 - targetPitch) * Math.PI) / 180;
      controlsRef.current.setAzimuthalAngle(azimuthalAngle);
      controlsRef.current.setPolarAngle(polarAngle);
      currentYaw.current = targetYaw;
      currentPitch.current = targetPitch;
      lastCameraValues.current = { yaw: targetYaw, pitch: targetPitch };
      prevSceneKey.current = sceneKey;
      console.log('[CameraController] Set camera to initial yaw/pitch for sceneKey:', sceneKey, targetYaw, targetPitch);
    }
  }, [sceneKey, targetYaw, targetPitch, controlsRef]);

  useEffect(() => {
    targetFOV.current = zoomLevel;
  }, [zoomLevel]);

  // Track user interaction
  useEffect(() => {
    if (controlsRef.current) {
      const onStart = () => {
        isUserInteracting.current = true;
        // Tăng damping factor khi bắt đầu tương tác
        controlsRef.current.dampingFactor = 0.1;
        
        // Clear any pending final update
        if (finalUpdateTimeout.current) {
          clearTimeout(finalUpdateTimeout.current);
          finalUpdateTimeout.current = null;
        }
      };
      const onEnd = () => {
        isUserInteracting.current = false;
        // Giảm damping factor khi kết thúc tương tác
        controlsRef.current.dampingFactor = 0.05;
        // Update current values to match controls when user stops interacting
        // ✅ Sử dụng cùng coordinate system với calculateCameraAngles
        const azimuthal = controlsRef.current.getAzimuthalAngle();
        const polar = controlsRef.current.getPolarAngle();
        let yaw = (azimuthal * 180) / Math.PI;
        yaw = ((yaw - 180) + 360) % 360; // Same as cartesianToSpherical
        currentYaw.current = yaw;
        currentPitch.current = 90 - (polar * 180) / Math.PI;
        
        // Schedule a final update after user stops interacting
        finalUpdateTimeout.current = setTimeout(() => {
          // ✅ Sử dụng cùng coordinate system
          let currentYawValue = (azimuthal * 180) / Math.PI;
          currentYawValue = ((currentYawValue - 180) + 360) % 360;
          const currentPitchValue = 90 - (polar * 180) / Math.PI;
          lastCameraValues.current = { yaw: currentYawValue, pitch: currentPitchValue };
          onCameraChange?.(currentYawValue, currentPitchValue);
        }, 100); // Wait 100ms after interaction ends
      };

      controlsRef.current.addEventListener('start', onStart);
      controlsRef.current.addEventListener('end', onEnd);

      return () => {
        controlsRef.current?.removeEventListener('start', onStart);
        controlsRef.current?.removeEventListener('end', onEnd);
        
        // Clear any pending timeouts
        if (finalUpdateTimeout.current) {
          clearTimeout(finalUpdateTimeout.current);
          finalUpdateTimeout.current = null;
        }
      };
    }
  }, [controlsRef]);
  
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // Update controls (this is necessary for OrbitControls to work)
    controlsRef.current.update();
    
    // Only do expensive calculations when not interacting or when significant change is needed
    if (!isUserInteracting.current) {
      // Only lerp when user is not interacting and there's a significant difference
      const yawDiff = Math.abs(targetYaw - currentYaw.current);
      const pitchDiff = Math.abs(targetPitch - currentPitch.current);
      
      if (yawDiff > 0.5 || pitchDiff > 0.5) {
        const lerpFactor = Math.min(1.0, 1.5 * delta);
        currentYaw.current += (targetYaw - currentYaw.current) * lerpFactor;
        currentPitch.current += (targetPitch - currentPitch.current) * lerpFactor;

        // Convert to radians and set camera angles
        // ✅ Đảo ngược transform để phù hợp với coordinate system mới
        const azimuthalAngle = ((currentYaw.current + 180) * Math.PI) / 180;
        const polarAngle = ((90 - currentPitch.current) * Math.PI) / 180;

        controlsRef.current.setAzimuthalAngle(azimuthalAngle);
        controlsRef.current.setPolarAngle(polarAngle);
      }
    }
    
    // Only update rotation speed when zoom level changes significantly
    if (Math.abs(zoomLevel - lastZoomLevel.current) > 1) {
      const normalizedZoom = (zoomLevel - 30) / (120 - 30);
      const baseRotateSpeed = isUserInteracting.current ? 0.8 : 1.2;
      const adaptiveSpeed = baseRotateSpeed * (0.5 + normalizedZoom * 0.5);
      controlsRef.current.rotateSpeed = adaptiveSpeed;
      lastZoomLevel.current = zoomLevel;
    }

    // Aggressive throttling for camera change notifications
    const now = performance.now();
    // Use much longer throttling during user interaction to improve performance
    const throttleInterval = isUserInteracting.current ? 100 : 16; // 10fps during interaction, 60fps when idle
    
    if (now - lastNotificationTime.current > throttleInterval) {
      const azimuthal = controlsRef.current.getAzimuthalAngle();
      const polar = controlsRef.current.getPolarAngle();
      // ✅ Sử dụng cùng coordinate system để đồng bộ click vs camera
      let currentYawValue = (azimuthal * 180) / Math.PI;
      currentYawValue = ((currentYawValue - 180) + 360) % 360;
      const currentPitchValue = 90 - (polar * 180) / Math.PI;
      
      // Only call onCameraChange if values have changed significantly
      const yawChange = Math.abs(currentYawValue - lastCameraValues.current.yaw);
      const pitchChange = Math.abs(currentPitchValue - lastCameraValues.current.pitch);
      
      if (yawChange > 1 || pitchChange > 1) {
        lastCameraValues.current = { yaw: currentYawValue, pitch: currentPitchValue };
        onCameraChange?.(currentYawValue, currentPitchValue);
        lastNotificationTime.current = now;
      }
    }
    
    // Smooth FOV interpolation - only when needed
    if ('fov' in camera) {
      const currentFOV = camera.fov;
      const difference = targetFOV.current - currentFOV;
      
      if (Math.abs(difference) > 0.1) {
        const smoothFactor = 6.0;
        camera.fov += difference * smoothFactor * delta;
        camera.updateProjectionMatrix();
      }
    }
  });
  
  return null;
};

const PanoramaSphere: React.FC<{
  panoramaUrl: string;
  onImageLoad?: () => void;
  onImageError?: () => void;
  onSceneClick?: (yaw: number, pitch: number) => void;
  controlsRef?: React.RefObject<any>;
  meshRef?: React.RefObject<any>;
}> = ({ panoramaUrl, onImageLoad, onImageError, onSceneClick, controlsRef, meshRef }) => {
  const localMeshRef = useRef<Mesh>(null);
  const actualMeshRef = meshRef || localMeshRef;
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Use useLoader hook for reliable texture loading
  const texture = useLoader(TextureLoader, panoramaUrl);

  useEffect(() => {
    if (texture) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(-1, 1); // Flip horizontally to fix mirroring
      texture.flipY = true; // Set to true for proper vertical orientation
      texture.colorSpace = 'srgb';
      texture.generateMipmaps = false;
      
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
        onImageLoad?.();
      }
    }
  }, [texture, hasLoadedOnce, onImageLoad]);

  const handleSphereClick = (event: any) => {
    if (onSceneClick && event.intersections && event.intersections.length > 0) {
      const intersection = event.intersections[0];
      const point3D: Point3D = intersection.point;
      
      console.log('🎯 RAW 3D CLICK POINT:', point3D);
      
      // ✅ Use centralized coordinate conversion
      const rawSphericalCoord = cartesianToSpherical(point3D);
      
      // ✅ CRITICAL FIX: Add 180° để align với OrbitControls reference frame  
      const alignedYaw = (rawSphericalCoord.yaw + 180) % 360;
      const sphericalCoord = { yaw: alignedYaw, pitch: rawSphericalCoord.pitch };
      
      console.log('🔍 VRScene CLICK coordinates:', sphericalCoord);
      
      // Store for drop comparison
      (window as any).lastClickCoordinate = sphericalCoord;
      
      onSceneClick(sphericalCoord.yaw, sphericalCoord.pitch);
    }
  };

  // ✅ Expose mesh globally for shared raycasting
  useEffect(() => {
    if (actualMeshRef.current) {
      (window as any).vrSphereMesh = actualMeshRef.current;
      console.log('🌐 SPHERE MESH EXPOSED GLOBALLY:', actualMeshRef.current);
    }
  }, []);

  return (
    <mesh 
      ref={actualMeshRef} 
      scale={[1, 1, 1]} 
      onClick={handleSphereClick}
    >
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial 
        map={texture} 
        side={DoubleSide}
        toneMapped={false}
        transparent={false}
      />
    </mesh>
  );
};

const VRScene = React.forwardRef<VRSceneRef, VRSceneProps>(({
  panoramaUrl,
  yaw,
  pitch,
  zoomLevel = 75,
  hotspots,
  checkpoints = [],
  onHotspotClick,
  onCheckpointClick,
  onImageLoad,
  onImageError,
  onCameraChange,
  onZoomChange,
  onSceneClick,
  previewMode = false,
}, ref) => {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const sphereMeshRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // ✅ Expose Three.js objects via ref for shared raycasting
  React.useImperativeHandle(ref, () => ({
    getThreeObjects: () => {
      const canvas = canvasRef.current || document.querySelector('canvas');
      return {
        camera: cameraRef.current,
        sphereMesh: sphereMeshRef.current,
        canvas: canvas
      };
    }
  }));

  // Function to calculate yaw and pitch from camera rotation
  // ✅ FIXED: Đồng bộ với cartesianToSpherical coordinate system
  const calculateCameraAngles = () => {
    if (controlsRef.current) {
      const azimuthal = controlsRef.current.getAzimuthalAngle(); // radians
      const polar = controlsRef.current.getPolarAngle(); // radians
      
      let yaw = (azimuthal * 180) / Math.PI;
      yaw = ((yaw - 180) + 360) % 360;
      
      const pitch = 90 - (polar * 180) / Math.PI;
      return { yaw: Math.round(yaw), pitch: Math.round(pitch) };
    }
    return { yaw, pitch };
  };

  // Separate useEffect for event listeners
  useEffect(() => {
    if (controlsRef.current) {
      // Add event listener for camera changes
      const handleCameraChange = (yaw: number, pitch: number) => {
        // 📍 Log hotspot positions when camera moves
        if (hotspots.length > 0) {
          console.log('📍 [VRScene] Camera moved, hotspot positions:');
          hotspots.forEach((hotspot, index) => {
            const [x, y, z] = sphericalToCartesian(hotspot.yaw, hotspot.pitch);
            console.log(`  Hotspot ${hotspot.id} (${hotspot.label || 'No label'}):`, {
              spherical: { yaw: hotspot.yaw, pitch: hotspot.pitch },
              cartesian: { x: x.toFixed(2), y: y.toFixed(2), z: z.toFixed(2) },
              isPreview: hotspot.id < 0 ? '🔴 Preview' : '🟢 Real'
            });
          });
          console.log(`  Camera: yaw=${yaw.toFixed(1)}°, pitch=${pitch.toFixed(1)}°`);
        }
        
        onCameraChange?.(yaw, pitch);
      };

      // Call once initially
      handleCameraChange(yaw, pitch);

      // Cleanup
      return () => {
        if (controlsRef.current) {
          controlsRef.current.removeEventListener('change', () => {
            const angles = calculateCameraAngles();
            handleCameraChange(angles.yaw, angles.pitch);
          });
        }
      };
    }
  }, [onCameraChange, hotspots, yaw, pitch]);

  // Add wheel event listener for zoom with throttling
  useEffect(() => {
    let lastWheelTime = 0;
    const throttleDelay = 16; // ~60fps throttling
    
    const handleWheel = (event: WheelEvent) => {
      if (!(event.target instanceof HTMLCanvasElement)) return;
      
      event.preventDefault();
      
      const now = Date.now();
      if (now - lastWheelTime < throttleDelay) return;
      lastWheelTime = now;
      
      const delta = event.deltaY;
      const zoomStep = 3;
      
      let newZoom = zoomLevel;
      if (delta > 0) {
        newZoom = Math.min(120, zoomLevel + zoomStep);
      } else {
        newZoom = Math.max(30, zoomLevel - zoomStep);
      }
      
      if (newZoom !== zoomLevel) {
        onZoomChange?.(newZoom);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [zoomLevel, onZoomChange]);

  const sphericalToCartesian = (yaw: number, pitch: number, radius: number = 450) => {
    // ✅ Ensure consistent, deterministic calculation
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    
    const x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = radius * Math.sin(pitchRad);
    const z = radius * Math.cos(pitchRad) * Math.cos(yawRad);
    
    return [x, y, z];
  };

  // ✅ Create a stable key for memoization - includes icon_type for icon changes
  const hotspotsKey = useMemo(() => {
    const key = hotspots.map(h => `${h.id}:${h.yaw}:${h.pitch}:${(h as any).icon_type || (h as any).type || (h as any).icon || 'default'}`).join('|');
    console.log('🔑 [VRScene] Hotspots key updated:', {
      totalHotspots: hotspots.length,
      key: key.length > 100 ? key.substring(0, 100) + '...' : key,
      hotspotsWithIconType: hotspots.filter(h => (h as any).icon_type).length
    });
    return key;
  }, [hotspots]);

  // ✅ Memoize hotspot positions to prevent unnecessary recalculation
  const memoizedHotspots = useMemo(() => {
    return hotspots.map((hotspot) => {
      let [x, y, z] = sphericalToCartesian(hotspot.yaw, hotspot.pitch);
      
      if (hotspot.id < 0) {
        z += 5;
      }
      
      return {
        ...hotspot,
        position: [x, y, z] as [number, number, number]
      };
    });
  }, [hotspotsKey]); // Use stable key instead of hotspots array reference

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#000000' }}>
      <Canvas 
        gl={{ 
          antialias: true, 
          alpha: false,
          outputColorSpace: 'srgb',
          toneMapping: 0, // NoToneMapping
          toneMappingExposure: 1.0
        }} 
        camera={{ position: [0, 0, 0], fov: zoomLevel, near: 0.1, far: 1100 }}
        onCreated={({ camera, gl }) => {
          camera.position.set(0, 0, 0);
          gl.setSize(window.innerWidth, window.innerHeight);
          gl.toneMapping = 0;
          gl.toneMappingExposure = 1.0;
          gl.outputColorSpace = 'srgb';
          (window as any).vrSceneCamera = camera;
        }}
      >
        <CameraController 
          zoomLevel={zoomLevel} 
          controlsRef={controlsRef} 
          targetYaw={yaw}
          targetPitch={pitch}
          sceneKey={panoramaUrl}
          onCameraChange={onCameraChange}
        />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          rotateSpeed={-0.5}
          zoomSpeed={0.5}
          minDistance={1}
          maxDistance={100}
          autoRotate={false}
          target={[0, 0, 0]}
          enableDamping={true}
          dampingFactor={0.03}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI - 0.1}
        />

        <PanoramaSphere
          panoramaUrl={panoramaUrl}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
          onSceneClick={onSceneClick}
          controlsRef={controlsRef}
        />

        {memoizedHotspots.map((hotspot) => {
          return (
            <Hotspot
              key={`hotspot-${hotspot.id}`}
              position={hotspot.position}
              hotspot={hotspot}
              onClick={() => {
                if (!previewMode) {
                  console.log('🚫 [VRScene] Navigation blocked - not in preview mode');
                  return;
                }

                console.log('🎯 [VRScene] Hotspot clicked in preview mode:', {
                  hotspot: hotspot,
                  targetScene: hotspot.to_scene,
                  actionType: (hotspot as any).action_type || 'none',
                  '🔗 SCREEN ID TO NAVIGATE TO': hotspot.to_scene
                });

                // Smart action handling based on type
                switch ((hotspot as any).action_type) {
                  case 'navigation':
                  case 'navigate':
                    if ((hotspot as any).to_scene && onHotspotClick) {
                      console.log('🔄 [VRScene] Triggering navigation to scene:', (hotspot as any).to_scene);
                      onHotspotClick((hotspot as any).to_scene);
                    }
                    break;
                  
                  case 'image':
                    console.log('🖼️ [VRScene] Image hotspot clicked - should show image modal');
                    // TODO: Implement image modal
                    break;
                  
                  case 'video':
                    console.log('🎥 [VRScene] Video hotspot clicked - should play video');
                    // TODO: Implement video player
                    break;
                  
                  case 'link':
                    console.log('🔗 [VRScene] Link hotspot clicked - should open URL');
                    const url = (hotspot as any).url || hotspot.label; // fallback to label if url not available
                    if (url && (url.startsWith('http') || url.startsWith('https'))) {
                      window.open(url, '_blank');
                    }
                    break;
                  
                  case 'info':
                    console.log('ℹ️ [VRScene] Info hotspot clicked - should show info panel');
                    // TODO: Implement info panel
                    break;
                  
                  case 'none':
                  case null:
                  case undefined:
                  default:
                    console.log('👁️ [VRScene] Display-only hotspot clicked - no action (action_type:', (hotspot as any).action_type, ')');
                    // Just show icon, no action - this is the default behavior
                    break;
                }
              }}
            />
          );
        })}

        {checkpoints.map((checkpoint, index) => (
          <CheckpointMarker
            key={`checkpoint-${checkpoint.id}-${index}`}
            position={sphericalToCartesian(checkpoint.yaw, checkpoint.pitch) as [number, number, number]}
            checkpoint={checkpoint}
            onClick={() => onCheckpointClick?.(checkpoint)}
          />
        ))}
      </Canvas>
    </div>
  );
});

export default VRScene; 