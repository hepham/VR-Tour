import React, { useState } from 'react';
import { Scene, NavigationConnection } from '../../../types';
import { HOTSPOT_ICONS, type HotspotIcon } from '../../../constants/hotspots';
import './styles.css';

interface RightSidebarHotspotEditorProps {
  scene: Scene;
  scenes?: Scene[]; // Add scenes array for target scene selection
  onUpdateScene: (updates: Partial<Scene>) => void;
}

const RightSidebarHotspotEditor: React.FC<RightSidebarHotspotEditorProps> = ({
  scene,
  scenes = [],
  onUpdateScene,
}) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | null>(null);
  const [targetSceneInput, setTargetSceneInput] = useState<string>('');
  const [isUserTyping, setIsUserTyping] = useState(false); // Track if user is actively typing
  const [showIconPicker, setShowIconPicker] = useState(false);

  const hotspots = scene.navigation_connections || [];

  const handleHotspotSelect = (hotspotId: number) => {
    setSelectedHotspotId(hotspotId === selectedHotspotId ? null : hotspotId);
    setShowIconPicker(false);
  };

  const handleHotspotUpdate = (hotspotId: number, updates: Partial<NavigationConnection>) => {
    console.log('🔧 [RightSidebarHotspotEditor] Hotspot update triggered:', {
      hotspotId: hotspotId,
      updates: updates,
      sceneId: scene.id,
      sceneTitle: scene.title,
      totalHotspots: hotspots.length,
      updatingFields: Object.keys(updates)
    });
    
    const updatedHotspots = hotspots.map(hotspot =>
      hotspot.id === hotspotId ? { ...hotspot, ...updates } : hotspot
    );
    
    console.log('🔄 [RightSidebarHotspotEditor] Updated hotspots array:', {
      before: hotspots.find(h => h.id === hotspotId),
      after: updatedHotspots.find(h => h.id === hotspotId),
      totalCount: updatedHotspots.length
    });
    
    onUpdateScene({ navigation_connections: updatedHotspots });
  };

  const handleDeleteHotspot = (hotspotId: number) => {
    const updatedHotspots = hotspots.filter(hotspot => hotspot.id !== hotspotId);
    onUpdateScene({ navigation_connections: updatedHotspots });
    setSelectedHotspotId(null);
  };

  const selectedHotspot = hotspots.find(h => h.id === selectedHotspotId);

  // Update input when selectedHotspot changes (but not when user is typing)
  React.useEffect(() => {
    if (!isUserTyping && selectedHotspot) {
      if ((selectedHotspot as any).action_type === 'navigation' || !(selectedHotspot as any).action_type) {
        // For navigation: Show scene title if found, otherwise empty
        const currentScene = scenes.find(s => s.id === selectedHotspot.to_scene);
        setTargetSceneInput(currentScene?.title || '');
      } else {
        // For other actions: Show action_target
        setTargetSceneInput((selectedHotspot as any).action_target || '');
      }
    } else if (!selectedHotspot) {
      setTargetSceneInput('');
      setIsUserTyping(false);
    }
  }, [selectedHotspot, scenes, isUserTyping]);

  // Reset typing state when hotspot selection changes
  React.useEffect(() => {
    setIsUserTyping(false);
  }, [selectedHotspotId]);

  return (
    <div className="right-sidebar-hotspot-editor">
      {/* Hotspot List */}
      <div className="hotspot-list-section">
        <div className="section-header">
          <h4>Hotspots ({hotspots.length})</h4>
        </div>
        
        {hotspots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>No hotspots yet</p>
            <span>Use the toolbar to place hotspots on the scene</span>
          </div>
        ) : (
          <div className="hotspot-list">
            {hotspots.map((hotspot, index) => (
              <div
                key={hotspot.id}
                className={`hotspot-item ${selectedHotspotId === hotspot.id ? 'selected' : ''}`}
                onClick={() => handleHotspotSelect(hotspot.id)}
              >
                <div className="hotspot-preview">
                  <span className="hotspot-icon">
                    {HOTSPOT_ICONS.find(icon => icon.id === (hotspot as any).icon_type)?.icon || '📍'}
                  </span>
                  <div className="hotspot-info">
                    <div className="hotspot-title">
                      {hotspot.label || `Hotspot ${index + 1}`}
                    </div>
                    <div className="hotspot-coords">
                      {hotspot.yaw.toFixed(1)}°, {hotspot.pitch.toFixed(1)}°
                    </div>
                  </div>
                </div>
                
                <button
                  className="delete-hotspot"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHotspot(hotspot.id);
                  }}
                  title="Delete hotspot"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hotspot Editor */}
      {selectedHotspot && (
        <div className="hotspot-editor-section">
          <div className="section-header">
            <h4>Edit Hotspot</h4>
          </div>

          {/* Icon Selection */}
          <div className="editor-group">
            <label>Icon</label>
            <div className="icon-selector">
              <button
                className="current-icon"
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                <span className="icon">
                  {HOTSPOT_ICONS.find(icon => icon.id === (selectedHotspot as any).icon_type)?.icon || '📍'}
                </span>
                <span className="label">
                  {HOTSPOT_ICONS.find(icon => icon.id === (selectedHotspot as any).icon_type)?.label || 'Default'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showIconPicker && (
                <div className="icon-picker">
                  {Object.entries(
                    HOTSPOT_ICONS.reduce((acc, icon) => {
                      if (!acc[icon.category]) acc[icon.category] = [];
                      acc[icon.category].push(icon);
                      return acc;
                    }, {} as Record<string, HotspotIcon[]>)
                  ).map(([category, icons]) => (
                    <div key={category} className="icon-category">
                      <div className="category-title">{category}</div>
                      <div className="icon-grid">
                        {icons.map((icon) => (
                          <button
                            key={icon.id}
                            className={`icon-option ${(selectedHotspot as any).icon_type === icon.id ? 'selected' : ''}`}
                            onClick={() => {
                              handleHotspotUpdate(selectedHotspot.id, { icon_type: icon.id } as any);
                              setShowIconPicker(false);
                            }}
                            title={icon.label}
                          >
                            {icon.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Label */}
          <div className="editor-group">
            <label>Label</label>
            <input
              type="text"
              className="form-input"
              value={selectedHotspot.label || ''}
              onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { label: e.target.value })}
              placeholder="Hotspot label"
            />
          </div>

          {/* Position */}
          <div className="editor-group">
            <label>Position</label>
            <div className="position-inputs">
              <div className="input-group">
                <label>Yaw (°)</label>
                <input
                  type="number"
                  className="form-input"
                  value={selectedHotspot.yaw}
                  onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { yaw: parseFloat(e.target.value) || 0 })}
                  min="-180"
                  max="180"
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label>Pitch (°)</label>
                <input
                  type="number"
                  className="form-input"
                  value={selectedHotspot.pitch}
                  onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { pitch: parseFloat(e.target.value) || 0 })}
                  min="-90"
                  max="90"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Size & Color */}
          <div className="editor-group">
            <label>Appearance</label>
            <div className="appearance-controls">
              <div className="input-group">
                <label>Size</label>
                <input
                  type="range"
                  className="form-range"
                  value={selectedHotspot.size || 1}
                  onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { size: parseFloat(e.target.value) })}
                  min="0.5"
                  max="3"
                  step="0.1"
                />
                <span className="range-value">{(selectedHotspot.size || 1).toFixed(1)}x</span>
              </div>
              
              <div className="input-group">
                <label>Color</label>
                <input
                  type="color"
                  className="color-input"
                  value={selectedHotspot.color || '#3b82f6'}
                  onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { color: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="editor-group">
            <label>Content</label>
            <textarea
              className="form-textarea"
              value={(selectedHotspot as any).content || ''}
              onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { content: e.target.value } as any)}
              placeholder="Add description or additional information"
              rows={4}
            />
          </div>

          {/* Link/Action */}
          <div className="editor-group">
            <label>Action</label>
            <select
              className="form-select"
              value={(selectedHotspot as any).action_type || 'none'}
              onChange={(e) => handleHotspotUpdate(selectedHotspot.id, { action_type: e.target.value } as any)}
            >
              <option value="none">Display Only (No Action)</option>
              <option value="navigation">Navigate to Scene</option>
              <option value="info">Show Information</option>
              <option value="image">Show Image</option>
              <option value="video">Play Video</option>
              <option value="link">Open Link</option>
            </select>
          </div>

          {/* Target Scene/URL */}
          <div className="editor-group">
            <label>Target Scene/URL</label>
            <input
              type="text"
              className="form-input"
              value={targetSceneInput}
              onChange={(e) => {
                const inputValue = e.target.value;
                setIsUserTyping(true); // Mark that user is actively typing
                setTargetSceneInput(inputValue); // Update UI immediately
                
                if ((selectedHotspot as any).action_type === 'navigation' || !(selectedHotspot as any).action_type) {
                  // For navigation: Map scene title to scene ID
                  if (inputValue === '') {
                    // Clear selection if empty
                    handleHotspotUpdate(selectedHotspot.id, { to_scene: 0 });
                  } else {
                    const targetScene = scenes.find(s => 
                      s.title.toLowerCase().includes(inputValue.toLowerCase()) && s.id !== scene.id
                    );
                    
                    console.log('🎯 [RightSidebarHotspotEditor] Scene title mapping:', {
                      hotspotId: selectedHotspot.id,
                      inputTitle: inputValue,
                      foundScene: targetScene,
                      oldSceneId: selectedHotspot.to_scene,
                      newSceneId: targetScene?.id || 0
                    });
                    
                    if (targetScene) {
                      handleHotspotUpdate(selectedHotspot.id, { to_scene: targetScene.id });
                    } else {
                      // Scene not found, clear to_scene but keep input value for user feedback
                      handleHotspotUpdate(selectedHotspot.id, { to_scene: 0 });
                    }
                  }
                } else {
                  // For other actions: Save as action_target
                  handleHotspotUpdate(selectedHotspot.id, { action_target: inputValue } as any);
                }
              }}
              onBlur={() => {
                // Reset typing state when user finishes typing
                setTimeout(() => setIsUserTyping(false), 100);
              }}
              placeholder={((selectedHotspot as any).action_type === 'navigation' || !(selectedHotspot as any).action_type) 
                ? "Enter scene title to navigate to..."
                : "URL, file path, or resource identifier"
              }
            />
            
            {/* Scene status and suggestions for navigation */}
            {((selectedHotspot as any).action_type === 'navigation' || !(selectedHotspot as any).action_type) && (
              <div>
                {/* Scene status */}
                {targetSceneInput && targetSceneInput !== '' && (
                  <div className={`scene-status ${
                    scenes.find(s => s.title.toLowerCase().includes(targetSceneInput.toLowerCase()) && s.id !== scene.id)
                      ? 'scene-found' : 'scene-not-found'
                  }`}>
                    {scenes.find(s => s.title.toLowerCase().includes(targetSceneInput.toLowerCase()) && s.id !== scene.id)
                      ? `✅ Found: ${scenes.find(s => s.title.toLowerCase().includes(targetSceneInput.toLowerCase()) && s.id !== scene.id)?.title}`
                      : '❌ Scene not found'
                    }
                  </div>
                )}
                
                {/* Scene suggestions */}
                <div className="scene-suggestions">
                  <small>Available scenes: {scenes.filter(s => s.id !== scene.id).map(s => s.title).join(', ')}</small>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebarHotspotEditor; 