import React, { useState, useCallback, useRef } from 'react';
import { Scene } from '../../../types';
import './styles.css';

interface SceneEditorProps {
  scenes: Scene[];
  selectedSceneId: number | null;
  onAddScene: (scene: Omit<Scene, 'id'>) => void;
  onUpdateScene: (sceneId: number, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: number) => void;
  onSelectScene: (sceneId: number) => void;
  onReorderScenes: (startIndex: number, endIndex: number) => void;
}

interface SceneFormData {
  title: string;
  description: string;
  default_yaw: number;
  default_pitch: number;
  panorama_image: string;
}

const SceneEditor: React.FC<SceneEditorProps> = ({
  scenes,
  selectedSceneId,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onSelectScene,
  onReorderScenes,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<SceneFormData>({
    title: '',
    description: '',
    default_yaw: 0,
    default_pitch: 0,
    panorama_image: '',
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      default_yaw: 0,
      default_pitch: 0,
      panorama_image: '',
    });
    setUploadProgress(null);
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 50MB for panoramic images)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploadProgress(0);

    try {
      // TODO: Implement chunked upload to backend
      // For now, use FileReader for demo
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setFormData(prev => ({ ...prev, panorama_image: imageUrl }));
        setUploadProgress(null);
      };

      reader.onerror = () => {
        alert('Failed to upload image');
        setUploadProgress(null);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
      setUploadProgress(null);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  const handleCreateScene = async () => {
    if (!formData.title.trim()) {
      alert('Scene title is required');
      return;
    }

    if (!formData.panorama_image) {
      alert('Panoramic image is required');
      return;
    }

    const newScene: Omit<Scene, 'id'> = {
      tour_id: 0, // Will be set by parent
      title: formData.title,
      description: formData.description,
      default_yaw: formData.default_yaw,
      default_pitch: formData.default_pitch,
      panorama_image: formData.panorama_image,
      order: scenes.length,
    };

    onAddScene(newScene);
    resetForm();
    setIsCreating(false);
  };

  const handleSceneDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleSceneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderScenes(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleSceneDragEnd = () => {
    setDraggedIndex(null);
  };

  const selectedScene = scenes.find(scene => scene.id === selectedSceneId);

  return (
    <div className="scene-editor">
      {/* Add Scene Button */}
      {!isCreating && (
        <button
          className="btn btn-primary"
          onClick={() => setIsCreating(true)}
          style={{ marginBottom: '20px', width: '100%' }}
        >
          + Add New Scene
        </button>
      )}

      {/* Scene Creation Form */}
      {isCreating && (
        <div className="form-section" style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Create New Scene</h4>
          
          <div className="form-group">
            <label>Scene Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter scene title..."
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter scene description..."
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>360° Panoramic Image *</label>
            
            {!formData.panorama_image ? (
              <div
                className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadProgress !== null ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Uploading... {uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📸</div>
                    <div className="upload-text">Click to upload or drag & drop</div>
                    <div className="upload-hint">PNG, JPG up to 50MB</div>
                  </>
                )}
              </div>
            ) : (
              <div className="scene-thumbnail">
                <img src={formData.panorama_image} alt="Preview" />
                <div className="scene-actions">
                  <button onClick={() => setFormData(prev => ({ ...prev, panorama_image: '' }))}>
                    🗑️
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              style={{ display: 'none' }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleCreateScene}>
              Create Scene
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setIsCreating(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scene List */}
      {scenes.length > 0 ? (
        <div className="scene-list">
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              className={`scene-item ${scene.id === selectedSceneId ? 'selected' : ''}`}
              onClick={() => onSelectScene(scene.id)}
              draggable
              onDragStart={(e) => handleSceneDragStart(e, index)}
              onDragOver={(e) => handleSceneDragOver(e, index)}
              onDragEnd={handleSceneDragEnd}
            >
              <div className="scene-thumbnail">
                {scene.panorama_image ? (
                  <>
                    <img src={scene.panorama_image} alt={scene.title} />
                    <div className="scene-title-overlay">
                      {scene.title || 'Untitled Scene'}
                    </div>
                  </>
                ) : (
                  <div className="thumbnail-placeholder">📸</div>
                )}
              </div>

              <div className="scene-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteScene(scene.id);
                  }}
                  title="Delete scene"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="upload-area">
            <div className="upload-icon">🖼️</div>
            <div className="upload-text">No scenes created yet</div>
            <div className="upload-hint">Create your first scene to get started</div>
          </div>
        )
      )}

      {/* Selected Scene Details */}
      {selectedScene && (
        <div className="selected-scene-details">
          <h4>Selected Scene</h4>
          <div className="scene-details">
            <p><strong>Title:</strong> {selectedScene.title}</p>
            <p><strong>Description:</strong> {selectedScene.description || 'None'}</p>
            <p><strong>Position:</strong> Scene {selectedScene.order + 1} of {scenes.length}</p>
            <p><strong>Default View:</strong> Yaw {selectedScene.default_yaw}°, Pitch {selectedScene.default_pitch}°</p>
            {selectedScene.navigation_connections && (
              <p><strong>Hotspots:</strong> {selectedScene.navigation_connections.length}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneEditor; 