import React, { useState, useCallback } from 'react';
import { Scene, NavigationConnection } from '../../../types';
import './styles.css';

interface HotspotEditorProps {
  scene: Scene;
  scenes: Scene[];
  onUpdateScene: (updates: Partial<Scene>) => void;
}

interface HotspotFormData {
  to_scene: number;
  yaw: number;
  pitch: number;
  label: string;
  size: number;
  color: string;
}

const HOTSPOT_COLORS = [
  '#ff4444', '#44ff44', '#4444ff', '#ffff44', 
  '#ff44ff', '#44ffff', '#ffffff', '#000000'
];

const HotspotEditor: React.FC<HotspotEditorProps> = ({
  scene,
  scenes,
  onUpdateScene,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<HotspotFormData>({
    to_scene: 0,
    yaw: 0,
    pitch: 0,
    label: '',
    size: 10,
    color: '#ff4444',
  });

  const connections = scene.navigation_connections || [];
  const availableScenes = scenes.filter(s => s.id !== scene.id);

  const resetForm = () => {
    setFormData({
      to_scene: availableScenes[0]?.id || 0,
      yaw: 0,
      pitch: 0,
      label: '',
      size: 10,
      color: '#ff4444',
    });
  };

  const handleCreateHotspot = () => {
    if (!formData.label.trim()) {
      alert('Hotspot label is required');
      return;
    }

    if (!formData.to_scene) {
      alert('Target scene is required');
      return;
    }

    const newConnection: NavigationConnection = {
      id: Date.now(), // Temporary ID
      from_scene: scene.id,
      to_scene: formData.to_scene,
      yaw: formData.yaw,
      pitch: formData.pitch,
      label: formData.label,
      size: formData.size,
      color: formData.color,
    };

    const updatedConnections = [...connections, newConnection];
    onUpdateScene({ navigation_connections: updatedConnections });
    
    resetForm();
    setIsCreating(false);
  };

  const handleUpdateHotspot = (id: number) => {
    const updatedConnections = connections.map(conn =>
      conn.id === id ? {
        ...conn,
        to_scene: formData.to_scene,
        yaw: formData.yaw,
        pitch: formData.pitch,
        label: formData.label,
        size: formData.size,
        color: formData.color,
      } : conn
    );

    onUpdateScene({ navigation_connections: updatedConnections });
    setEditingId(null);
    resetForm();
  };

  const handleDeleteHotspot = (id: number) => {
    const updatedConnections = connections.filter(conn => conn.id !== id);
    onUpdateScene({ navigation_connections: updatedConnections });
  };

  const startEditing = (connection: NavigationConnection) => {
    setFormData({
      to_scene: connection.to_scene,
      yaw: connection.yaw,
      pitch: connection.pitch,
      label: connection.label,
      size: connection.size,
      color: connection.color,
    });
    setEditingId(connection.id);
    setIsCreating(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const getTargetSceneName = (sceneId: number) => {
    const targetScene = scenes.find(s => s.id === sceneId);
    return targetScene?.title || 'Unknown Scene';
  };

  const handlePlacementFromViewer = useCallback((yaw: number, pitch: number) => {
    setFormData(prev => ({ ...prev, yaw, pitch }));
    if (!isCreating && editingId === null) {
      setIsCreating(true);
    }
  }, [isCreating, editingId]);

  return (
    <div className="hotspot-editor">
      <div className="hotspot-header">
        <h3>🔗 Hotspots</h3>
        <div className="hotspot-count">
          {connections.length} hotspot{connections.length !== 1 ? 's' : ''}
        </div>
      </div>

      {availableScenes.length === 0 ? (
        <div className="no-scenes-warning">
          <p>⚠️ No other scenes available</p>
          <p className="warning-hint">Create more scenes to add hotspots</p>
        </div>
      ) : (
        <>
          {/* Hotspot Form */}
          {(isCreating || editingId !== null) && (
            <div className="hotspot-form">
              <h4>{editingId ? 'Edit Hotspot' : 'Create New Hotspot'}</h4>
              
              <div className="form-group">
                <label className="form-label">Target Scene *</label>
                <select
                  className="form-select"
                  value={formData.to_scene}
                  onChange={(e) => setFormData(prev => ({ ...prev, to_scene: parseInt(e.target.value) }))}
                >
                  <option value={0}>Select target scene...</option>
                  {availableScenes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} (Scene {s.order + 1})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Label *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter hotspot label..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Yaw (°)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.yaw}
                    onChange={(e) => setFormData(prev => ({ ...prev, yaw: parseFloat(e.target.value) || 0 }))}
                    min="-180"
                    max="180"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pitch (°)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.pitch}
                    onChange={(e) => setFormData(prev => ({ ...prev, pitch: parseFloat(e.target.value) || 0 }))}
                    min="-90"
                    max="90"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Size</label>
                  <input
                    type="range"
                    className="form-range"
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    min="5"
                    max="25"
                    step="1"
                  />
                  <span className="range-value">{formData.size}px</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div className="color-picker">
                    {HOTSPOT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="placement-hint">
                <p>💡 Tip: Click on the 360° viewer to set hotspot position</p>
              </div>

              <div className="form-actions">
                <button
                  className="cancel-btn"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
                <button
                  className="save-btn primary"
                  onClick={editingId ? () => handleUpdateHotspot(editingId) : handleCreateHotspot}
                  disabled={!formData.label.trim() || !formData.to_scene}
                >
                  {editingId ? 'Update Hotspot' : 'Create Hotspot'}
                </button>
              </div>
            </div>
          )}

          {/* Add Hotspot Button */}
          {!isCreating && editingId === null && (
            <button
              className="add-hotspot-btn primary"
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
            >
              ➕ Add Hotspot
            </button>
          )}

          {/* Hotspot List */}
          <div className="hotspot-list">
            {connections.length === 0 ? (
              <div className="empty-state">
                <p>No hotspots yet</p>
                <p className="empty-hint">Add hotspots to create navigation between scenes</p>
              </div>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className={`hotspot-item ${editingId === connection.id ? 'editing' : ''}`}
                >
                  <div className="hotspot-preview">
                    <div
                      className="hotspot-dot"
                      style={{
                        backgroundColor: connection.color,
                        width: connection.size,
                        height: connection.size,
                      }}
                    />
                  </div>
                  
                  <div className="hotspot-info">
                    <h5>{connection.label}</h5>
                    <p className="target-scene">
                      → {getTargetSceneName(connection.to_scene)}
                    </p>
                    <div className="hotspot-position">
                      <span>Yaw: {connection.yaw.toFixed(1)}°</span>
                      <span>Pitch: {connection.pitch.toFixed(1)}°</span>
                    </div>
                  </div>

                  <div className="hotspot-actions">
                    <button
                      className="edit-btn"
                      onClick={() => startEditing(connection)}
                      title="Edit hotspot"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => {
                        if (window.confirm(`Delete hotspot "${connection.label}"?`)) {
                          handleDeleteHotspot(connection.id);
                        }
                      }}
                      title="Delete hotspot"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Hotspot Instructions */}
          <div className="hotspot-instructions">
            <h4>How to place hotspots:</h4>
            <ol>
              <li>Click "Add Hotspot" to start creating</li>
              <li>Fill in the target scene and label</li>
              <li>Click on the 360° viewer to set position</li>
              <li>Adjust size and color as needed</li>
              <li>Click "Create Hotspot" to save</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default HotspotEditor; 