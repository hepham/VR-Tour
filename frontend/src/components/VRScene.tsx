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
const CameraController: React.FC<{ zoomLevel: number; controlsRef: React.RefObject<any> }> = ({ zoomLevel, controlsRef }) => {
  const { camera } = useThree();
  const targetFOV = useRef(zoomLevel);
  
  useEffect(() => {
    targetFOV.current = zoomLevel;
  }, [zoomLevel]);
  
  useFrame((state, delta) => {
    // Update OrbitControls for smooth damping
    if (controlsRef.current) {
      controlsRef.current.update();
      
      // Adaptive rotation speed based on zoom level
      // When zoomed in (low FOV), reduce rotation speed
      // When zoomed out (high FOV), increase rotation speed
      const normalizedZoom = (zoomLevel - 30) / (120 - 30); // 0-1 scale
      const baseRotateSpeed = -0.5;
      const adaptiveSpeed = baseRotateSpeed * (0.3 + normalizedZoom * 0.7); // 0.3x to 1.0x speed
      
      controlsRef.current.rotateSpeed = adaptiveSpeed;
    }
    
    if ('fov' in camera) {
      // Smooth interpolation to target FOV
      const currentFOV = camera.fov;
      const difference = targetFOV.current - currentFOV;
      
      if (Math.abs(difference) > 0.1) {
        // Lerp with smooth factor (higher = faster transition)
        const smoothFactor = 8.0;
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

  // Controlled camera rotation effect
  React.useEffect(() => {
    if (
      typeof yaw === 'number' &&
      typeof pitch === 'number' &&
      controlsRef.current
    ) {
      // Yaw: azimuthal angle (horizontal), Pitch: polar angle (vertical)
      // Azimuthal: 0 = -Z (forward), increases counterclockwise (right = positive)
      // Polar: 0 = up, PI/2 = horizontal, PI = down
      const azimuthalAngle = ((yaw - 90) * Math.PI) / 180; // adjust for your scene's forward direction
      const polarAngle = ((90 - pitch) * Math.PI) / 180;   // 0 = up, 90 = horizontal, 180 = down

      controlsRef.current.setAzimuthalAngle(azimuthalAngle);
      controlsRef.current.setPolarAngle(polarAngle);
      controlsRef.current.update();
    }
  }, [yaw, pitch]);

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
        <CameraController zoomLevel={zoomLevel} controlsRef={controlsRef} />
        
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
          dampingFactor={0.05}
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
            console.log(`Checkpoint ${checkpoint.id} at yaw:${checkpoint.yaw}°, pitch:${checkpoint.pitch}° -> position:`, checkpointPosition);
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