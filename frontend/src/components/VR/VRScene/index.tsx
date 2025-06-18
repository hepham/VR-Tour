import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, Mesh, RepeatWrapping, DoubleSide } from 'three';
import { NavigationConnection } from '../../../types';
import Hotspot from '../Hotspot';
import { CheckpointMarker } from '../../Checkpoint';
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
}

// Component to handle camera zoom updates with smooth transition and adaptive rotation speed
const CameraController: React.FC<{ 
  zoomLevel: number; 
  controlsRef: React.RefObject<any>;
  targetYaw: number;
  targetPitch: number;
  onCameraChange?: (yaw: number, pitch: number) => void;
}> = ({ zoomLevel, controlsRef, targetYaw, targetPitch, onCameraChange }) => {
  const { camera } = useThree();
  const targetFOV = useRef(zoomLevel);
  const currentYaw = useRef(targetYaw);
  const currentPitch = useRef(targetPitch);
  const isUserInteracting = useRef(false);
  const lastUpdateTime = useRef(0);
  const lastZoomLevel = useRef(zoomLevel);
  const lastNotificationTime = useRef(0);
  const lastCameraValues = useRef({ yaw: targetYaw, pitch: targetPitch });
  const finalUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
        const azimuthal = controlsRef.current.getAzimuthalAngle();
        const polar = controlsRef.current.getPolarAngle();
        currentYaw.current = ((azimuthal * 180) / Math.PI + 90 + 360) % 360;
        currentPitch.current = 90 - (polar * 180) / Math.PI;
        
        // Schedule a final update after user stops interacting
        finalUpdateTimeout.current = setTimeout(() => {
          const currentYawValue = ((azimuthal * 180) / Math.PI + 90 + 360) % 360;
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
        const azimuthalAngle = ((currentYaw.current - 90) * Math.PI) / 180;
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
      const currentYawValue = ((azimuthal * 180) / Math.PI + 90 + 360) % 360;
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
}> = ({ panoramaUrl, onImageLoad, onImageError, onSceneClick }) => {
  const meshRef = useRef<Mesh>(null);
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
      const point = intersection.point;
      
      // Convert 3D point to spherical coordinates
      const radius = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
      const pitch = Math.asin(point.y / radius) * (180 / Math.PI);
      
      // Calculate yaw with proper offset for coordinate system
      let yaw = Math.atan2(point.x, point.z) * (180 / Math.PI);
      yaw = ((yaw - 180) + 360) % 360; // Adjust for coordinate system offset
      
      onSceneClick(yaw, pitch);
    }
  };

  return (
    <mesh 
      ref={meshRef} 
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

const VRScene: React.FC<VRSceneProps> = ({
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
}) => {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Function to calculate yaw and pitch from camera rotation
  const calculateCameraAngles = () => {
    if (controlsRef.current) {
      const azimuthal = controlsRef.current.getAzimuthalAngle(); // radians
      const polar = controlsRef.current.getPolarAngle(); // radians
      const yaw = ((azimuthal * 180) / Math.PI + 90 + 360) % 360;
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
        onCameraChange?.(yaw, pitch);
      };

      controlsRef.current.addEventListener('change', () => {
        const angles = calculateCameraAngles();
        handleCameraChange(angles.yaw, angles.pitch);
      });
      
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
  }, [onCameraChange]);

  // Add wheel event listener for zoom with throttling
  useEffect(() => {
    let lastWheelTime = 0;
    const throttleDelay = 16; // ~60fps throttling
    
    const handleWheel = (event: WheelEvent) => {
      // Only handle wheel events when over canvas, not UI elements
      if (!(event.target instanceof HTMLCanvasElement)) {
        return;
      }
      
      event.preventDefault();
      
      const now = Date.now();
      if (now - lastWheelTime < throttleDelay) {
        return;
      }
      lastWheelTime = now;
      
      const delta = event.deltaY;
      const zoomStep = 3; // Smaller step for even smoother zooming
      
      let newZoom = zoomLevel;
      if (delta > 0) {
        // Scroll down = zoom out (increase FOV)
        newZoom = Math.min(120, zoomLevel + zoomStep);
      } else {
        // Scroll up = zoom in (decrease FOV)
        newZoom = Math.max(30, zoomLevel - zoomStep);
      }
      
      if (newZoom !== zoomLevel) {
        onZoomChange?.(newZoom);
      }
    };

    // Add event listener to window instead of canvas to avoid conflicts
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, onZoomChange]);

  // Convert spherical coordinates to 3D position for hotspots and checkpoints
  const sphericalToCartesian = (yaw: number, pitch: number, radius: number = 450) => {
    // Adjust yaw to match camera coordinate system (add 180 degrees offset)
    const adjustedYaw = yaw + 180;
    const yawRad = (adjustedYaw * Math.PI) / 180;
    const pitchRad = (-pitch * Math.PI) / 180; // Invert pitch to match camera
    
    const x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = radius * Math.sin(pitchRad);
    const z = radius * Math.cos(pitchRad) * Math.cos(yawRad);
    
    return [x, y, z];
  };

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
          // Disable tone mapping to preserve original colors
          gl.toneMapping = 0; // THREE.NoToneMapping
          gl.toneMappingExposure = 1.0;
          gl.outputColorSpace = 'srgb';
        }}
      >
        <CameraController 
          zoomLevel={zoomLevel} 
          controlsRef={controlsRef} 
          targetYaw={yaw}
          targetPitch={pitch}
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
        />

        {/* Render hotspots */}
        {hotspots.map((hotspot) => {
          const [x, y, z] = sphericalToCartesian(hotspot.yaw, hotspot.pitch);
          return (
            <Hotspot
              key={hotspot.id}
              position={[x, y, z]}
              hotspot={hotspot}
              onClick={() => onHotspotClick(hotspot.to_scene)}
            />
          );
        })}

        {/* Render checkpoints */}
        {checkpoints.map((checkpoint) => {
          const checkpointPosition = sphericalToCartesian(checkpoint.yaw, checkpoint.pitch) as [number, number, number];
          return (
            <CheckpointMarker
              key={checkpoint.id}
              position={checkpointPosition}
              checkpoint={checkpoint}
              onClick={() => onCheckpointClick?.(checkpoint)}
            />
          );
        })}
      </Canvas>
    </div>
  );
};

export default VRScene; 