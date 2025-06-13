import React from 'react';

interface CheckpointContent {
  text?: string;
  videoUrl?: string;
  imageUrl?: string;
  images?: string[];
  audioUrl?: string;
}

interface CheckpointData {
  id: number;
  scene_id: number;
  yaw: number;
  pitch: number;
  title: string;
  description: string;
  type: 'info' | 'video' | 'image' | 'gallery';
  content: CheckpointContent;
  size?: number;
  color?: string;
  icon?: string;
}

interface CheckpointListProps {
  checkpoints: CheckpointData[];
  onNavigateToCheckpoint: (yaw: number, pitch: number) => void;
  onCheckpointClick: (checkpoint: CheckpointData) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const CheckpointList: React.FC<CheckpointListProps> = ({
  checkpoints,
  onNavigateToCheckpoint,
  onCheckpointClick,
  isVisible,
  onToggle
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'gallery': return '🎨';
      default: return '📍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return '#4A90E2';
      case 'video': return '#E74C3C';
      case 'image': return '#27AE60';
      case 'gallery': return '#9B59B6';
      default: return '#6C7B7F';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '10px',
          left: isVisible ? '320px' : '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          padding: '10px',
          cursor: 'pointer',
          zIndex: 1001,
          fontSize: '14px',
          transition: 'left 0.3s ease'
        }}
      >
        {isVisible ? '❌' : '📋'} Checkpoints
      </button>

      {/* Checkpoint List Panel */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '300px',
          maxHeight: '80vh',
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          borderRadius: '8px',
          padding: '15px',
          zIndex: 1000,
          overflow: 'auto',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
            📍 Danh sách Checkpoint ({checkpoints.length})
          </h3>
          
          {checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.id}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '10px',
                border: `2px solid ${checkpoint.color || getTypeColor(checkpoint.type)}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {checkpoint.icon || getTypeIcon(checkpoint.type)}
                    </span>
                    {checkpoint.title}
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '8px'
                  }}>
                    {checkpoint.description}
                  </div>
                  
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '8px'
                  }}>
                    📍 Yaw: {checkpoint.yaw}° | Pitch: {checkpoint.pitch}°
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCheckpoint(checkpoint.yaw, checkpoint.pitch);
                      }}
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      🧭 Đi tới
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCheckpointClick(checkpoint);
                      }}
                      style={{
                        background: checkpoint.color || getTypeColor(checkpoint.type),
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      👁️ Xem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '5px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)'
          }}>
            💡 <strong>Tip:</strong> Sử dụng nút "📋 Copy Checkpoint" ở panel debug để tạo checkpoint mới tại vị trí camera hiện tại.
          </div>
        </div>
      )}
    </>
  );
};

export default CheckpointList; 