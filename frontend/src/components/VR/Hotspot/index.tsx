import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { NavigationConnection } from '../../../types';
import { HOTSPOT_ICONS } from '../../../constants/hotspots';

interface HotspotProps {
  position: [number, number, number];
  hotspot: NavigationConnection & { 
    type?: string; 
    icon?: string; 
    isPreview?: boolean; 
  };
  onClick: () => void;
}

const Hotspot: React.FC<HotspotProps> = ({ position, hotspot, onClick }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Get icon - memoized to prevent recalculation
  const icon = useMemo(() => {
    return hotspot.icon || HOTSPOT_ICONS[hotspot.type || 'navigation'] || '🚪';
  }, [hotspot.icon, hotspot.type]);

  // Billboard effect and floating animation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const hotspotPos = new Vector3(...position);
    const normal = hotspotPos.clone().normalize();
    
    // Billboard: face camera
    meshRef.current.lookAt(state.camera.position);
    
    // Floating animation
    const floatOffset = Math.sin(time * 1.5 + hotspotPos.x + hotspotPos.z) * 1.5;
    meshRef.current.position.copy(hotspotPos.clone().add(normal.clone().multiplyScalar(floatOffset)));
  });

  const scale = hovered ? 1.3 : 1;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={scale}
    >
      {/* Sphere background */}
      <sphereGeometry args={[8, 16, 16]} />
      <meshBasicMaterial 
        color={hovered ? "#ffffff" : (hotspot.color || "#ff6b6b")}
        transparent
        opacity={hovered ? 0.9 : 0.7}
      />
      
      {/* Icon overlay */}
      <Html center transform occlude={false} scale={3}>
        <div 
          style={{
            fontSize: '80px',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: '1',
            transform: hovered ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '80px',
            minHeight: '80px',
          }}
        >
          {icon}
        </div>
      </Html>
    </mesh>
  );
};

export default Hotspot; 