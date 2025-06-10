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
- Immersive 360° panoramic viewing
- Automatic audio narration
- Interactive hotspot navigation
- Minimap display with scene layout
- Navigation controls (back, fullscreen, audio toggle)
- Admin interface for content management

## Success Criteria
- Smooth 360° navigation experience
- Seamless scene transitions
- Responsive design across devices
- Efficient media loading and caching
- Intuitive content management system

## Technical Goals
- Modular, scalable architecture
- Optimized media handling
- Cross-browser compatibility
- Mobile-responsive design
- Clean API design with proper documentation 