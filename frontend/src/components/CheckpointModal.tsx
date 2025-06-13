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

interface CheckpointModalProps {
  checkpoint: CheckpointData | null;
  isOpen: boolean;
  onClose: () => void;
}

const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpoint,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !checkpoint) return null;

  const renderContent = () => {
    switch (checkpoint.type) {
      case 'info':
        return (
          <div className="checkpoint-content">
            <p>{checkpoint.content.text || checkpoint.description}</p>
          </div>
        );

      case 'video':
        return (
          <div className="checkpoint-content">
            {checkpoint.content.videoUrl && (
              <video 
                controls 
                style={{ width: '100%', maxHeight: '400px' }}
                src={checkpoint.content.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            )}
            <p>{checkpoint.description}</p>
          </div>
        );

      case 'image':
        return (
          <div className="checkpoint-content">
            {checkpoint.content.imageUrl && (
              <img 
                src={checkpoint.content.imageUrl} 
                alt={checkpoint.title}
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            )}
            <p>{checkpoint.description}</p>
          </div>
        );

      case 'gallery':
        return (
          <div className="checkpoint-content">
            {checkpoint.content.images && (
              <div className="image-gallery" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '10px',
                marginBottom: '15px'
              }}>
                {checkpoint.content.images.map((imageUrl, index) => (
                  <img 
                    key={index}
                    src={imageUrl} 
                    alt={`${checkpoint.title} ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ))}
              </div>
            )}
            <p>{checkpoint.description}</p>
          </div>
        );

      default:
        return <p>{checkpoint.description}</p>;
    }
  };

  const getTypeIcon = () => {
    switch (checkpoint.type) {
      case 'info': return 'ℹ️';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'gallery': return '🎨';
      default: return '📍';
    }
  };

  return (
    <div 
      className="checkpoint-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="checkpoint-modal"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{getTypeIcon()}</span>
            <h2 style={{ margin: 0, color: '#333' }}>{checkpoint.title}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px'
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Audio if available */}
        {checkpoint.content.audioUrl && (
          <div style={{ marginTop: '15px' }}>
            <audio controls style={{ width: '100%' }}>
              <source src={checkpoint.content.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '15px', 
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckpointModal; 