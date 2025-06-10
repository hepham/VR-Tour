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
  const [clicked, setClicked] = useState(false);

  // Animate the hotspot
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 2;
      
      // Rotate slowly
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      
      // Scale animation on hover
      const targetScale = hovered ? 1.2 : clicked ? 0.8 : 1.0;
      const currentScale = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(currentScale + (targetScale - currentScale) * 0.1);
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick();
  };

  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (event: any) => {
    event.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  return (
    <group position={position}>
      {/* Main hotspot sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial
          color={hotspot.color || '#00ff88'}
          transparent
          opacity={hovered ? 0.9 : 0.7}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <ringGeometry args={[12, 16, 16]} />
        <meshBasicMaterial
          color={hotspot.color || '#00ff88'}
          transparent
          opacity={hovered ? 0.4 : 0.2}
          side={2} // DoubleSide
        />
      </mesh>

      {/* Label (if available) */}
      {hotspot.label && (
        <mesh position={[0, 20, 0]}>
          {/* For now, just a simple placeholder for the label */}
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default Hotspot; 