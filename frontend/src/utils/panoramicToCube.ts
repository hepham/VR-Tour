// Utility to convert panoramic images to cube map for better performance
export interface CubeFaces {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
}

export interface TileInfo {
  face: keyof CubeFaces;
  url: string;
  isLoaded: boolean;
  texture?: THREE.Texture;
}

/**
 * Generate cube face URLs from a base panoramic image
 * In production, these would be pre-generated on the server
 */
export const generateCubeFaceUrls = (panoramicUrl: string): CubeFaces => {
  const baseName = panoramicUrl.split('/').pop()?.split('.')[0] || 'panorama';
  const baseDir = panoramicUrl.substring(0, panoramicUrl.lastIndexOf('/'));
  
  return {
    front: `${baseDir}/${baseName}_front.jpg`,
    back: `${baseDir}/${baseName}_back.jpg`, 
    left: `${baseDir}/${baseName}_left.jpg`,
    right: `${baseDir}/${baseName}_right.jpg`,
    top: `${baseDir}/${baseName}_top.jpg`,
    bottom: `${baseDir}/${baseName}_bottom.jpg`
  };
};

/**
 * Convert panoramic image to cube faces using Canvas API
 * This is a client-side conversion for demo purposes
 * In production, this should be done on the server
 */
export const convertPanoramicToCube = async (
  panoramicUrl: string,
  faceSize: number = 1024
): Promise<CubeFaces> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Cannot create 2D context'));
        return;
      }

      canvas.width = faceSize;
      canvas.height = faceSize;

      const faces: Partial<CubeFaces> = {};
      const faceNames: (keyof CubeFaces)[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];

      // Convert equirectangular to cube faces
      // This is a simplified conversion - in production use a proper library
      faceNames.forEach((faceName, index) => {
        ctx.clearRect(0, 0, faceSize, faceSize);
        
        // Calculate source coordinates for each face
        const sourceX = (index % 3) * (img.width / 3);
        const sourceY = Math.floor(index / 3) * (img.height / 2);
        const sourceWidth = img.width / 3;
        const sourceHeight = img.height / 2;

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, faceSize, faceSize
        );

        faces[faceName] = canvas.toDataURL('image/jpeg', 0.8);
      });

      resolve(faces as CubeFaces);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load panoramic image: ${panoramicUrl}`));
    };

    img.src = panoramicUrl;
  });
};

/**
 * Determine which cube faces are visible based on camera direction
 */
export const getVisibleFaces = (yaw: number, pitch: number, fov: number = 75): (keyof CubeFaces)[] => {
  const visibleFaces: (keyof CubeFaces)[] = [];
  
  // Normalize yaw to 0-360
  const normalizedYaw = ((yaw % 360) + 360) % 360;
  
  // Determine horizontal faces based on yaw
  if (normalizedYaw >= 315 || normalizedYaw < 45) {
    visibleFaces.push('front');
  }
  if (normalizedYaw >= 45 && normalizedYaw < 135) {
    visibleFaces.push('right');
  }
  if (normalizedYaw >= 135 && normalizedYaw < 225) {
    visibleFaces.push('back');
  }
  if (normalizedYaw >= 225 && normalizedYaw < 315) {
    visibleFaces.push('left');
  }

  // Add adjacent faces for smooth transitions
  if (fov > 60) {
    if (normalizedYaw >= 0 && normalizedYaw < 90) {
      visibleFaces.push('front', 'right');
    } else if (normalizedYaw >= 90 && normalizedYaw < 180) {
      visibleFaces.push('right', 'back');
    } else if (normalizedYaw >= 180 && normalizedYaw < 270) {
      visibleFaces.push('back', 'left');
    } else if (normalizedYaw >= 270 && normalizedYaw < 360) {
      visibleFaces.push('left', 'front');
    }
  }

  // Add top/bottom faces based on pitch
  if (pitch > 30) {
    visibleFaces.push('top');
  }
  if (pitch < -30) {
    visibleFaces.push('bottom');
  }

  // Remove duplicates
  return Array.from(new Set(visibleFaces));
};

/**
 * Calculate loading priority based on camera direction
 */
export const calculateLoadingPriority = (
  face: keyof CubeFaces,
  yaw: number,
  pitch: number
): number => {
  const normalizedYaw = ((yaw % 360) + 360) % 360;
  
  let priority = 0;
  
  // Primary face gets highest priority
  if (
    (face === 'front' && (normalizedYaw >= 315 || normalizedYaw < 45)) ||
    (face === 'right' && normalizedYaw >= 45 && normalizedYaw < 135) ||
    (face === 'back' && normalizedYaw >= 135 && normalizedYaw < 225) ||
    (face === 'left' && normalizedYaw >= 225 && normalizedYaw < 315)
  ) {
    priority += 100;
  }

  // Vertical faces priority based on pitch
  if (face === 'top' && pitch > 0) {
    priority += Math.abs(pitch);
  }
  if (face === 'bottom' && pitch < 0) {
    priority += Math.abs(pitch);
  }

  return priority;
}; 