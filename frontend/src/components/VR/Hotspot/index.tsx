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

  // Billboard effect only - no floating to prevent movement
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const hotspotPos = new Vector3(...position);
    
    // Billboard: face camera
    meshRef.current.lookAt(state.camera.position);
    
    // No floating animation - keep at exact position
    meshRef.current.position.copy(hotspotPos);
  });

  const scale = hovered ? 1.1 : 1;

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
    >
      {/* Icon only - optimized size for VR interaction (target: ~100-120px) */}
      <Html center transform occlude={false} scale={15}>
        <div 
          style={{
            fontSize: '50px',
            color: 'white',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.95)',
            userSelect: 'none',
            pointerEvents: 'auto',
            lineHeight: '1',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '100px',
            minHeight: '100px',
            cursor: 'pointer',
            // Optimized size for VR interaction
            width: '100px',
            height: '100px',
          }}
          onClick={() => {
            console.log('🎯 [Hotspot] Clicked hotspot:', {
              hotspot: hotspot,
              position: position,
              target_scene_id: hotspot.to_scene,
              label: hotspot.label,
              '🔗 SCREEN ID TO NAVIGATE TO': hotspot.to_scene
            });
            onClick();
          }}
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