"""
Django REST Framework views for VR Tours platform.
"""
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from .models import Tour, Scene, Hotspot
from .serializers import (
    TourListSerializer,
    TourDetailSerializer,
    SceneListSerializer,
    SceneDetailSerializer,
    HotspotSerializer,
    HotspotCreateSerializer,
    SceneCreateSerializer,
)


class TourListAPIView(generics.ListAPIView):
    """
    API view to list all active tours.
    
    GET /api/tours/
    """
    serializer_class = TourListSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'scene_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return only active tours with optimized queries."""
        return Tour.objects.filter(is_active=True).prefetch_related(
            Prefetch('scenes', queryset=Scene.objects.filter(is_active=True).order_by('order'))
        )


class TourDetailAPIView(generics.RetrieveAPIView):
    """
    API view to retrieve a specific tour with all its scenes.
    
    GET /api/tours/{id}/
    """
    serializer_class = TourDetailSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return optimized queryset for tour details."""
        return Tour.objects.filter(is_active=True).prefetch_related(
            Prefetch(
                'scenes',
                queryset=Scene.objects.filter(is_active=True).order_by('order')
            )
        )


class TourScenesAPIView(generics.ListAPIView):
    """
    API view to list all scenes in a specific tour.
    
    GET /api/tours/{tour_id}/scenes/
    """
    serializer_class = SceneListSerializer
    
    def get_queryset(self):
        """Return scenes for the specified tour."""
        tour_id = self.kwargs['tour_id']
        return Scene.objects.filter(
            tour_id=tour_id,
            tour__is_active=True,
            is_active=True
        ).order_by('order')


class SceneDetailAPIView(generics.RetrieveAPIView):
    """
    API view to retrieve a specific scene with all its details and hotspots.
    
    GET /api/scenes/{id}/
    """
    serializer_class = SceneDetailSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return optimized queryset for scene details."""
        return Scene.objects.filter(
            is_active=True,
            tour__is_active=True
        ).select_related('tour').prefetch_related(
            Prefetch(
                'source_hotspots',
                queryset=Hotspot.objects.filter(is_active=True).select_related('target_scene')
            )
        )


class SceneHotspotsAPIView(generics.ListAPIView):
    """
    API view to list all hotspots for a specific scene.
    
    GET /api/scenes/{scene_id}/hotspots/
    """
    serializer_class = HotspotSerializer
    
    def get_queryset(self):
        """Return hotspots for the specified scene."""
        scene_id = self.kwargs['scene_id']
        return Hotspot.objects.filter(
            source_scene_id=scene_id,
            source_scene__is_active=True,
            target_scene__is_active=True,
            is_active=True
        ).select_related('target_scene')


@api_view(['GET'])
def api_overview(request):
    """
    API overview endpoint providing information about available endpoints.
    
    GET /api/
    """
    api_urls = {
        'Overview': '/api/',
        'Tours': {
            'List all tours': '/api/tours/',
            'Get tour details': '/api/tours/{id}/',
            'Get tour scenes': '/api/tours/{tour_id}/scenes/',
        },
        'Scenes': {
            'Get scene details': '/api/scenes/{id}/',
            'Get scene hotspots': '/api/scenes/{scene_id}/hotspots/',
        },
        'Search': {
            'Search tours': '/api/tours/?search={query}',
            'Order tours': '/api/tours/?ordering={field}',
        }
    }
    
    return Response({
        'message': 'Welcome to VR Tours API',
        'version': '1.0',
        'endpoints': api_urls,
        'documentation': 'Visit /admin/ for Django admin interface',
    })


@api_view(['GET'])
def tour_navigation(request, tour_id):
    """
    Get navigation data for a tour including scene connections.
    
    GET /api/tours/{tour_id}/navigation/
    """
    try:
        tour = get_object_or_404(Tour, id=tour_id, is_active=True)
        
        # Get all scenes and their hotspots
        scenes = Scene.objects.filter(
            tour=tour,
            is_active=True
        ).prefetch_related(
            Prefetch(
                'source_hotspots',
                queryset=Hotspot.objects.filter(is_active=True).select_related('target_scene')
            )
        ).order_by('order')
        
        # Build navigation graph
        navigation_data = {
            'tour': {
                'id': tour.id,
                'title': tour.title,
                'scene_count': scenes.count(),
            },
            'scenes': [],
            'connections': []
        }
        
        for scene in scenes:
            scene_data = {
                'id': scene.id,
                'title': scene.title,
                'order': scene.order,
                'initial_yaw': scene.initial_yaw,
                'initial_pitch': scene.initial_pitch,
                'panorama_image': scene.panorama_image.url if scene.panorama_image else None,
                'map_image': scene.map_image.url if scene.map_image else None,
                'voiceover_audio': scene.voiceover_audio.url if scene.voiceover_audio else None,
            }
            navigation_data['scenes'].append(scene_data)
            
            # Add hotspot connections
            for hotspot in scene.source_hotspots.all():
                connection = {
                    'id': hotspot.id,
                    'from_scene': scene.id,
                    'to_scene': hotspot.target_scene.id,
                    'yaw': hotspot.yaw,
                    'pitch': hotspot.pitch,
                    'label': hotspot.label,
                    'size': hotspot.size,
                    'color': hotspot.color,
                }
                navigation_data['connections'].append(connection)
        
        return Response(navigation_data)
        
    except Tour.DoesNotExist:
        return Response(
            {'error': 'Tour not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'An error occurred while fetching navigation data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def health_check(request):
    """
    Simple health check endpoint.
    
    GET /api/health/
    """
    return Response({
        'status': 'healthy',
        'message': 'VR Tours API is running'
    })


# Additional views for content management (optional, for future admin features)

class TourCreateAPIView(generics.CreateAPIView):
    """
    API view to create a new tour.
    """
    queryset = Tour.objects.all()
    serializer_class = TourDetailSerializer


class SceneCreateAPIView(generics.CreateAPIView):
    """
    API view to create a new scene.
    """
    queryset = Scene.objects.all()
    serializer_class = SceneCreateSerializer


class HotspotCreateAPIView(generics.CreateAPIView):
    """
    API view to create a new hotspot.
    """
    queryset = Hotspot.objects.all()
    serializer_class = HotspotCreateSerializer 