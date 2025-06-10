import React from 'react';

interface ControlsProps {
  onBack?: () => void;
  onFullscreen?: () => void;
  onAudioToggle?: () => void;
  isFullscreen: boolean;
  isAudioEnabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onBack,
  onFullscreen,
  onAudioToggle,
  isFullscreen,
  isAudioEnabled,
}) => {
  return (
    <div className="vr-controls">
      <div className="controls-group controls-left">
        {onBack && (
          <button
            onClick={onBack}
            className="control-button back-button"
            title="Back to tour list"
          >
            <span className="control-icon">←</span>
            <span className="control-label">Back</span>
          </button>
        )}
      </div>

      <div className="controls-group controls-center">
        <div className="vr-instructions">
          <span>Drag to look around • Scroll to zoom • Click hotspots to navigate</span>
        </div>
      </div>

      <div className="controls-group controls-right">
        {onAudioToggle && (
          <button
            onClick={onAudioToggle}
            className={`control-button audio-button ${isAudioEnabled ? 'enabled' : 'disabled'}`}
            title={isAudioEnabled ? 'Disable audio' : 'Enable audio'}
          >
            <span className="control-icon">
              {isAudioEnabled ? '🔊' : '🔇'}
            </span>
            <span className="control-label">Audio</span>
          </button>
        )}

        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="control-button fullscreen-button"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <span className="control-icon">
              {isFullscreen ? '⛶' : '⛶'}
            </span>
            <span className="control-label">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Controls; 