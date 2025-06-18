import React from 'react';
import { Scene } from '../../../types';
import SceneConfigEditor from '../SceneConfigEditor';
import RightSidebarHotspotEditor from '../RightSidebarHotspotEditor';
import './styles.css';

interface RightSidebarProps {
  scene: Scene | null;
  activeTab: 'scene-config' | 'hotspots';
  onTabChange: (tab: 'scene-config' | 'hotspots') => void;
  onUpdateScene: (updates: Partial<Scene>) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  scene,
  activeTab,
  onTabChange,
  onUpdateScene,
}) => {
  if (!scene) {
    return (
      <div className="right-sidebar">
        <div className="right-sidebar-empty">
          <div className="empty-icon">⚙️</div>
          <p>No Scene Selected</p>
          <span>Select a scene to configure settings and hotspots</span>
        </div>
      </div>
    );
  }

  return (
    <div className="right-sidebar">
      {/* Tab Header */}
      <div className="right-sidebar-header">
        <div className="right-sidebar-tabs">
          <button
            className={`right-tab-button ${activeTab === 'scene-config' ? 'active' : ''}`}
            onClick={() => onTabChange('scene-config')}
          >
            <span className="tab-icon">⚙️</span>
            Scene
          </button>
          <button
            className={`right-tab-button ${activeTab === 'hotspots' ? 'active' : ''}`}
            onClick={() => onTabChange('hotspots')}
          >
            <span className="tab-icon">🎯</span>
            Hotspots
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="right-sidebar-content">
        {activeTab === 'scene-config' && (
          <SceneConfigEditor
            scene={scene}
            onUpdateScene={onUpdateScene}
          />
        )}
        
        {activeTab === 'hotspots' && (
          <RightSidebarHotspotEditor
            scene={scene}
            onUpdateScene={onUpdateScene}
          />
        )}
      </div>
    </div>
  );
};

export default RightSidebar; 