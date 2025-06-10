"""
URL configuration for VR Tours API.
"""
from django.urls import path
from . import views

app_name = 'tours'

urlpatterns = [
    # API Overview
    path('', views.api_overview, name='api-overview'),
    path('health/', views.health_check, name='health-check'),
    
    # Tours
    path('tours/', views.TourListAPIView.as_view(), name='tour-list'),
    path('tours/<int:id>/', views.TourDetailAPIView.as_view(), name='tour-detail'),
    path('tours/<int:tour_id>/scenes/', views.TourScenesAPIView.as_view(), name='tour-scenes'),
    path('tours/<int:tour_id>/navigation/', views.tour_navigation, name='tour-navigation'),
    
    # Scenes
    path('scenes/<int:id>/', views.SceneDetailAPIView.as_view(), name='scene-detail'),
    path('scenes/<int:scene_id>/hotspots/', views.SceneHotspotsAPIView.as_view(), name='scene-hotspots'),
    
    # Content management endpoints (optional)
    path('tours/create/', views.TourCreateAPIView.as_view(), name='tour-create'),
    path('scenes/create/', views.SceneCreateAPIView.as_view(), name='scene-create'),
    path('hotspots/create/', views.HotspotCreateAPIView.as_view(), name='hotspot-create'),
] 