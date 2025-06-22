/**
 * Coordinate System Utilities for VR Components
 * 
 * Đảm bảo tất cả VR components (VRDemo, VRScene, EditorPreview) 
 * sử dụng cùng một hệ thống coordinate conversion
 */

import * as THREE from 'three';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalCoordinate {
  yaw: number;   // 0-360°, 0° = North, 90° = East, 180° = South, 270° = West
  pitch: number; // -90° to 90°, 0° = horizon, +90° = zenith, -90° = nadir
}

export interface ScreenCoordinate {
  x: number; // Screen pixel X
  y: number; // Screen pixel Y
}

export interface CameraState {
  yaw: number;
  pitch: number;
  zoom: number; // FOV in degrees
}

/**
 * Chuyển đổi từ 3D Cartesian point (từ Three.js raycasting) sang spherical coordinates
 * Đây là hệ tọa độ chuẩn được sử dụng trong VRScene handleSphereClick
 */
export const cartesianToSpherical = (point: Point3D, radius: number = 500): SphericalCoordinate => {
  // Chuẩn hóa point về sphere radius
  const normalizedPoint = {
    x: point.x / radius,
    y: point.y / radius,
    z: point.z / radius
  };

  // Tính yaw (azimuth) từ X và Z
  let yaw = Math.atan2(normalizedPoint.x, normalizedPoint.z) * (180 / Math.PI);
  yaw = ((yaw - 180) + 360) % 360; // Adjust offset và normalize 0-360°

  // Tính pitch (elevation) từ Y
  const pitch = Math.asin(normalizedPoint.y) * (180 / Math.PI);

  return { yaw, pitch };
};

/**
 * Chuyển đổi từ spherical coordinates sang 3D Cartesian point
 * Để render hotspots trong Three.js scene
 */
export const sphericalToCartesian = (spherical: SphericalCoordinate, radius: number = 500): Point3D => {
  // ✅ UPDATED: Match với VRScene sphericalToCartesian (NO pitch inversion)
  const adjustedYaw = spherical.yaw; // No extra offset needed
  const pitchRad = (spherical.pitch * Math.PI) / 180; // ✅ FIXED: Remove pitch inversion
  const yawRad = (adjustedYaw * Math.PI) / 180;

  return {
    x: radius * Math.cos(pitchRad) * Math.sin(yawRad),
    y: radius * Math.sin(pitchRad),
    z: radius * Math.cos(pitchRad) * Math.cos(yawRad)
  };
};

/**
 * Chuyển đổi từ screen coordinates sang spherical coordinates
 * Sử dụng trong EditorPreview khi drag & drop hotspots
 */
export const screenToSpherical = (
  screen: ScreenCoordinate,
  canvasSize: { width: number; height: number },
  camera: CameraState
): SphericalCoordinate => {
  // ✅ NEW APPROACH: Use simplified raycasting-like calculation
  // Convert screen coordinates to normalized device coordinates (-1 to 1)
  const ndcX = (screen.x / canvasSize.width) * 2 - 1;
  const ndcY = -((screen.y / canvasSize.height) * 2 - 1); // Flip Y for 3D coordinates
  
  console.log('🎯 NDC conversion:', {
    screen: { x: screen.x, y: screen.y },
    ndc: { x: ndcX, y: ndcY },
    canvas: canvasSize
  });
  
  // Convert NDC to spherical coordinates based on camera FOV
  const fovRad = (camera.zoom * Math.PI) / 180;
  const aspect = canvasSize.width / canvasSize.height;
  
  // Calculate view angles from center
  const viewAngleX = ndcX * (fovRad / 2) * aspect;
  const viewAngleY = ndcY * (fovRad / 2);
  
  console.log('🎯 View angles:', {
    fov: { rad: fovRad, deg: camera.zoom },
    aspect,
    viewAngles: { x: viewAngleX, y: viewAngleY },
    viewAnglesDeg: { x: viewAngleX * 180 / Math.PI, y: viewAngleY * 180 / Math.PI }
  });
  
  // Apply camera rotation to get world coordinates
  const targetYaw = (camera.yaw + (viewAngleX * 180 / Math.PI)) % 360;
  const targetPitch = camera.pitch + (viewAngleY * 180 / Math.PI);
  
  // Normalize yaw to 0-360
  const normalizedYaw = targetYaw < 0 ? targetYaw + 360 : targetYaw;
  const clampedPitch = Math.max(-90, Math.min(90, targetPitch));
  
  console.log('📍 Final calculation:', {
    camera: { yaw: camera.yaw, pitch: camera.pitch },
    viewOffset: { yaw: viewAngleX * 180 / Math.PI, pitch: viewAngleY * 180 / Math.PI },
    result: { yaw: normalizedYaw, pitch: clampedPitch }
  });
  
  return { yaw: normalizedYaw, pitch: clampedPitch };
};

/**
 * Debug utility: So sánh tọa độ từ các source khác nhau
 */
export const debugCoordinateComparison = (
  screenCoord: ScreenCoordinate,
  clickCoord: SphericalCoordinate,
  dragCoord: SphericalCoordinate,
  cameraState: CameraState
) => {
  const yawDiff = Math.abs(clickCoord.yaw - dragCoord.yaw);
  const pitchDiff = Math.abs(clickCoord.pitch - dragCoord.pitch);
  
  console.group('🎯 COORDINATE SYSTEM DEBUG');
  console.log('📍 Screen Position:', screenCoord);
  console.log('🖱️ Click Coordinates:', clickCoord);
  console.log('🎯 Drag Coordinates:', dragCoord);
  console.log('📷 Camera State:', cameraState);
  console.log('⚖️ Differences:', { yawDiff, pitchDiff });
  console.log(yawDiff < 5 && pitchDiff < 5 ? '✅ COORDINATES MATCH!' : '❌ COORDINATE MISMATCH!');
  console.groupEnd();
  
  return { yawDiff, pitchDiff, isMatch: yawDiff < 5 && pitchDiff < 5 };
};

/**
 * Normalize angle vào range 0-360°
 */
export const normalizeYaw = (yaw: number): number => {
  const result = yaw % 360;
  return result < 0 ? result + 360 : result;
};

/**
 * Clamp pitch vào range -90° to 90°
 */
export const clampPitch = (pitch: number): number => {
  return Math.max(-90, Math.min(90, pitch));
};

/**
 * Tính khoảng cách góc giữa 2 spherical coordinates
 */
export const angularDistance = (coord1: SphericalCoordinate, coord2: SphericalCoordinate): number => {
  const yawDiff = Math.min(
    Math.abs(coord1.yaw - coord2.yaw),
    360 - Math.abs(coord1.yaw - coord2.yaw)
  );
  const pitchDiff = Math.abs(coord1.pitch - coord2.pitch);
  
  return Math.sqrt(yawDiff * yawDiff + pitchDiff * pitchDiff);
};

/**
 * 🎯 SHARED RAYCASTING UTILITY
 * Centralized raycasting function để cả click và drop đều dùng cùng logic
 * Đảm bảo perfect coordinate alignment giữa các interaction types
 */
export const performSharedRaycasting = (
  screenX: number, 
  screenY: number, 
  canvasElement: HTMLCanvasElement,
  camera: any, // THREE.Camera
  sphereMesh: any // THREE.Mesh
): SphericalCoordinate | null => {
  try {
    // Use imported Three.js classes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Get canvas bounding rect để convert screen coordinates
    const rect = canvasElement.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    
    console.log('🎯 SHARED RAYCASTING INPUT:', {
      screen: { x: screenX, y: screenY },
      canvas: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      relative: { x, y }
    });
    
    // Convert to normalized device coordinates (-1 to 1)
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;
    
    console.log('🎯 NDC CONVERSION:', { mouse_x: mouse.x, mouse_y: mouse.y });
    
    // Setup raycaster từ camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Perform intersection với sphere
    const intersects = raycaster.intersectObject(sphereMesh);
    
    if (intersects.length > 0) {
      const point3D = intersects[0].point;
      console.log('🎯 RAW 3D INTERSECTION:', point3D);
      
      // ✅ Use EXACT same conversion như VRScene
      const rawSphericalCoord = cartesianToSpherical(point3D);
      
      // ✅ Apply EXACT same alignment như VRScene (+180°)
      const alignedYaw = (rawSphericalCoord.yaw + 180) % 360;
      const finalCoord = { yaw: alignedYaw, pitch: rawSphericalCoord.pitch };
      
      console.log('🎯 SHARED RAYCASTING RESULT:', {
        raw: rawSphericalCoord,
        aligned: finalCoord,
        note: 'Perfect alignment với VRScene click system'
      });
      
      return finalCoord;
    } else {
      console.log('❌ No intersection found');
      return null;
    }
  } catch (error) {
    console.error('❌ Shared raycasting error:', error);
    return null;
  }
};

/**
 * 🎯 CANVAS ACCESS UTILITY  
 * Helper để get Three.js canvas element từ React components
 */
export const getThreeCanvas = (containerElement: HTMLElement): HTMLCanvasElement | null => {
  const canvas = containerElement.querySelector('canvas');
  if (!canvas) {
    console.error('❌ Three.js canvas not found in container');
    return null;
  }
  return canvas;
}; 