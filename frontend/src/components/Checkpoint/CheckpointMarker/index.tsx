import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

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

interface CheckpointMarkerProps {
  position: [number, number, number];
  checkpoint: Checkpoint;
  onClick: (checkpoint: Checkpoint) => void;
}

const CheckpointMarker: React.FC<CheckpointMarkerProps> = ({
  position,
  checkpoint,
  onClick,
}) => {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Animate the checkpoint marker
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      // Scale animation when hovered
      const targetScale = hovered ? 1.2 : 1.0;
      groupRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
    }
  });

  // Get icon color based on checkpoint type
  const getCheckpointColor = () => {
    if (checkpoint.color) return checkpoint.color;
    
    switch (checkpoint.type) {
      case 'info': return '#4A90E2';
      case 'video': return '#E74C3C';
      case 'image': return '#27AE60';
      case 'gallery': return '#9B59B6';
      default: return '#F39C12';
    }
  };

  // Get icon emoji based on checkpoint type
  const getCheckpointIcon = () => {
    if (checkpoint.icon) return checkpoint.icon;
    
    switch (checkpoint.type) {
      case 'info': return 'ℹ️';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'gallery': return '🎨';
      default: return '📍';
    }
  };

  const size = (checkpoint.size || 2) * 4.0; // Increased by 10x (0.8 * 10 = 8.0)

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={() => onClick(checkpoint)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Pin/Marker main body - teardrop shape */}
      <mesh position={[0, size * 0.5, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[size * 0.8, 16, 16]} />
        <meshBasicMaterial 
          color={getCheckpointColor()} 
          transparent 
          opacity={hovered ? 0.95 : 0.85}
        />
      </mesh>
      
      {/* Pin point/tail - cone pointing down */}
      <mesh position={[0, -size * 0.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[size * 0.4, size * 1.0, 8]} />
        <meshBasicMaterial 
          color={getCheckpointColor()} 
          transparent 
          opacity={hovered ? 0.95 : 0.85}
        />
      </mesh>
      
      {/* White background circle for icon area */}
      <mesh position={[0, size * 0.5, size * 0.81]}>
        <circleGeometry args={[size * 0.45, 16]} />
        <meshBasicMaterial 
          color="white" 
          transparent 
          opacity={0.95}
        />
      </mesh>
      
      {/* Icon background - smaller colored circle */}
      <mesh position={[0, size * 0.5, size * 0.82]}>
        <circleGeometry args={[size * 0.35, 16]} />
        <meshBasicMaterial 
          color={getCheckpointColor()} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Glow effect when hovered */}
      {hovered && (
        <mesh position={[0, size * 0.2, 0]}>
          <sphereGeometry args={[size * 1.2, 16, 16]} />
          <meshBasicMaterial 
            color={getCheckpointColor()} 
            transparent 
            opacity={0.15}
          />
        </mesh>
      )}
      
      {/* Pulsing ring effect */}
      <mesh position={[0, size * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.0, size * 1.2, 32]} />
        <meshBasicMaterial 
          color={getCheckpointColor()} 
          transparent 
          opacity={hovered ? 0.3 : 0.15}
          side={2} // DoubleSide
        />
      </mesh>

      {/* Title label when hovered */}
      {hovered && (
        <group position={[0, size * 1.8, 0]}>
          {/* Background for text */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[Math.max(checkpoint.title.length * 0.3, 4), 1.2]} />
            <meshBasicMaterial 
              color="#000000" 
              transparent 
              opacity={0.8}
            />
          </mesh>
          
          {/* Border for text background */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[Math.max(checkpoint.title.length * 0.3, 4) + 0.2, 1.4]} />
            <meshBasicMaterial 
              color={getCheckpointColor()} 
              transparent 
              opacity={0.9}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default CheckpointMarker; 