"""
Django admin configuration for VR Tours platform.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import Tour, Scene, Hotspot


class SceneInline(admin.TabularInline):
    """Inline admin for scenes within a tour."""
    model = Scene
    extra = 0
    fields = ['title', 'order', 'panorama_image', 'is_active']
    readonly_fields = ['hotspot_count']


class HotspotInline(admin.TabularInline):
    """Inline admin for hotspots within a scene."""
    model = Hotspot
    fk_name = 'source_scene'
    extra = 0
    fields = ['target_scene', 'label', 'yaw', 'pitch', 'size', 'color', 'is_active']


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    """Admin interface for Tour model."""
    list_display = ['title', 'scene_count', 'is_active', 'created_at', 'thumbnail_preview']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['scene_count', 'created_at', 'updated_at', 'thumbnail_preview']
    inlines = [SceneInline]
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'thumbnail', 'thumbnail_preview', 'is_active')
        }),
        ('Statistics', {
            'fields': ('scene_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def thumbnail_preview(self, obj):
        """Display thumbnail preview in admin."""
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
                obj.thumbnail.url
            )
        return "No thumbnail"
    thumbnail_preview.short_description = "Thumbnail Preview"


@admin.register(Scene)
class SceneAdmin(admin.ModelAdmin):
    """Admin interface for Scene model."""
    list_display = ['title', 'tour', 'order', 'hotspot_count', 'is_active', 'panorama_preview']
    list_filter = ['tour', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'tour__title']
    readonly_fields = ['hotspot_count', 'created_at', 'updated_at', 'panorama_preview', 'map_preview']
    inlines = [HotspotInline]
    list_editable = ['order', 'is_active']
    
    fieldsets = (
        (None, {
            'fields': ('tour', 'title', 'description', 'order', 'is_active')
        }),
        ('Media', {
            'fields': ('panorama_image', 'panorama_preview', 'voiceover_audio', 'map_image', 'map_preview')
        }),
        ('Camera Settings', {
            'fields': ('initial_yaw', 'initial_pitch'),
            'description': 'Set the initial camera position when entering this scene'
        }),
        ('Statistics', {
            'fields': ('hotspot_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def panorama_preview(self, obj):
        """Display panorama preview in admin."""
        if obj.panorama_image:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 100px;" />',
                obj.panorama_image.url
            )
        return "No panorama image"
    panorama_preview.short_description = "Panorama Preview"

    def map_preview(self, obj):
        """Display map preview in admin."""
        if obj.map_image:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
                obj.map_image.url
            )
        return "No map image"
    map_preview.short_description = "Map Preview"


@admin.register(Hotspot)
class HotspotAdmin(admin.ModelAdmin):
    """Admin interface for Hotspot model."""
    list_display = ['source_scene', 'target_scene', 'label', 'yaw', 'pitch', 'color_preview', 'is_active']
    list_filter = ['source_scene__tour', 'is_active', 'created_at']
    search_fields = ['label', 'source_scene__title', 'target_scene__title']
    readonly_fields = ['created_at', 'updated_at', 'color_preview']
    list_editable = ['is_active']
    
    fieldsets = (
        (None, {
            'fields': ('source_scene', 'target_scene', 'label', 'is_active')
        }),
        ('Position', {
            'fields': ('yaw', 'pitch'),
            'description': 'Position coordinates in 3D space (spherical coordinates)'
        }),
        ('Appearance', {
            'fields': ('size', 'color', 'color_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def color_preview(self, obj):
        """Display color preview in admin."""
        return format_html(
            '<div style="width: 30px; height: 30px; background-color: {}; border: 1px solid #ccc; display: inline-block;"></div> {}',
            obj.color,
            obj.color
        )
    color_preview.short_description = "Color Preview"

    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related('source_scene', 'target_scene', 'source_scene__tour')


# Customize admin site header
admin.site.site_header = "VR Tours Administration"
admin.site.site_title = "VR Tours Admin"
admin.site.index_title = "Welcome to VR Tours Administration" 