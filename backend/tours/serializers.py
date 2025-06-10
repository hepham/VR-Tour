"""
Django REST Framework serializers for VR Tours platform.
"""
from rest_framework import serializers
from .models import Tour, Scene, Hotspot


class HotspotSerializer(serializers.ModelSerializer):
    """Serializer for Hotspot model."""
    
    target_scene_title = serializers.CharField(source='target_scene.title', read_only=True)
    
    class Meta:
        model = Hotspot
        fields = [
            'id',
            'target_scene',
            'target_scene_title',
            'yaw',
            'pitch',
            'label',
            'size',
            'color',
            'is_active',
        ]
        read_only_fields = ['id']


class SceneListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Scene in list views."""
    
    hotspot_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Scene
        fields = [
            'id',
            'title',
            'description',
            'panorama_image',
            'map_image',
            'order',
            'hotspot_count',
            'is_active',
        ]


class SceneDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Scene with hotspots."""
    
    hotspots = HotspotSerializer(source='source_hotspots', many=True, read_only=True)
    hotspot_count = serializers.ReadOnlyField()
    tour_title = serializers.CharField(source='tour.title', read_only=True)
    
    class Meta:
        model = Scene
        fields = [
            'id',
            'tour',
            'tour_title',
            'title',
            'description',
            'panorama_image',
            'voiceover_audio',
            'initial_yaw',
            'initial_pitch',
            'map_image',
            'order',
            'hotspots',
            'hotspot_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TourListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Tour in list views."""
    
    scene_count = serializers.ReadOnlyField()
    first_scene = serializers.SerializerMethodField()
    
    class Meta:
        model = Tour
        fields = [
            'id',
            'title',
            'description',
            'thumbnail',
            'scene_count',
            'first_scene',
            'is_active',
            'created_at',
        ]
    
    def get_first_scene(self, obj):
        """Get the first scene ID for starting the tour."""
        first_scene = obj.get_first_scene()
        return first_scene.id if first_scene else None


class TourDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Tour with scenes."""
    
    scenes = SceneListSerializer(many=True, read_only=True)
    scene_count = serializers.ReadOnlyField()
    first_scene = serializers.SerializerMethodField()
    
    class Meta:
        model = Tour
        fields = [
            'id',
            'title',
            'description',
            'thumbnail',
            'scenes',
            'scene_count',
            'first_scene',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_first_scene(self, obj):
        """Get the first scene data for starting the tour."""
        first_scene = obj.get_first_scene()
        if first_scene:
            return {
                'id': first_scene.id,
                'title': first_scene.title,
                'panorama_image': first_scene.panorama_image.url if first_scene.panorama_image else None,
            }
        return None


class HotspotCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating hotspots."""
    
    class Meta:
        model = Hotspot
        fields = [
            'source_scene',
            'target_scene',
            'yaw',
            'pitch',
            'label',
            'size',
            'color',
            'is_active',
        ]
    
    def validate(self, data):
        """Validate hotspot data."""
        source_scene = data.get('source_scene')
        target_scene = data.get('target_scene')
        
        if source_scene and target_scene:
            # Check if scenes belong to the same tour
            if source_scene.tour != target_scene.tour:
                raise serializers.ValidationError(
                    "Source and target scenes must belong to the same tour."
                )
            
            # Check if source and target are different
            if source_scene == target_scene:
                raise serializers.ValidationError(
                    "Source and target scenes cannot be the same."
                )
        
        return data


class SceneCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating scenes."""
    
    class Meta:
        model = Scene
        fields = [
            'tour',
            'title',
            'description',
            'panorama_image',
            'voiceover_audio',
            'initial_yaw',
            'initial_pitch',
            'map_image',
            'order',
            'is_active',
        ]
    
    def validate_panorama_image(self, value):
        """Validate panorama image file."""
        if value:
            # Check file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Panorama image file size cannot exceed 10MB."
                )
            
            # Check file type
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError(
                    "Only image files are allowed for panorama."
                )
        
        return value
    
    def validate_voiceover_audio(self, value):
        """Validate voiceover audio file."""
        if value:
            # Check file size (max 20MB)
            if value.size > 20 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Audio file size cannot exceed 20MB."
                )
            
            # Check file type
            allowed_types = ['audio/mpeg', 'audio/mp3', 'audio/wav']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only MP3 and WAV audio files are allowed."
                )
        
        return value 