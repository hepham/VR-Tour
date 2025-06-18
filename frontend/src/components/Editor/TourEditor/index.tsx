import React, { useState, useCallback, useEffect } from 'react';
import { Tour, Scene, NavigationConnection } from '../../../types';
import SceneEditor from '../SceneEditor';
import HotspotEditor from '../HotspotEditor';
import TourMetadataForm from '../TourMetadataForm';
import EditorPreview from '../EditorPreview';
import RightSidebar from '../RightSidebar';
import './styles.css';

interface TourEditorProps {
  tourId?: number;
  onSave?: (tour: Tour) => void;
  onCancel?: () => void;
}

interface EditorState {
  tour: Partial<Tour>;
  scenes: Scene[];
  selectedSceneId: number | null;
  unsavedChanges: boolean;
  previewMode: boolean;
}

const TourEditor: React.FC<TourEditorProps> = ({
  tourId,
  onSave,
  onCancel,
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    tour: {
      title: '',
      description: '',
      thumbnail: '',
    },
    scenes: [],
    selectedSceneId: null,

    unsavedChanges: false,
    previewMode: false,
  });

  const [activeTab, setActiveTab] = useState<'tour' | 'scenes'>('tour');
  const [rightSidebarTab, setRightSidebarTab] = useState<'scene-config' | 'hotspots'>('scene-config');

  // Auto-save functionality
  useEffect(() => {
    if (editorState.unsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save every 5 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [editorState.unsavedChanges]);

  const handleAutoSave = useCallback(async () => {
    if (editorState.unsavedChanges) {
      try {
        // TODO: Implement API call for auto-save
        console.log('Auto-saving tour:', editorState.tour);
        setEditorState(prev => ({ ...prev, unsavedChanges: false }));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [editorState]);

  const updateTour = useCallback((updates: Partial<Tour>) => {
    setEditorState(prev => ({
      ...prev,
      tour: { ...prev.tour, ...updates },
      unsavedChanges: true,
    }));
  }, []);

  const addScene = useCallback((scene: Omit<Scene, 'id'>) => {
    const newScene: Scene = {
      ...scene,
      id: Date.now(), // Temporary ID
      order: editorState.scenes.length,
    };
    
    setEditorState(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      selectedSceneId: newScene.id,
      unsavedChanges: true,
    }));
  }, [editorState.scenes]);

  const updateScene = useCallback((sceneId: number, updates: Partial<Scene>) => {
    setEditorState(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      ),
      unsavedChanges: true,
    }));
  }, []);

  const deleteScene = useCallback((sceneId: number) => {
    setEditorState(prev => ({
      ...prev,
      scenes: prev.scenes.filter(scene => scene.id !== sceneId),
      selectedSceneId: prev.selectedSceneId === sceneId ? null : prev.selectedSceneId,
      unsavedChanges: true,
    }));
  }, []);

  const reorderScenes = useCallback((startIndex: number, endIndex: number) => {
    setEditorState(prev => {
      const newScenes = [...prev.scenes];
      const [reorderedScene] = newScenes.splice(startIndex, 1);
      newScenes.splice(endIndex, 0, reorderedScene);
      
      // Update order values
      const updatedScenes = newScenes.map((scene, index) => ({
        ...scene,
        order: index,
      }));

      return {
        ...prev,
        scenes: updatedScenes,
        unsavedChanges: true,
      };
    });
  }, []);

  const selectedScene = editorState.scenes.find(
    scene => scene.id === editorState.selectedSceneId
  );

  const handleSave = async () => {
    try {
      const tourData: Tour = {
        ...editorState.tour as Tour,
        scenes: editorState.scenes,
      };
      
      // TODO: Implement API call
      console.log('Saving tour:', tourData);
      onSave?.(tourData);
      
      setEditorState(prev => ({ ...prev, unsavedChanges: false }));
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const togglePreview = () => {
    setEditorState(prev => ({
      ...prev,
      previewMode: !prev.previewMode,
    }));
  };

  return (
    <div className="tour-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <h1>Tour Editor</h1>
          {editorState.unsavedChanges && (
            <span className="unsaved-indicator">• Unsaved changes</span>
          )}
        </div>
        
        <div className="header-actions">
          <button
            className="preview-button"
            onClick={togglePreview}
          >
            <span>👁️</span>
            {editorState.previewMode ? 'Edit Mode' : 'Preview'}
          </button>
          
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!editorState.unsavedChanges}
          >
            <span>💾</span>
            Save Tour
          </button>
          
          <button
            className="cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="editor-content">
        {editorState.previewMode ? (
          <div className="preview-container">
            <EditorPreview
              tour={editorState.tour as Tour}
              scenes={editorState.scenes}
              onExitPreview={() => setEditorState(prev => ({ ...prev, previewMode: false }))}
              onSetInitialView={(yaw, pitch, zoom) => {
                // TODO: Handle set initial view in preview mode
                console.log('Set initial view in preview mode:', yaw, pitch, zoom);
              }}
            />
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <div className="editor-sidebar">
              <div className="sidebar-tabs">
                <button
                  className={`tab-button ${activeTab === 'tour' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tour')}
                >
                  Tour Settings
                </button>
                <button
                  className={`tab-button ${activeTab === 'scenes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('scenes')}
                >
                  Scenes ({editorState.scenes.length})
                </button>

              </div>

              <div className="sidebar-content">
                {activeTab === 'tour' && (
                  <TourMetadataForm
                    tour={editorState.tour}
                    onChange={updateTour}
                  />
                )}
                
                {activeTab === 'scenes' && (
                  <SceneEditor
                    scenes={editorState.scenes}
                    selectedSceneId={editorState.selectedSceneId}
                    onAddScene={addScene}
                    onUpdateScene={updateScene}
                    onDeleteScene={deleteScene}
                    onSelectScene={(sceneId) =>
                      setEditorState(prev => ({ ...prev, selectedSceneId: sceneId }))
                    }
                    onReorderScenes={reorderScenes}
                  />
                )}
                

              </div>
            </div>

            {/* Main Panel */}
            <div className="editor-main">
              <div className="editor-center">
                <div className="main-content">
                  {selectedScene ? (
                    <div className="preview-container">
                      {selectedScene.panorama_image ? (
                        <EditorPreview
                          tour={editorState.tour as Tour}
                          scenes={[selectedScene]}
                          currentSceneId={selectedScene.id}
                          editMode={true}
                          onHotspotPlace={(yaw, pitch, type) => {
                            // Create new hotspot and add to scene
                            const hotspotTypes: Record<string, { label: string; color: string }> = {
                              map: { label: 'Map hotspot', color: '#10b981' },
                              image: { label: 'Image hotspot', color: '#3b82f6' },
                              video: { label: 'Video hotspot', color: '#ef4444' },
                              article: { label: 'Article hotspot', color: '#f59e0b' },
                              link: { label: 'Link hotspot', color: '#8b5cf6' },
                            };

                            const hotspotConfig = hotspotTypes[type || 'navigation'] || {
                              label: 'Navigation hotspot',
                              color: '#3b82f6'
                            };

                            const newHotspot: NavigationConnection = {
                              id: Date.now(), // Temporary ID, will be replaced by backend
                              from_scene: selectedScene.id,
                              to_scene: 0, // Will be set in hotspot editor
                              yaw: Math.round(yaw * 100) / 100, // Round to 2 decimal places
                              pitch: Math.round(pitch * 100) / 100,
                              label: hotspotConfig.label,
                              size: 15,
                              color: hotspotConfig.color,
                            };

                            // Add hotspot to scene's navigation connections
                            const currentConnections = selectedScene.navigation_connections || [];
                            const updatedConnections = [...currentConnections, newHotspot];
                            
                            updateScene(selectedScene.id, {
                              navigation_connections: updatedConnections
                            });

                            console.log('Hotspot created at:', yaw, pitch, 'Type:', type);
                          }}
                          onSetInitialView={(yaw, pitch, zoom) => {
                            if (selectedScene) {
                              updateScene(selectedScene.id, {
                                default_yaw: yaw,
                                default_pitch: pitch,
                                initial_zoom: zoom
                              } as Partial<Scene>);
                            }
                          }}
                        />
                      ) : (
                        <div className="upload-area">
                          <div className="upload-icon">📸</div>
                          <div className="upload-text">No 360° image uploaded</div>
                          <div className="upload-hint">Go to Scenes tab to upload a panoramic image</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="upload-area">
                      <div className="upload-icon">🏠</div>
                      <div className="upload-text">Welcome to Tour Editor</div>
                      <div className="upload-hint">Create your first scene to get started</div>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          console.log('Create First Scene clicked');
                          setActiveTab('scenes');
                        }}
                      >
                        Create First Scene
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <RightSidebar
                scene={selectedScene || null}
                activeTab={rightSidebarTab}
                onTabChange={setRightSidebarTab}
                onUpdateScene={(updates) => {
                  if (selectedScene) {
                    updateScene(selectedScene.id, updates);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TourEditor; 