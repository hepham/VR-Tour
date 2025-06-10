import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, BoxGeometry, MeshBasicMaterial, DoubleSide, Texture } from 'three';
import { 
  CubeFaces, 
  TileInfo, 
  getVisibleFaces, 
  calculateLoadingPriority,
  convertPanoramicToCube 
} from '../utils/panoramicToCube';

interface CubeMapSphereProps {
  panoramaUrl: string;
  currentYaw: number;
  currentPitch: number;
  onImageLoad?: () => void;
  onImageError?: () => void;
  useOptimization?: boolean; // Toggle for performance optimization
}

const CubeMapSphere: React.FC<CubeMapSphereProps> = ({
  panoramaUrl,
  currentYaw,
  currentPitch,
  onImageLoad,
  onImageError,
  useOptimization = true,
}) => {
  const meshRef = useRef<Mesh>(null);
  const [cubeFaces, setCubeFaces] = useState<CubeFaces | null>(null);
  const [loadedTextures, setLoadedTextures] = useState<{ [key: string]: Texture }>({});
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert panoramic to cube faces
  useEffect(() => {
    if (!panoramaUrl || !useOptimization) return;

    console.log('Converting panoramic to cube faces...');
    setIsConverting(true);
    setError(null);

    convertPanoramicToCube(panoramaUrl, 512) // Smaller face size for better performance
      .then((faces) => {
        console.log('Cube faces conversion completed');
        setCubeFaces(faces);
        setIsConverting(false);
        onImageLoad?.();
      })
      .catch((err) => {
        console.error('Failed to convert panoramic to cube:', err);
        setError(err.message);
        setIsConverting(false);
        onImageError?.();
      });
  }, [panoramaUrl, useOptimization, onImageLoad, onImageError]);

  // Get visible faces based on camera direction
  const visibleFaces = useMemo(() => {
    if (!useOptimization) return ['front', 'back', 'left', 'right', 'top', 'bottom'];
    return getVisibleFaces(currentYaw, currentPitch, 75);
  }, [currentYaw, currentPitch, useOptimization]);

  // Load textures for visible faces with priority
  useEffect(() => {
    if (!cubeFaces || !useOptimization) return;

    const loader = new TextureLoader();
    const loadPromises: Promise<void>[] = [];

    // Sort faces by loading priority
    const facesToLoad = visibleFaces.sort((a, b) => {
      const priorityA = calculateLoadingPriority(a, currentYaw, currentPitch);
      const priorityB = calculateLoadingPriority(b, currentYaw, currentPitch);
      return priorityB - priorityA;
    });

    console.log('Loading cube faces:', facesToLoad);

    facesToLoad.forEach((face) => {
      if (loadedTextures[face]) return; // Already loaded

      const faceUrl = cubeFaces[face as keyof CubeFaces];
      if (!faceUrl) return;

      const promise = new Promise<void>((resolve) => {
        loader.load(
          faceUrl,
          (texture) => {
            texture.flipY = false;
            setLoadedTextures(prev => ({ ...prev, [face]: texture }));
            console.log(`Loaded cube face: ${face}`);
            resolve();
          },
          undefined,
          (error) => {
            console.error(`Failed to load cube face ${face}:`, error);
            resolve();
          }
        );
      });

      loadPromises.push(promise);
    });

    // Cleanup: unload textures for non-visible faces
    Object.keys(loadedTextures).forEach((faceKey) => {
      const face = faceKey as keyof CubeFaces;
      if (!visibleFaces.includes(face)) {
        setLoadedTextures(prev => {
          const { [faceKey]: removed, ...rest } = prev;
          removed?.dispose?.();
          console.log(`Unloaded cube face: ${faceKey}`);
          return rest;
        });
      }
    });

  }, [cubeFaces, visibleFaces, currentYaw, currentPitch, useOptimization]);

  // Fallback: Load full panoramic image if optimization is disabled
  const fallbackTexture = useLoader(
    TextureLoader,
    useOptimization ? '' : panoramaUrl,
    undefined,
    (error) => {
      console.error('Failed to load fallback texture:', error);
      onImageError?.();
    }
  );

  useEffect(() => {
    if (!useOptimization && fallbackTexture) {
      fallbackTexture.wrapS = fallbackTexture.wrapT = 1000; // RepeatWrapping
      fallbackTexture.repeat.set(-1, 1);
      fallbackTexture.flipY = true;
      onImageLoad?.();
    }
  }, [fallbackTexture, useOptimization, onImageLoad]);

  // Create materials for each face
  const materials = useMemo(() => {
    if (!useOptimization) {
      // Fallback: single material for sphere
      return new MeshBasicMaterial({
        map: fallbackTexture,
        side: DoubleSide,
        transparent: true,
      });
    }

    // Cube mapping: different material for each face
    const faceOrder: (keyof CubeFaces)[] = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    return faceOrder.map((face) => {
      const texture = loadedTextures[face];
      return new MeshBasicMaterial({
        map: texture || null,
        side: DoubleSide,
        transparent: true,
        opacity: texture ? 1 : 0, // Hide faces without texture
      });
    });
  }, [loadedTextures, fallbackTexture, useOptimization]);

  if (isConverting) {
    return (
      <mesh>
        <boxGeometry args={[1000, 1000, 1000]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
    );
  }

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1000, 1000, 1000]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} scale={useOptimization ? [1, 1, 1] : [-1, 1, 1]}>
      {useOptimization ? (
        <boxGeometry args={[1000, 1000, 1000]} />
      ) : (
        <sphereGeometry args={[500, 60, 40]} />
      )}
      {Array.isArray(materials) ? (
        materials.map((material, index) => (
          <primitive key={index} object={material} attach={`material-${index}`} />
        ))
      ) : (
        <primitive object={materials} attach="material" />
      )}
    </mesh>
  );
};

export default CubeMapSphere; 