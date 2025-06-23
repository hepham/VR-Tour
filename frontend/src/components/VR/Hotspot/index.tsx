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
      scale={scale}
    >
      {/* Icon only - no background */}
      <Html center transform occlude={false} scale={6}>
        <div 
          style={{
            fontSize: '160px',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
            userSelect: 'none',
            pointerEvents: 'auto',
            lineHeight: '1',
            transform: hovered ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '160px',
            minHeight: '160px',
            cursor: 'pointer',
          }}
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {icon}
        </div>
      </Html>
    </mesh>
  );
};

export default Hotspot; 