"""
Models for VR Tours platform.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.urls import reverse


class Tour(models.Model):
    """
    A tour containing multiple connected scenes.
    """
    title = models.CharField(max_length=200, help_text="Tour title")
    description = models.TextField(blank=True, help_text="Tour description")
    thumbnail = models.ImageField(
        upload_to='tours/thumbnails/', 
        blank=True, 
        null=True,
        help_text="Tour thumbnail image"
    )
    is_active = models.BooleanField(default=True, help_text="Is tour available to view?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Tour"
        verbose_name_plural = "Tours"

    def __str__(self):
        return self.title

    @property
    def scene_count(self):
        """Return the number of scenes in this tour."""
        return self.scenes.count()

    def get_first_scene(self):
        """Get the first scene of the tour for starting navigation."""
        return self.scenes.first()


class Scene(models.Model):
    """
    A 360° panoramic scene within a tour.
    """
    tour = models.ForeignKey(
        Tour, 
        on_delete=models.CASCADE, 
        related_name='scenes',
        help_text="Tour this scene belongs to"
    )
    title = models.CharField(max_length=200, help_text="Scene title")
    description = models.TextField(blank=True, help_text="Scene description")
    
    # 360° panorama image (required)
    panorama_image = models.ImageField(
        upload_to='scenes/panoramas/',
        help_text="360° panoramic image for this scene"
    )
    
    # Optional voiceover audio
    voiceover_audio = models.FileField(
        upload_to='scenes/audio/',
        blank=True,
        null=True,
        help_text="Optional MP3 voiceover for this scene"
    )
    
    # Initial camera view
    initial_yaw = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)],
        help_text="Initial horizontal camera rotation (-180 to 180 degrees)"
    )
    initial_pitch = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)],
        help_text="Initial vertical camera rotation (-90 to 90 degrees)"
    )
    
    # Optional map/layout image
    map_image = models.ImageField(
        upload_to='scenes/maps/',
        blank=True,
        null=True,
        help_text="Optional map or layout image for this scene"
    )
    
    # Scene ordering within the tour
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order of this scene within the tour"
    )
    
    is_active = models.BooleanField(default=True, help_text="Is scene available to view?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['tour', 'order']
        verbose_name = "Scene"
        verbose_name_plural = "Scenes"
        unique_together = ['tour', 'order']

    def __str__(self):
        return f"{self.tour.title} - {self.title}"

    @property
    def hotspot_count(self):
        """Return the number of hotspots in this scene."""
        return self.source_hotspots.count()


class Hotspot(models.Model):
    """
    Interactive hotspot that connects two scenes.
    """
    source_scene = models.ForeignKey(
        Scene,
        on_delete=models.CASCADE,
        related_name='source_hotspots',
        help_text="Scene where this hotspot appears"
    )
    target_scene = models.ForeignKey(
        Scene,
        on_delete=models.CASCADE,
        related_name='target_hotspots',
        help_text="Scene this hotspot navigates to"
    )
    
    # Hotspot position in 3D space (spherical coordinates)
    yaw = models.FloatField(
        validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)],
        help_text="Horizontal position of hotspot (-180 to 180 degrees)"
    )
    pitch = models.FloatField(
        validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)],
        help_text="Vertical position of hotspot (-90 to 90 degrees)"
    )
    
    # Optional label for the hotspot
    label = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional label for this hotspot"
    )
    
    # Visual properties
    size = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.1), MaxValueValidator(5.0)],
        help_text="Size multiplier for hotspot (0.1 to 5.0)"
    )
    color = models.CharField(
        max_length=7,
        default='#ffffff',
        help_text="Hotspot color in hex format (e.g., #ffffff)"
    )
    
    is_active = models.BooleanField(default=True, help_text="Is hotspot clickable?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['source_scene', 'yaw']
        verbose_name = "Hotspot"
        verbose_name_plural = "Hotspots"

    def __str__(self):
        label = self.label if self.label else "Unnamed"
        return f"{self.source_scene.title} → {self.target_scene.title} ({label})"

    def clean(self):
        """Validate that source and target scenes belong to the same tour."""
        from django.core.exceptions import ValidationError
        
        if self.source_scene and self.target_scene:
            if self.source_scene.tour != self.target_scene.tour:
                raise ValidationError(
                    "Source and target scenes must belong to the same tour."
                )
            if self.source_scene == self.target_scene:
                raise ValidationError(
                    "Source and target scenes cannot be the same."
                ) 