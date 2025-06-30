# 360° VR Tour Web Platform - Project Brief

## Overview
A full-stack web platform for creating and viewing immersive 360° virtual reality tours. Users can navigate through connected scenes using interactive hotspots, with audio narration and visual aids.

## Core Requirements

### System Architecture
- **Frontend**: React + Three.js + Vite (Static hosting)
- **Backend**: Django + Django REST Framework (Media hosting)
- **Database**: PostgreSQL/MySQL for production

### Data Structure
1. **Tour**: Container for multiple related scenes
2. **Scene**: Individual 360° panoramic views with:
   - 360° panorama image
   - Optional voiceover audio (MP3)
   - Initial camera view (yaw/pitch)
   - Optional map/layout image
   - Interactive hotspots
3. **Hotspot**: Navigation points connecting scenes with coordinates and labels

### Key Features
- **VR Viewing Experience**
  - Immersive 360° panoramic viewing with Three.js
  - Automatic audio narration with manual controls
  - Interactive hotspot navigation between scenes
  - Smooth camera transitions and zoom functionality
  - Navigation controls (back, fullscreen, audio toggle)
  - Responsive design for desktop and mobile devices

- **Content Creation System (TourEditor)**
  - Visual tour creation and editing interface
  - Drag-and-drop 360° image upload with preview
  - Visual hotspot placement on panoramic viewer
  - Scene management with ordering and metadata
  - Real-time tour preview integration
  - Form validation and auto-save functionality

- **Backend Administration**
  - Django admin interface for content management
  - RESTful API for frontend integration
  - File upload and media serving capabilities
  - User authentication and content organization

## Success Criteria ✅
- ✅ **Smooth 360° navigation experience** - Advanced Three.js implementation with 60fps performance
- ✅ **Seamless scene transitions** - Optimized camera controller with scene change detection
- ✅ **Responsive design across devices** - Professional UI/UX for desktop and mobile
- ✅ **Efficient media loading and caching** - Optimized texture management and performance
- ✅ **Intuitive content management system** - Complete TourEditor with visual editing
- ✅ **Stable coordinate system** - Unified raycasting for perfect hotspot positioning
- ✅ **Performance optimization** - Intelligent throttling and user interaction awareness

## Technical Goals
- Modular, scalable architecture
- Optimized media handling
- Cross-browser compatibility
- Mobile-responsive design
- Clean API design with proper documentation 