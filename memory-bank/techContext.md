# Technical Context

## Technology Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Media Storage**: Django file handling with potential CDN integration
- **CORS**: django-cors-headers for frontend communication

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **3D Engine**: Three.js for 360° panoramic rendering
- **Audio**: HTML5 Audio API for voiceover playback
- **State Management**: React Context/useState for application state

### Development Tools
- **Package Manager**: npm/yarn (Frontend), pip (Backend)
- **Code Quality**: ESLint, Prettier (Frontend), Black, Flake8 (Backend)
- **Version Control**: Git

## Project Structure

```
vr-tour-platform/
├── backend/                    # Django backend
│   ├── vr_tours/              # Main Django project
│   ├── tours/                 # Tours Django app
│   ├── requirements.txt       # Python dependencies
│   └── manage.py
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API communication
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utility functions
│   ├── package.json           # Node dependencies
│   └── vite.config.js
└── memory-bank/               # Project documentation
```

## Key Dependencies

### Backend Dependencies
- django>=4.2
- djangorestframework>=3.14
- django-cors-headers>=4.0
- Pillow>=10.0  # Image processing
- python-decouple  # Environment variables

### Frontend Dependencies
- react>=18.0
- react-dom>=18.0
- three>=0.155
- @react-three/fiber>=8.13  # React Three.js integration
- @react-three/drei>=9.80   # Three.js helpers
- axios>=1.5.0             # API communication
- vite>=4.0
- typescript>=5.0
- @types/react>=18.2
- @types/react-dom>=18.2
- @types/three>=0.155

## Development and Testing Assets
- **Demo 360° Image**: `iStock_2170832197.jpg` (17MB panoramic image)
  - Used for standalone demo mode testing
  - Configured viewing angles: yaw: 73°, pitch: -31°
  - Demonstrates full VR functionality without backend dependency

## Core Utilities and Performance Systems
- **Coordinate System**: `utils/coordinateSystem.ts` - Unified coordinate conversion system
  - Shared raycasting utility for consistent click/drop behavior
  - Spherical ↔ Cartesian conversion functions
  - Debug utilities for coordinate validation
- **Performance Optimization**: Intelligent throttling and memoization patterns
  - User interaction awareness (60fps vs 10fps adaptive updates)
  - Scene change detection for instant camera positioning
  - Hotspot position memoization with stable keys
- **Component Stability**: Anti-remounting patterns and lifecycle optimization
  - Stable component keys to prevent unnecessary remounts
  - Optimized useFrame hooks with position-based caching
  - Billboard effect optimization for 3D hotspot rendering

## API Design Principles
- RESTful architecture
- Consistent JSON response format
- Proper HTTP status codes
- Pagination for large datasets
- Media URL generation for frontend consumption
- CORS configuration for frontend-backend communication 