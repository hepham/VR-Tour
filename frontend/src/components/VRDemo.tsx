import React, { useState, useEffect } from 'react';
import VRScene from './VRScene';
import Controls from './Controls';
import CheckpointModal from './CheckpointModal';
import CheckpointList from './CheckpointList';

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
  const [zoomLevel, setZoomLevel] = useState(75); // Default FOV = 75 degrees
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<any>(null);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [isCheckpointListVisible, setIsCheckpointListVisible] = useState(false);


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

  // Demo checkpoints for testing - positioned at cardinal directions for easy testing
  const demoCheckpoints = [
    {
      id: 1,
      scene_id: 1,
      yaw: 0,    // North (front)
      pitch: 0,  // Eye level
      title: 'Hố sụt 1 (Doline 1)',
      description: 'Hố sụt tự nhiên được hình thành bởi quá trình karst - sự hòa tan của đá vôi',
      type: 'info' as const,
      content: {
        text: `Doline là một hố sụt tự nhiên được hình thành thông qua quá trình karst - sự hòa tan của đá vôi bởi nước mưa có tính axit yếu.

🔍 Đặc điểm:
• Đường kính: 20-50m
• Độ sâu: 10-30m  
• Tuổi: Hàng triệu năm
• Hệ sinh thái độc đáo bên trong

🌿 Hệ sinh thái:
Bên trong hố sụt có vi khí hậu đặc biệt với độ ẩm cao và nhiệt độ ổn định, tạo điều kiện cho các loài thực vật đặc hữu phát triển.

📍 Vị trí: Khu vực karst miền Bắc Việt Nam`
      },
      size: 3.5,
      color: '#FF6B35',
      icon: '🕳️'
    },
    {
      id: 2,
      scene_id: 1,
      yaw: 90,   // East (right)
      pitch: 0,  // Eye level
      title: 'Thực vật đặc hữu',
      description: 'Hệ thực vật độc đáo trong môi trường karst',
      type: 'gallery' as const,
      content: {
        images: [
          './iStock_2170832197.jpg',
          './iStock_2170832197.jpg',
          './iStock_2170832197.jpg'
        ]
      },
      size: 2.5,
      color: '#27AE60',
      icon: '🌿'
    },
    {
      id: 3,
      scene_id: 1,
      yaw: 180,  // South (back)
      pitch: 0,  // Eye level
      title: 'Địa chất karst',
      description: 'Cấu trúc địa chất đá vôi đặc trưng',
      type: 'image' as const,
      content: {
        imageUrl: './iStock_2170832197.jpg'
      },
      size: 3,
      color: '#6C7B7F',
      icon: '🗻'
    },
    {
      id: 4,
      scene_id: 1,
      yaw: 270,  // West (left)
      pitch: 0,  // Eye level
      title: 'Video giới thiệu',
      description: 'Video tổng quan về khu vực karst',
      type: 'video' as const,
      content: {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      },
      size: 3,
      color: '#E74C3C',
      icon: '🎥'
    }
  ];

  const handleHotspotClick = (sceneId: number) => {
    console.log('Hotspot clicked, would navigate to scene:', sceneId);
  };

  const handleCheckpointClick = (checkpoint: any) => {
    console.log('Checkpoint clicked:', checkpoint);
    setSelectedCheckpoint(checkpoint);
    setIsCheckpointModalOpen(true);
  };

  const handleCloseCheckpointModal = () => {
    setIsCheckpointModalOpen(false);
    setSelectedCheckpoint(null);
  };

  const handleNavigateToCheckpoint = (yaw: number, pitch: number) => {
    setCurrentYaw(yaw);
    setCurrentPitch(pitch);
  };

  const handleToggleCheckpointList = () => {
    setIsCheckpointListVisible(!isCheckpointListVisible);
  };

  const handleCameraChange = (yaw: number, pitch: number) => {
    setRealTimeYaw(yaw);
    setRealTimePitch(pitch);
    // Chỉ cập nhật slider nếu lệch > 1 độ
    if (Math.abs(Math.round(currentYaw) - Math.round(yaw)) > 1) setCurrentYaw(Math.round(yaw));
    if (Math.abs(Math.round(currentPitch) - Math.round(pitch)) > 1) setCurrentPitch(Math.round(pitch));
  };

  const handleZoomChange = (zoom: number) => {
    setZoomLevel(zoom);
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
          
          <div style={{ marginBottom: '10px' }}>
            <label>Zoom Level: {Math.round((120 - zoomLevel) / 45 * 100)}%</label>
            <input
              type="range"
              min="30"
              max="120"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
              <span>Zoom In</span>
              <span>Normal</span>
              <span>Zoom Out</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', fontSize: '12px' }}>
            <button 
              onClick={() => { 
                setCurrentYaw(0); 
                setCurrentPitch(0); 
                setRealTimeYaw(0);
                setRealTimePitch(0);
                setZoomLevel(75); 
              }}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Reset All
            </button>
            <button 
              onClick={() => { 
                setCurrentYaw(73); 
                setCurrentPitch(-31); 
                setRealTimeYaw(73);
                setRealTimePitch(-31);
              }}
              style={{ padding: '5px 10px', fontSize: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
            >
              🏠 Original View
            </button>
            <button 
              onClick={() => {
                const checkpointCode = `{
  id: ${Date.now()},
  scene_id: 1,
  yaw: ${Math.round(realTimeYaw)},
  pitch: ${Math.round(realTimePitch)},
  title: 'New Checkpoint',
  description: 'Mô tả checkpoint',
  type: 'info',
  content: { text: 'Nội dung checkpoint...' },
  size: 3,
  color: '#4A90E2'
}`;
                navigator.clipboard.writeText(checkpointCode);
                alert('📋 Đã copy code checkpoint vào clipboard!');
              }}
              style={{ padding: '5px 10px', fontSize: '12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px' }}
            >
              📋 Copy Checkpoint
            </button>
            <button 
              onClick={() => setZoomLevel(45)}
              style={{ padding: '5px 10px', fontSize: '12px', background: '#0a84ff', color: 'white', border: 'none', borderRadius: '3px' }}
            >
              🔍+ Zoom In
            </button>
            <button 
              onClick={() => setZoomLevel(105)}
              style={{ padding: '5px 10px', fontSize: '12px', background: '#ff6b35', color: 'white', border: 'none', borderRadius: '3px' }}
            >
              🔍- Zoom Out
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

          <hr style={{ margin: '10px 0', borderColor: '#444' }} />

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
        <div>Zoom FOV: {zoomLevel}°</div>
        <div>Rotate Speed: {Math.round((0.3 + ((zoomLevel - 30) / (120 - 30)) * 0.7) * 100)}%</div>
        <div style={{ color: '#4A90E2' }}>Checkpoints: {demoCheckpoints.length}</div>
        <div style={{ color: '#27AE60', fontSize: '10px', marginTop: '5px' }}>
          Checkpoint positions:
          {demoCheckpoints.map(cp => (
            <div key={cp.id}>#{cp.id}: {cp.yaw}°,{cp.pitch}°</div>
          ))}
        </div>
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
        <p style={{ 
          fontSize: '14px', 
          color: 'rgba(255, 255, 255, 0.7)', 
          marginTop: '5px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          🎯 Click vào các checkpoint để xem nội dung | 📋 Dùng "Copy Checkpoint" để tạo checkpoint mới
        </p>
      </div>

      <div className="demo-viewer">
        <VRScene
          panoramaUrl={panoramaUrl}
          yaw={currentYaw}
          pitch={currentPitch}
          zoomLevel={zoomLevel}
          hotspots={demoHotspots}
          checkpoints={demoCheckpoints}
          onHotspotClick={handleHotspotClick}
          onCheckpointClick={handleCheckpointClick}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          onCameraChange={handleCameraChange}
          onZoomChange={handleZoomChange}
        />

        <Controls
          onBack={onBack}
          onFullscreen={handleFullscreen}
          onAudioToggle={handleAudioToggle}
          isFullscreen={isFullscreen}
          isAudioEnabled={isAudioEnabled}
        />
      </div>

      {/* Checkpoint List */}
      <CheckpointList
        checkpoints={demoCheckpoints}
        onNavigateToCheckpoint={handleNavigateToCheckpoint}
        onCheckpointClick={handleCheckpointClick}
        isVisible={isCheckpointListVisible}
        onToggle={handleToggleCheckpointList}
      />

      {/* Checkpoint Modal */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        isOpen={isCheckpointModalOpen}
        onClose={handleCloseCheckpointModal}
      />
    </div>
  );
};

export default VRDemo; 