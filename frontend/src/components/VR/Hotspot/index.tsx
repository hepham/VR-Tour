import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Html } from '@react-three/drei';
import { NavigationConnection } from '../../../types';
import { getHotspotIcon, HOTSPOT_ICONS_LEGACY } from '../../../constants/hotspots';

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
  
  // ✅ Debug: Track position changes
  const lastPosition = useRef(position);
  if (JSON.stringify(lastPosition.current) !== JSON.stringify(position)) {
    console.log(`🚀 [Hotspot ${hotspot.id}] Position changed:`, {
      from: lastPosition.current,
      to: position,
      yaw: hotspot.yaw,
      pitch: hotspot.pitch
    });
    lastPosition.current = position;
  }

  // Get icon - memoized to prevent recalculation
  // Priority: icon_type > icon > type (legacy) > default
  const icon = useMemo(() => {
    // First check for icon_type (new unified system)
    if ((hotspot as any).icon_type) {
      return getHotspotIcon((hotspot as any).icon_type);
    }
    // Then check for direct icon
    if (hotspot.icon) {
      return hotspot.icon;
    }
    // Then check legacy type system
    if (hotspot.type && HOTSPOT_ICONS_LEGACY[hotspot.type]) {
      return HOTSPOT_ICONS_LEGACY[hotspot.type];
    }
    // Default fallback
    return '📍';
  }, [(hotspot as any).icon_type, hotspot.icon, hotspot.type]);

  // Billboard effect only - optimized to reduce lookAt calls
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // ✅ Throttle lookAt calls - only update when camera moves significantly
    const camera = state.camera;
    const mesh = meshRef.current;
    
    // Calculate distance between camera and last lookAt position
    const currentCameraKey = `${camera.position.x.toFixed(1)},${camera.position.y.toFixed(1)},${camera.position.z.toFixed(1)}`;
    
    if (!mesh.userData.lastCameraKey || mesh.userData.lastCameraKey !== currentCameraKey) {
      mesh.lookAt(camera.position);
      mesh.userData.lastCameraKey = currentCameraKey;
    }
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