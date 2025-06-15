import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, Mesh, RepeatWrapping, DoubleSide } from 'three';
import { NavigationConnection } from '../types';
import Hotspot from './Hotspot';
import CheckpointMarker from './CheckpointMarker';

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
      };

      controlsRef.current.addEventListener('start', onStart);
      controlsRef.current.addEventListener('end', onEnd);

      return () => {
        controlsRef.current?.removeEventListener('start', onStart);
        controlsRef.current?.removeEventListener('end', onEnd);
      };
    }
  }, [controlsRef]);
  
  useFrame((state, delta) => {
    if (controlsRef.current) {
      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTime.current;
      lastUpdateTime.current = now;

      // Update controls
      controlsRef.current.update();
      
      if (!isUserInteracting.current) {
        // Only lerp when user is not interacting
        const lerpFactor = Math.min(1.0, 1.5 * delta); // Giảm tốc độ lerp từ 3.0 xuống 1.5
        currentYaw.current += (targetYaw - currentYaw.current) * lerpFactor;
        currentPitch.current += (targetPitch - currentPitch.current) * lerpFactor;

        // Convert to radians and set camera angles
        const azimuthalAngle = ((currentYaw.current - 90) * Math.PI) / 180;
        const polarAngle = ((90 - currentPitch.current) * Math.PI) / 180;

        controlsRef.current.setAzimuthalAngle(azimuthalAngle);
        controlsRef.current.setPolarAngle(polarAngle);
      }
      
      // Adjust rotation speed based on zoom level and interaction state
      const normalizedZoom = (zoomLevel - 30) / (120 - 30);
      const baseRotateSpeed = isUserInteracting.current ? 0.8 : 1.2; // Giảm tốc độ khi đang tương tác
      const adaptiveSpeed = baseRotateSpeed * (0.5 + normalizedZoom * 0.5); // Giảm range của tốc độ
      controlsRef.current.rotateSpeed = adaptiveSpeed;

      // Get current angles from controls
      const azimuthal = controlsRef.current.getAzimuthalAngle();
      const polar = controlsRef.current.getPolarAngle();
      const currentYawValue = ((azimuthal * 180) / Math.PI + 90 + 360) % 360;
      const currentPitchValue = 90 - (polar * 180) / Math.PI;

      // Notify parent of camera changes
      onCameraChange?.(currentYawValue, currentPitchValue);
    }
    
    if ('fov' in camera) {
      // Smooth interpolation to target FOV
      const currentFOV = camera.fov;
      const difference = targetFOV.current - currentFOV;
      
      if (Math.abs(difference) > 0.1) {
        const smoothFactor = 6.0; // Giảm tốc độ zoom
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
}> = ({ panoramaUrl, onImageLoad, onImageError }) => {
  const meshRef = useRef<Mesh>(null);
  
  // Use useLoader hook for reliable texture loading
  const texture = useLoader(TextureLoader, panoramaUrl);
  
  useEffect(() => {
    if (texture) {
      console.log('PanoramaSphere: Configuring loaded texture');
      // Configure texture for proper 360° display
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(-1, 1); // Flip horizontally to fix mirroring
      texture.flipY = true; // Set to true for proper vertical orientation
      texture.colorSpace = 'srgb';
      texture.generateMipmaps = false;
      onImageLoad?.();
      console.log('PanoramaSphere: Texture configured successfully');
    }
  }, [texture, onImageLoad]);

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]} position={[0, 0, 0]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial 
        map={texture} 
        side={DoubleSide} 
        toneMapped={false}
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