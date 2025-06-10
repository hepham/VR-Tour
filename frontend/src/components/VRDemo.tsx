import React, { useState } from 'react';
import VRScene from './VRScene';
import Controls from './Controls';

interface VRDemoProps {
  panoramaUrl: string;
  initialYaw?: number;     // Góc xoay ngang (trái/phải) từ 0-360°
  initialPitch?: number;   // Góc xoay dọc (lên/xuống) từ -90 đến 90°
  onBack?: () => void;
}

const VRDemo: React.FC<VRDemoProps> = ({ 
  panoramaUrl, 
  initialYaw = 0, 
  initialPitch = 0, 
  onBack 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYaw, setCurrentYaw] = useState(initialYaw);
  const [currentPitch, setCurrentPitch] = useState(initialPitch);
  const [showControls, setShowControls] = useState(true);
  const [realTimeYaw, setRealTimeYaw] = useState(initialYaw);
  const [realTimePitch, setRealTimePitch] = useState(initialPitch);

  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleAudioToggle = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully in VRDemo');
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    console.log('Image failed to load in VRDemo');
    setIsLoading(false);
    setError('Failed to load panoramic image. Please check the file path.');
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  React.useEffect(() => {
    // Log the panorama URL for debugging
    console.log('VRDemo mounted with panorama URL:', panoramaUrl);
    
    // Test if the image URL is accessible
    fetch(panoramaUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log('Panorama URL is accessible:', response.status);
        } else {
          console.error('Panorama URL returned error:', response.status);
          setError(`Failed to access image (${response.status})`);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch panorama URL:', err);
        setError('Unable to access the panoramic image');
        setIsLoading(false);
      });
  }, [panoramaUrl]);

  // Demo hotspots (just for testing)
  const demoHotspots = [
    {
      id: 1,
      from_scene: 1,
      to_scene: 2,
      yaw: 45,
      pitch: 0,
      label: 'Demo Hotspot',
      size: 1.0,
      color: '#ffffff'
    }
  ];

  const handleHotspotClick = (sceneId: number) => {
    console.log('Hotspot clicked, would navigate to scene:', sceneId);
  };

  const handleCameraChange = (yaw: number, pitch: number) => {
    setRealTimeYaw(yaw);
    setRealTimePitch(pitch);
  };

  const copyCurrentPosition = () => {
    const positionText = `initialYaw={${realTimeYaw}} initialPitch={${realTimePitch}}`;
    navigator.clipboard.writeText(positionText).then(() => {
      alert('Đã copy vị trí camera!\n\n' + positionText);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = positionText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã copy vị trí camera!\n\n' + positionText);
    });
  };

  return (
    <div className="vr-demo-container">
      {/* Camera Control Panel */}
      {showControls && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          fontFamily: 'sans-serif',
          minWidth: '200px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Camera Controls</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Yaw (Ngang): {currentYaw}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={currentYaw}
              onChange={(e) => setCurrentYaw(Number(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Pitch (Dọc): {currentPitch}°</label>
            <input
              type="range"
              min="-90"
              max="90"
              value={currentPitch}
              onChange={(e) => setCurrentPitch(Number(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '5px', fontSize: '12px' }}>
            <button 
              onClick={() => { setCurrentYaw(0); setCurrentPitch(0); }}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Reset
            </button>
            <button 
              onClick={() => setShowControls(false)}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Hide
            </button>
          </div>
          
          <hr style={{ margin: '10px 0', borderColor: '#444' }} />
          
          <div style={{ marginBottom: '10px' }}>
            <h5 style={{ margin: '0 0 5px 0', color: '#0ff' }}>Góc nhìn hiện tại:</h5>
            <div style={{ 
              background: '#222', 
              padding: '8px', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              <div>Yaw: {realTimeYaw}°</div>
              <div>Pitch: {realTimePitch}°</div>
            </div>
            <button 
              onClick={copyCurrentPosition}
              style={{ 
                width: '100%', 
                marginTop: '5px', 
                padding: '8px', 
                background: '#0a84ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📋 Copy vị trí hiện tại
            </button>
          </div>

          <div style={{ fontSize: '11px', opacity: 0.7 }}>
            <div>Yaw: 0°=Bắc, 90°=Đông, 180°=Nam, 270°=Tây</div>
            <div>Pitch: 0°=Thẳng, +90°=Lên, -90°=Xuống</div>
          </div>
        </div>
      )}

      {/* Show controls button when hidden */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          📹 Camera
        </button>
      )}

      {/* Debug info panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Real-time: {realTimeYaw}°, {realTimePitch}°</div>
      </div>

      {isLoading && (
        <div className="demo-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading 360° Demo...</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>
              Loading: {panoramaUrl}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="demo-error">
          <h3>Unable to Load Image</h3>
          <p>{error}</p>
          <p>URL: {panoramaUrl}</p>
          <p>Please check that the image file is accessible.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )}

      <div className="demo-header">
        <h2>VR Demo - 360° Panoramic View</h2>
      </div>

      <div className="demo-viewer">
        <VRScene
          panoramaUrl={panoramaUrl}
          initialYaw={currentYaw}
          initialPitch={currentPitch}
          hotspots={demoHotspots}
          onHotspotClick={handleHotspotClick}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          onCameraChange={handleCameraChange}
        />

        <Controls
          onBack={onBack}
          onFullscreen={handleFullscreen}
          onAudioToggle={handleAudioToggle}
          isFullscreen={isFullscreen}
          isAudioEnabled={isAudioEnabled}
        />
      </div>
    </div>
  );
};

export default VRDemo; 