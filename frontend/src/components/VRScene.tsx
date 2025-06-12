import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, Mesh, RepeatWrapping, DoubleSide } from 'three';
import { NavigationConnection } from '../types';
import Hotspot from './Hotspot';

interface VRSceneProps {
  panoramaUrl: string;
  initialYaw: number;
  initialPitch: number;
  zoomLevel?: number;
  hotspots: NavigationConnection[];
  onHotspotClick: (sceneId: number) => void;
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
  initialYaw,
  initialPitch,
  zoomLevel = 75,
  hotspots,
  onHotspotClick,
  onImageLoad,
  onImageError,
  onCameraChange,
  onZoomChange,
}) => {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Convert degrees to radians and set initial camera position
  const initialRotationY = (initialYaw * Math.PI) / 180;
  const initialRotationX = (-initialPitch * Math.PI) / 180;

  // Function to calculate yaw and pitch from camera rotation
  const calculateCameraAngles = () => {
    if (controlsRef.current && controlsRef.current.object) {
      const camera = controlsRef.current.object;
      
      // Get camera's rotation in Euler angles
      const yaw = ((camera.rotation.y * 180) / Math.PI + 360) % 360;
      const pitch = (camera.rotation.x * 180) / Math.PI;
      
      return { yaw: Math.round(yaw), pitch: Math.round(pitch) };
    }
    return { yaw: initialYaw, pitch: initialPitch };
  };

  useEffect(() => {
    console.log('VRScene: Setting camera position - Yaw:', initialYaw, '° Pitch:', initialPitch, '°');
    if (controlsRef.current) {
      // Set camera rotation - add 180 degrees to Y to fix upside down
      controlsRef.current.object.rotation.set(
        initialRotationX, 
        initialRotationY + Math.PI, // Add 180 degrees 
        0
      );
      controlsRef.current.update();
      console.log('Camera rotation set to:', controlsRef.current.object.rotation);
    }
  }, [initialYaw, initialPitch, initialRotationX, initialRotationY]);

  // Separate useEffect for event listeners
  useEffect(() => {
    if (controlsRef.current) {
      // Add event listener for camera changes
      const handleCameraChange = () => {
        const angles = calculateCameraAngles();
        onCameraChange?.(angles.yaw, angles.pitch);
      };

      controlsRef.current.addEventListener('change', handleCameraChange);
      
      // Call once initially
      handleCameraChange();

      // Cleanup
      return () => {
        if (controlsRef.current) {
          controlsRef.current.removeEventListener('change', handleCameraChange);
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

  // Convert spherical coordinates to 3D position for hotspots
  const sphericalToCartesian = (yaw: number, pitch: number, radius: number = 450) => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    
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
      </Canvas>
    </div>
  );
};

export default VRScene; 