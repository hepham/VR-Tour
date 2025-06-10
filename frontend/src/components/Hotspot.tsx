import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { NavigationConnection } from '../types';

interface HotspotProps {
  position: [number, number, number];
  hotspot: NavigationConnection;
  onClick: () => void;
}

const Hotspot: React.FC<HotspotProps> = ({ position, hotspot, onClick }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <sphereGeometry args={[hotspot.size || 5, 16, 16]} />
      <meshBasicMaterial 
        color={hovered ? '#ff6b6b' : (hotspot.color || '#ffffff')} 
        transparent 
        opacity={0.8}
      />
    </mesh>
  );
};

export default Hotspot; 