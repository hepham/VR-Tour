# VR Tour System Architecture & Patterns

## 🎯 **MAJOR UPDATE: Unified Coordinate System Solution**
**Status**: ✅ **COMPLETED** - Perfect coordinate alignment achieved between click and drop events

## Core Architecture

### Frontend (React + Three.js)
```
src/
├── components/
│   ├── VR/
│   │   ├── VRScene/          # Main 3D scene with OrbitControls
│   │   ├── VRDemo/           # Standalone VR viewer
│   │   └── Hotspot/          # 3D hotspot markers
│   ├── Tour/
│   │   ├── TourViewer/       # Tour navigation container
│   │   ├── TourList/         # Tour management interface
│   │   └── SceneViewer/      # Individual scene display
│   ├── Editor/
│   │   ├── TourEditor/       # Main tour editing interface
│   │   ├── EditorPreview/    # Real-time tour preview with drag & drop
│   │   ├── HotspotEditor/    # Hotspot configuration forms
│   │   └── SceneEditor/      # Scene management
│   ├── Common/
│   │   ├── Controls/         # VR navigation controls
│   │   └── AudioPlayer/      # Audio integration
│   └── Checkpoint/
│       ├── CheckpointMarker/ # 3D checkpoint indicators
│       └── CheckpointModal/  # Checkpoint information display
├── utils/
│   └── coordinateSystem.ts   # 🎯 UNIFIED COORDINATE SYSTEM
├── services/
│   └── api.ts               # Backend API integration
└── types/
    └── index.ts             # TypeScript definitions
```

### Backend (Django REST Framework)
```
backend/
├── tours/
│   ├── models.py            # Tour, Scene, Hotspot, Checkpoint models
│   ├── serializers.py       # DRF serializers
│   ├── views.py             # API viewsets
│   └── urls.py              # API routing
└── vr_tours/
    ├── settings.py          # Django configuration
    └── urls.py              # Main URL configuration
```

## 🎯 **BREAKTHROUGH: Unified Coordinate System**

### **Problem Pattern (Resolved)**
Multiple coordinate conversion systems caused misalignment:
```typescript
// ❌ OLD PATTERN: Multiple conversion systems
VRScene.onClick() → Three.js raycasting → cartesianToSpherical()
EditorPreview.onDrop() → Screen math → screenToSpherical() 
// Result: Different coordinates for same screen position
```

### **Solution Pattern (Current)**
Single shared raycasting system for all interactions:
```typescript
// ✅ NEW PATTERN: Unified raycasting system
VRScene.onClick() → performSharedRaycasting()
EditorPreview.onDrop() → performSharedRaycasting()
// Result: Identical coordinates for same screen position
```

### **Shared Raycasting Architecture**
```typescript
// utils/coordinateSystem.ts
export const performSharedRaycasting = (
  screenX: number, 
  screenY: number, 
  canvasElement: HTMLCanvasElement,
  camera: THREE.Camera,
  sphereMesh: THREE.Mesh
): SphericalCoordinate | null => {
  // 1. Create Three.js Raycaster
  // 2. Convert screen to NDC coordinates  
  // 3. Perform sphere intersection
  // 4. Convert 3D point to spherical coordinates
  // 5. Apply consistent coordinate alignment
}

// Global Three.js object exposure
window.vrSceneCamera = camera;      // From VRScene Canvas.onCreated
window.vrSphereMesh = sphereMesh;   // From PanoramaSphere useEffect
```

## Design Patterns

### 1. **Coordinate System Unification**
```typescript
// Pattern: Single Source of Truth for Coordinates
interface CoordinateConversion {
  source: 'click' | 'drop' | 'programmatic';
  method: 'raycasting';  // Always use raycasting
  system: 'spherical';   // Always output spherical coordinates
  alignment: '+180°';    // Consistent reference frame alignment
}

// Implementation
const standardizeCoordinates = (
  screenPos: ScreenCoordinate,
  interactionType: 'click' | 'drop'
): SphericalCoordinate => {
  return performSharedRaycasting(
    screenPos.x, screenPos.y, 
    getThreeCanvas(), 
    window.vrSceneCamera, 
    window.vrSphereMesh
  );
};
```

### 2. **React + Three.js Integration**
```typescript
// Pattern: Ref-based Three.js Object Access
const VRScene = () => {
  const cameraRef = useRef<THREE.Camera>();
  const meshRef = useRef<THREE.Mesh>();
  
  // Expose objects globally for cross-component access
  useEffect(() => {
    (window as any).vrSceneCamera = cameraRef.current;
    (window as any).vrSphereMesh = meshRef.current;
  }, []);
  
  return (
    <Canvas onCreated={({ camera }) => {
      cameraRef.current = camera;
      // Global exposure for shared raycasting
    }}>
      <PanoramaSphere ref={meshRef} />
    </Canvas>
  );
};
```

### 3. **State Management Pattern**
```typescript
// Pattern: Centralized State with TypeScript
interface TourState {
  tours: Tour[];
  currentTour: Tour | null;
  currentScene: Scene | null;
  camera: CameraState;
  hotspots: NavigationConnection[];
  previewHotspots: NavigationConnection[]; // For drag & drop
}

// Implementation
const useTourState = () => {
  const [state, setState] = useState<TourState>(initialState);
  
  const updateCameraPosition = (yaw: number, pitch: number) => {
    setState(prev => ({
      ...prev,
      camera: { ...prev.camera, yaw, pitch }
    }));
  };
  
  return { state, updateCameraPosition };
};
```

### 4. **Performance Optimization Pattern**
```typescript
// Pattern: Throttled Updates for Smooth VR
const useCameraThrottling = () => {
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  const throttledUpdate = useMemo(() => 
    throttle((yaw: number, pitch: number) => {
      onCameraChange?.(yaw, pitch);
    }, isUserInteracting ? 16 : 100), // 60fps vs 10fps
    [isUserInteracting]
  );
  
  return { throttledUpdate, setIsUserInteracting };
};
```

### 5. **Component Communication Pattern**
```typescript
// Pattern: Props Down, Events Up with TypeScript
interface VRSceneProps {
  // Data down
  panoramaUrl: string;
  hotspots: NavigationConnection[];
  camera: CameraState;
  
  // Events up  
  onCameraChange: (yaw: number, pitch: number) => void;
  onHotspotClick: (sceneId: number) => void;
  onSceneClick: (yaw: number, pitch: number) => void;
}

// Implementation ensures type safety and clear data flow
```

## Data Flow Patterns

### 1. **Tour Creation Flow**
```
TourEditor → TourMetadataForm → API → Backend → Database
         ↓
SceneEditor → Image Upload → Scene Creation → Hotspot Editor
         ↓
HotspotEditor → Drag & Drop → Coordinate Conversion → Preview
         ↓
EditorPreview → Real-time Rendering → User Validation
```

### 2. **Coordinate Conversion Flow**
```
Screen Interaction (click/drop) 
         ↓
performSharedRaycasting()
         ↓
Three.js Raycaster → Sphere Intersection → 3D Point
         ↓
cartesianToSpherical() → Spherical Coordinates
         ↓
+180° Alignment → Final Coordinates
         ↓
Hotspot Positioning → Visual Rendering
```

### 3. **VR Viewing Flow**
```
TourViewer → Scene Selection → VRScene Rendering
         ↓
Camera Controls → OrbitControls → Smooth Navigation
         ↓
Hotspot Interaction → Scene Transition → Audio/Visual Effects
         ↓
Checkpoint System → Progress Tracking → Guided Experience
```

## Error Handling Patterns

### 1. **Coordinate System Validation**
```typescript
// Pattern: Defensive Coordinate Programming
const validateCoordinates = (coord: SphericalCoordinate): boolean => {
  return (
    coord.yaw >= 0 && coord.yaw < 360 &&
    coord.pitch >= -90 && coord.pitch <= 90
  );
};

const safeCoordinateConversion = (screenPos: ScreenCoordinate) => {
  try {
    const result = performSharedRaycasting(/* ... */);
    if (result && validateCoordinates(result)) {
      return result;
    }
    throw new Error('Invalid coordinates generated');
  } catch (error) {
    console.error('Coordinate conversion failed:', error);
    return null; // Graceful degradation
  }
};
```

### 2. **Three.js Object Availability**
```typescript
// Pattern: Safe Three.js Object Access
const getThreeObjects = () => {
  const camera = (window as any).vrSceneCamera;
  const mesh = (window as any).vrSphereMesh;
  const canvas = getThreeCanvas();
  
  if (!camera || !mesh || !canvas) {
    console.warn('Three.js objects not available for raycasting');
    return null;
  }
  
  return { camera, mesh, canvas };
};
```

## Performance Patterns

### 1. **Memory Management**
```typescript
// Pattern: Proper Three.js Cleanup
useEffect(() => {
  return () => {
    // Cleanup textures, geometries, materials
    texture?.dispose();
    geometry?.dispose();
    material?.dispose();
  };
}, []);
```

### 2. **Optimized Rendering**
```typescript
// Pattern: Conditional Updates
const shouldUpdatePosition = (
  newPos: CameraState, 
  oldPos: CameraState
): boolean => {
  const threshold = 0.1; // degrees
  return (
    Math.abs(newPos.yaw - oldPos.yaw) > threshold ||
    Math.abs(newPos.pitch - oldPos.pitch) > threshold
  );
};
```

## Security Patterns

### 1. **Type Safety**
```typescript
// Pattern: Strict TypeScript with Runtime Validation
interface StrictHotspot extends NavigationConnection {
  readonly id: string;
  readonly sceneId: number;
  readonly coordinates: Readonly<SphericalCoordinate>;
}

const validateHotspot = (data: unknown): data is StrictHotspot => {
  // Runtime type checking
  return typeof data === 'object' && /* ... validation logic */;
};
```

### 2. **Input Sanitization**
```typescript
// Pattern: Coordinate Bounds Checking
const sanitizeCoordinates = (yaw: number, pitch: number) => ({
  yaw: Math.max(0, Math.min(360, yaw)),
  pitch: Math.max(-90, Math.min(90, pitch))
});
```

## Future Architecture Considerations

### 1. **WebXR Integration**
```typescript
// Planned: VR Headset Support
interface XRCapabilities {
  hasVRHeadset: boolean;
  supportsHandTracking: boolean;
  supportsRoomScale: boolean;
}

const useXRDetection = (): XRCapabilities => {
  // WebXR feature detection and capability reporting
};
```

### 2. **Micro-frontend Architecture**
```typescript
// Planned: Module Federation for Large Scale
interface VRModule {
  viewer: React.ComponentType<VRViewerProps>;
  editor: React.ComponentType<VREditorProps>;
  analytics: React.ComponentType<AnalyticsProps>;
}

// Separate deployable modules for different concerns
```

**Current Status**: 🎯 **Architecture is solid and scalable. Core coordinate system unified and working perfectly. Ready for advanced features and production deployment.** 