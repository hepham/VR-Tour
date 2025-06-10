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
- three>=0.155
- @react-three/fiber  # React Three.js integration
- @react-three/drei   # Three.js helpers
- vite>=4.0
- typescript>=5.0

## API Design Principles
- RESTful architecture
- Consistent JSON response format
- Proper HTTP status codes
- Pagination for large datasets
- Media URL generation for frontend consumption 