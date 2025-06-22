# Active Context

## Current Work Focus
Expanding the VR Tour platform with content creation capabilities. The viewing experience is complete - now building **TourEditor** for admin/content creators to manage tours, scenes, and hotspots through a sophisticated admin interface.

## Recent Changes
- **Complete frontend VR implementation** with VRScene, VRDemo, and supporting components
- **Advanced Three.js integration** with React Three Fiber for smooth 360° navigation
- **Working demo mode** using provided 360° panoramic image (iStock_2170832197.jpg)
- **API service layer** implemented for backend communication
- **Checkpoint system** added for educational/informational markers within scenes
- **Audio integration** for scene narration and background sounds
- **Advanced camera controls** with smooth transitions and zoom functionality
- **🐛 BUG FIX**: Fixed hotspot creation during camera rotation in EditorPreview
- **🐛 CRITICAL BUG FIX**: Fixed coordinate system mismatch between hotspot placement and click detection

## Current Implementation Status

### ✅ Completed Components
1. **VRScene**: Sophisticated 360° panoramic rendering with Three.js
   - Smooth camera controls with adaptive rotation speed
   - Hotspot rendering and interaction
   - Checkpoint markers for educational content
   - Performance-optimized texture loading
   
2. **VRDemo**: Standalone demo mode for testing 360° functionality
   - Works with static 360° image (iStock_2170832197.jpg)
   - Configurable initial camera position (yaw: 73°, pitch: -31°)
   
3. **TourViewer**: Complete tour experience with navigation
   - Scene transitions and state management
   - Audio controls and playback
   - Integration with backend API
   
4. **TourList**: Tour browsing interface with responsive design
   - Grid layout for tour cards
   - Search and filtering capabilities
   
5. **API Service**: Complete backend communication layer
   - Tour fetching and navigation data
   - Scene detail retrieval
   - Media URL handling for cross-origin assets

### ✅ NEW: TourEditor Implementation Complete
1. **Content Management Interface** (95% Complete)
   - ✅ Main TourEditor component with sidebar + main layout
   - ✅ Tabbed interface (Tour Settings, Scenes, Hotspots)
   - ✅ Tour metadata form with validation
   - ✅ Scene management with drag-and-drop support
   - ✅ 360° image upload with preview
   - ✅ Visual hotspot placement system
   - ✅ Real-time preview integration with VRScene

2. **TourEditor Components Built**
   - ✅ **TourEditor**: Main container with responsive layout
   - ✅ **TourMetadataForm**: Tour info and settings management
   - ✅ **SceneEditor**: Scene creation, editing, and file upload
   - ✅ **HotspotEditor**: Visual hotspot placement and connections
   - ✅ **EditorPreview**: Real-time VR preview integration
   - ✅ **Navigation Integration**: Editor accessible from main app

### 🔄 Continuing Work Areas  
1. **Backend Integration Testing**
   - API integration for TourEditor CRUD operations
   - File upload handling for panoramic images
   - Data validation and error handling

## Technical Implementation Highlights

### Advanced VR Features
- **Camera Controller**: Sophisticated camera management with smooth interpolation
- **Performance Optimization**: Throttled updates during user interaction
- **Adaptive Controls**: Zoom-dependent rotation speed adjustment
- **Memory Management**: Efficient texture loading and cleanup

### User Experience Features
- **Multi-mode Navigation**: Demo mode, tour list, and immersive viewing
- **Responsive Design**: Works on desktop and mobile devices
- **Audio Integration**: Synchronized narration with scene changes
- **Interactive Elements**: Hotspots and educational checkpoints

## Current Focus Areas

### 1. Integration Testing
- Ensure smooth data flow between Django backend and React frontend
- Test with actual tour data from backend API
- Validate media serving and CORS configuration

### 2. Performance Optimization
- Monitor Three.js rendering performance
- Optimize texture loading for large panoramic images
- Implement progressive loading for better user experience

### 3. User Experience Enhancement
- Refine navigation controls and feedback
- Improve loading states and error handling
- Add accessibility features

## Active Decisions

### Architecture Choices (Validated)
- ✅ **Three.js + React Three Fiber**: Excellent performance and developer experience
- ✅ **React Context for State**: Simple and effective for current requirements
- ✅ **API-first approach**: Clean separation between backend and frontend

### New Technical Decisions
- **Performance Strategy**: Aggressive throttling during user interaction
- **Camera Control**: Smooth interpolation with user-aware behavior
- **Development Mode**: Demo mode for standalone testing without backend

## Immediate Next Steps: Backend Integration & Polish

### 1. Backend Integration Priority
- **API Integration**: Connect TourEditor to Django backend CRUD operations
- **File Upload**: Implement 360° image upload to Django media system
- **Data Persistence**: Save/load tours, scenes, and hotspot configurations
- **Image Processing**: Backend optimization for panoramic images

### 2. TourEditor Enhancement Areas
1. **Auto-save Functionality**: Prevent data loss during editing sessions
2. **Drag-and-Drop Scene Ordering**: Visual scene sequence management
3. **Advanced Hotspot Features**: Rich content support and styling options
4. **Validation & Error Handling**: Comprehensive form validation
5. **Mobile Editor Experience**: Touch-friendly interface optimization
6. **Tour Preview Testing**: End-to-end content creation workflow

### 3. Recent Bug Fixes Completed ✅
- **Fixed Hotspot Creation Issue**: Hotspots were being created unintentionally during camera rotation. Now hotspots are only created via drag & drop from the toolbar icons, not by clicking on the 360° image during rotation.
- **Fixed Hotspot Coordinate Mismatch**: The coordinates of dropped hotspots now accurately match the drop position. Replaced complex raycasting calculation with simplified viewport-based coordinate conversion that properly accounts for camera position, zoom level, and field of view.
- **🔥 CRITICAL: Fixed Coordinate System Mismatch**: There was a major coordinate system inconsistency between:
  - **EditorPreview.screenToSpherical()**: Used for calculating hotspot placement coordinates when dropping from toolbar
  - **VRScene.handleSphereClick()**: Used for calculating coordinates when clicking on the sphere
  
  **The Problem**: Different offset calculations caused placed hotspots to appear at wrong coordinates (e.g., placed at yaw: 39.89°, pitch: 11.69° but clicked at yaw: 130.90°, pitch: 44.64°)
  
  **The Solution**: Completely rewrote `screenToSpherical()` to match VRScene's coordinate system exactly:
  - Uses same world-space ray transformation as VRScene
  - Applies same yaw offset: `yaw = ((yaw - 180) + 360) % 360`
  - Matches pitch calculation: `pitch = Math.asin(worldY / radius) * (180 / Math.PI)`
  - Now both systems use identical coordinate space for consistent hotspot placement

### 3. Production Readiness
- **File Upload**: Implement chunked upload for large panoramic images
- **Visual Hotspot Placement**: Enhance click-to-place functionality
- **Scene Management**: Test drag-and-drop scene reordering
- **Form Validation**: Comprehensive validation for tour metadata
- **Auto-save**: Implement automatic saving of editor state

## Next Session Goals
1. **Backend Integration**: Connect TourEditor to Django API endpoints
2. **File Upload Implementation**: Large 360° image upload handling
3. **Data Flow Testing**: End-to-end tour creation and editing workflow
4. **Mobile Optimization**: Ensure editor works on mobile devices 

# VR Tour Coordinate System & Hotspot Drop - Complete Solution

## Problem Summary
User was implementing drag-and-drop hotspot placement in a VR tour application where coordinates between click events and drop events were misaligned, showing differences of ~86° yaw and ~5-30° pitch.

## Root Cause Analysis
The fundamental issue was **inconsistent coordinate systems** between different interaction methods:

### Original Problem:
- **Click coordinates**: Used Three.js raycasting → `cartesianToSpherical` conversion
- **Drop coordinates**: Used manual screen-to-spherical calculation
- **Result**: Large coordinate mismatches despite targeting same screen positions

### Multiple Coordinate System Issues:
1. **Reference Frame Differences**: -180° vs +90° vs +180° offsets across different functions
2. **Pitch Inversion Mismatches**: Some functions inverted pitch, others didn't  
3. **Different Calculation Methods**: Raycasting vs mathematical projection vs empirical scaling

## Complete Solution: Unified Raycasting System

### 1. Shared Raycasting Utility (`utils/coordinateSystem.ts`)
```typescript
/**
 * 🎯 SHARED RAYCASTING UTILITY
 * Centralized raycasting function để cả click và drop đều dùng cùng logic
 */
export const performSharedRaycasting = (
  screenX: number, 
  screenY: number, 
  canvasElement: HTMLCanvasElement,
  camera: any, // THREE.Camera
  sphereMesh: any // THREE.Mesh
): SphericalCoordinate | null => {
  // Implementation uses Three.js Raycaster for consistent results
}

export const getThreeCanvas = (element: HTMLElement): HTMLCanvasElement | null => {
  // Helper to find Three.js canvas element
}
```

### 2. Three.js Object Exposure (VRScene)
```typescript
// In Canvas onCreated callback
onCreated={({ camera, gl }) => {
  // ✅ Expose camera globally for shared raycasting
  (window as any).vrSceneCamera = camera;
}}

// In PanoramaSphere component  
useEffect(() => {
  if (actualMeshRef.current) {
    // ✅ Expose mesh globally for shared raycasting
    (window as any).vrSphereMesh = actualMeshRef.current;
  }
}, []);
```

### 3. Unified Drop Handler (EditorPreview)
```typescript
const handleDrop = (e: React.DragEvent) => {
  // ✅ PERFECT SOLUTION: Use shared raycasting utility!
  const canvas = getThreeCanvas(e.currentTarget as HTMLElement);
  const camera = (window as any).vrSceneCamera;
  const sphereMesh = (window as any).vrSphereMesh;
  
  if (camera && sphereMesh && canvas) {
    // ✅ Use exact same raycasting as click system
    const raycastResult = performSharedRaycasting(
      e.clientX, e.clientY, canvas, camera, sphereMesh
    );
    
    if (raycastResult) {
      // Perfect coordinate match with click system!
      const finalCoord = raycastResult;
    }
  }
};
```

## Key Technical Achievements

### ✅ Coordinate System Alignment
- **Before**: Multiple conversion functions with different offsets (+90°, -180°, +180°)
- **After**: Single raycasting system used by both click and drop

### ✅ Pitch Inversion Fix  
- **Before**: Some functions inverted pitch (`-pitch`), others didn't
- **After**: Consistent pitch handling across all coordinate conversions

### ✅ Reference Frame Unification
- **Before**: Different reference frames between OrbitControls and raycasting
- **After**: All coordinates use same +180° alignment with camera reference frame

### ✅ Performance Optimization
- **Before**: Complex empirical calculations with multiple fallback methods
- **After**: Direct Three.js raycasting for accurate, fast coordinate conversion

## Implementation Results

### Perfect Coordinate Matching
```javascript
// Expected console output:
📷 CAMERA EXPOSED GLOBALLY: [Camera object]
🌐 SPHERE MESH EXPOSED GLOBALLY: [Mesh object]  
🎯 USING SHARED RAYCASTING UTILITY
✅ SHARED RAYCASTING SUCCESS: {yaw: 177.85, pitch: -1.06}
🎯 FINAL DROP COORDINATES: {yaw: 177.85, pitch: -1.06}
⚖️ DROP vs LAST CLICK COMPARISON: ✅ Close match! (< 2° difference)
```

### Hotspot Drop Functionality
- ✅ **Visual Preview**: Hotspots appear instantly at drop locations
- ✅ **Coordinate Accuracy**: Drop and click coordinates match within 2-3°
- ✅ **Performance**: Smooth drag & drop with real-time coordinate conversion
- ✅ **UI Controls**: Clear button for preview hotspots, unique ID generation

## Architecture Benefits

### 1. **Single Source of Truth**
- All coordinate conversions go through shared raycasting utility
- Eliminates coordinate system inconsistencies

### 2. **Maintainability**  
- Changes to coordinate logic only need to be made in one place
- Easier debugging and testing

### 3. **Extensibility**
- New interaction types (touch, gestures) can use same raycasting system
- Consistent coordinate handling for future features

## Debug & Testing Guidelines

### Console Debug Flow
1. **Camera Exposure**: Check `📷 CAMERA EXPOSED GLOBALLY`
2. **Mesh Exposure**: Check `🌐 SPHERE MESH EXPOSED GLOBALLY`
3. **Click Coordinates**: Check `🔍 VRScene CLICK coordinates`
4. **Drop Coordinates**: Check `🎯 FINAL DROP COORDINATES`
5. **Comparison**: Check `⚖️ DROP vs LAST CLICK COMPARISON`

### Expected Accuracy
- **Yaw difference**: < 2°
- **Pitch difference**: < 3°
- **Status**: `✅ Close match!` instead of `❌ Still misaligned`

## Historical Context

This solution resolves a multi-session debugging effort that included:
- Initial coordinate system investigation (86° yaw difference)
- Multiple empirical scaling attempts
- Camera coordinate system alignment fixes
- Pitch inversion corrections
- Finally: Complete unification via shared raycasting

**Key Insight**: The problem wasn't with individual coordinate calculations, but with **using different calculation methods** for the same logical operation (screen position → spherical coordinates).

**Final Solution**: **Use the same method (Three.js raycasting) for both click and drop events.** 