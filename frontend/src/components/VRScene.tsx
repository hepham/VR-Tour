import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { TextureLoader, Mesh, SphereGeometry, MeshBasicMaterial, RepeatWrapping, DoubleSide } from 'three';
import { NavigationConnection } from '../types';
import CubeMapSphere from './CubeMapSphere';
import Hotspot from './Hotspot';

interface VRSceneProps {
  panoramaUrl: string;
  initialYaw: number;
  initialPitch: number;
  hotspots: NavigationConnection[];
  onHotspotClick: (sceneId: number) => void;
  onImageLoad?: () => void;
  onImageError?: () => void;
  onCameraChange?: (yaw: number, pitch: number) => void;
  useOptimization?: boolean; // New prop for enabling cube map optimization
}

const PanoramaSphere: React.FC<{
  panoramaUrl: string;
  onImageLoad?: () => void;
  onImageError?: () => void;
}> = ({ panoramaUrl, onImageLoad, onImageError }) => {
  const meshRef = useRef<Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!panoramaUrl) {
      console.error('No panorama URL provided');
      return;
    }

    console.log('Starting to load panorama:', panoramaUrl);
    setIsLoading(true);

    const loader = new TextureLoader();
    
    // Test if image exists first
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('Image preload successful, dimensions:', img.width, 'x', img.height);
      
              loader.load(
          panoramaUrl,
          (loadedTexture) => {
            console.log('Texture loaded successfully');
            // Configure texture for proper 360° display
            loadedTexture.wrapS = loadedTexture.wrapT = RepeatWrapping;
            loadedTexture.repeat.set(-1, -1); // Flip both horizontally and vertically
            loadedTexture.flipY = true; // Keep flipY as true
            
            setTexture(loadedTexture);
            setIsLoading(false);
            onImageLoad?.();
            console.log('Panorama texture loaded successfully:', panoramaUrl);
          },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading panorama texture:', error);
          console.error('Attempted to load URL:', panoramaUrl);
          setIsLoading(false);
          onImageError?.();
        }
      );
    };
    
    img.onerror = () => {
      console.error('Failed to preload image:', panoramaUrl);
      setIsLoading(false);
      onImageError?.();
    };
    
    img.src = panoramaUrl;
  }, [panoramaUrl, onImageLoad, onImageError]);

  if (isLoading) {
    return (
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
    );
  }

  if (!texture) {
    return (
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} scale={[-1, -1, 1]} position={[0, 0, 0]}>
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
  hotspots,
  onHotspotClick,
  onImageLoad,
  onImageError,
  onCameraChange,
  useOptimization = false,
}) => {
  const controlsRef = useRef<any>(null);

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
        gl={{ antialias: true, alpha: false }} 
        camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 1100 }}
        onCreated={({ camera, gl }) => {
          camera.position.set(0, 0, 0);
          gl.setSize(window.innerWidth, window.innerHeight);
        }}
      >
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
        />

        <CubeMapSphere
          panoramaUrl={panoramaUrl}
          currentYaw={initialYaw}
          currentPitch={initialPitch}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
          useOptimization={useOptimization}
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