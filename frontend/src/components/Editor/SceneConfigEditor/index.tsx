import React from 'react';
import { Scene } from '../../../types';
import './styles.css';

interface SceneConfigEditorProps {
  scene: Scene;
  onUpdateScene: (updates: Partial<Scene>) => void;
}

const SceneConfigEditor: React.FC<SceneConfigEditorProps> = ({
  scene,
  onUpdateScene,
}) => {
  const [backgroundAudioMode, setBackgroundAudioMode] = React.useState<'url' | 'upload'>('url');
  const [voiceoverAudioMode, setVoiceoverAudioMode] = React.useState<'url' | 'upload'>('url');

  const handleFieldChange = (field: keyof Scene, value: any) => {
    onUpdateScene({ [field]: value });
  };

  return (
    <div className="scene-config-editor">
      <div className="config-section">
        <h4>Scene Settings</h4>
        
        {/* Basic Info */}
        <div className="form-group">
          <label>Scene Title</label>
          <input
            type="text"
            className="form-input"
            value={scene.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Enter scene title"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-textarea"
            value={scene.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Scene description"
            rows={3}
          />
        </div>
      </div>

      {/* Camera Settings */}
      <div className="config-section">
        <h4>Initial Camera Position</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label>Yaw (°)</label>
            <input
              type="number"
              className="form-input"
              value={scene.default_yaw || 0}
              onChange={(e) => handleFieldChange('default_yaw', parseFloat(e.target.value) || 0)}
              min="-180"
              max="180"
              step="1"
            />
          </div>
          
          <div className="form-group">
            <label>Pitch (°)</label>
            <input
              type="number"
              className="form-input"
              value={scene.default_pitch || 0}
              onChange={(e) => handleFieldChange('default_pitch', parseFloat(e.target.value) || 0)}
              min="-90"
              max="90"
              step="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Initial Zoom (%)</label>
          <input
            type="range"
            className="form-range"
            value={scene.initial_zoom || 75}
            onChange={(e) => handleFieldChange('initial_zoom', parseInt(e.target.value))}
            min="10"
            max="150"
          />
          <span className="range-value">{scene.initial_zoom || 75}%</span>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="config-section">
        <h4>Audio</h4>
        
        <div className="form-group">
          <label>Background Audio</label>
          <div className="audio-input-group">
            <div className="audio-tabs">
              <button
                type="button"
                className={`audio-tab ${backgroundAudioMode === 'url' ? 'active' : ''}`}
                onClick={() => {
                  setBackgroundAudioMode('url');
                  handleFieldChange('background_audio_file', null);
                }}
              >
                URL
              </button>
              <button
                type="button"
                className={`audio-tab ${backgroundAudioMode === 'upload' ? 'active' : ''}`}
                onClick={() => {
                  setBackgroundAudioMode('upload');
                  handleFieldChange('background_audio', '');
                }}
              >
                Upload
              </button>
            </div>
            
            {backgroundAudioMode === 'url' ? (
              <input
                type="url"
                className="form-input"
                value={scene.background_audio || ''}
                onChange={(e) => handleFieldChange('background_audio', e.target.value)}
                placeholder="https://example.com/audio.mp3"
              />
            ) : (
              <div className="file-upload-area">
                <input
                  type="file"
                  id="background-audio-upload"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 50 * 1024 * 1024) { // 50MB limit
                      handleFieldChange('background_audio_file', file);
                      handleFieldChange('background_audio', URL.createObjectURL(file));
                    }
                  }}
                />
                <div 
                  className="file-drop-zone"
                  onClick={() => document.getElementById('background-audio-upload')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const file = files[0];
                      if (file.type.startsWith('audio/') && file.size <= 50 * 1024 * 1024) {
                        handleFieldChange('background_audio_file', file);
                        handleFieldChange('background_audio', URL.createObjectURL(file));
                      }
                    }
                  }}
                >
                  {scene.background_audio_file ? (
                    <div className="file-info">
                      <span className="file-icon">🎵</span>
                      <div className="file-details">
                        <span className="file-name">{scene.background_audio_file.name}</span>
                        <span className="file-size">
                          {(scene.background_audio_file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFieldChange('background_audio_file', null);
                          handleFieldChange('background_audio', '');
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <span className="upload-icon">📁</span>
                      <span>Drop audio file here or click to browse</span>
                      <span className="upload-hint">MP3, WAV, OGG up to 50MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voiceover Audio */}
        <div className="form-group">
          <label>Voiceover Audio</label>
          <div className="audio-input-group">
            <div className="audio-tabs">
              <button
                type="button"
                className={`audio-tab ${voiceoverAudioMode === 'url' ? 'active' : ''}`}
                onClick={() => {
                  setVoiceoverAudioMode('url');
                  handleFieldChange('voiceover_audio_file', null);
                }}
              >
                URL
              </button>
              <button
                type="button"
                className={`audio-tab ${voiceoverAudioMode === 'upload' ? 'active' : ''}`}
                onClick={() => {
                  setVoiceoverAudioMode('upload');
                  handleFieldChange('voiceover_audio', '');
                }}
              >
                Upload
              </button>
            </div>
            
            {voiceoverAudioMode === 'url' ? (
              <input
                type="url"
                className="form-input"
                value={scene.voiceover_audio || ''}
                onChange={(e) => handleFieldChange('voiceover_audio', e.target.value)}
                placeholder="https://example.com/voiceover.mp3"
              />
            ) : (
              <div className="file-upload-area">
                <input
                  type="file"
                  id="voiceover-audio-upload"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 50 * 1024 * 1024) { // 50MB limit
                      handleFieldChange('voiceover_audio_file', file);
                      handleFieldChange('voiceover_audio', URL.createObjectURL(file));
                    }
                  }}
                />
                <div 
                  className="file-drop-zone"
                  onClick={() => document.getElementById('voiceover-audio-upload')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const file = files[0];
                      if (file.type.startsWith('audio/') && file.size <= 50 * 1024 * 1024) {
                        handleFieldChange('voiceover_audio_file', file);
                        handleFieldChange('voiceover_audio', URL.createObjectURL(file));
                      }
                    }
                  }}
                >
                  {scene.voiceover_audio_file ? (
                    <div className="file-info">
                      <span className="file-icon">🎤</span>
                      <div className="file-details">
                        <span className="file-name">{scene.voiceover_audio_file.name}</span>
                        <span className="file-size">
                          {(scene.voiceover_audio_file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFieldChange('voiceover_audio_file', null);
                          handleFieldChange('voiceover_audio', '');
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <span className="upload-icon">📁</span>
                      <span>Drop voiceover file here or click to browse</span>
                      <span className="upload-hint">MP3, WAV, OGG up to 50MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Background Audio Volume */}
        {(scene.background_audio || scene.background_audio_file) && (
          <div className="form-group">
            <label>Background Audio Volume</label>
            <input
              type="range"
              className="form-range"
              value={scene.background_audio_volume || 30}
              onChange={(e) => handleFieldChange('background_audio_volume', parseInt(e.target.value))}
              min="0"
              max="100"
            />
            <span className="range-value">{scene.background_audio_volume || 30}%</span>
          </div>
        )}

        {/* Voiceover Audio Volume */}
        {(scene.voiceover_audio || scene.voiceover_audio_file) && (
          <div className="form-group">
            <label>Voiceover Audio Volume</label>
            <input
              type="range"
              className="form-range"
              value={scene.voiceover_audio_volume || 80}
              onChange={(e) => handleFieldChange('voiceover_audio_volume', parseInt(e.target.value))}
              min="0"
              max="100"
            />
            <span className="range-value">{scene.voiceover_audio_volume || 80}%</span>
          </div>
        )}

        {/* Auto-play Controls */}
        {(scene.background_audio || scene.background_audio_file) && (
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scene.background_audio_autoplay || false}
                onChange={(e) => handleFieldChange('background_audio_autoplay', e.target.checked)}
              />
              Auto-play background audio when scene loads
            </label>
          </div>
        )}

        {(scene.voiceover_audio || scene.voiceover_audio_file) && (
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scene.voiceover_audio_autoplay || false}
                onChange={(e) => handleFieldChange('voiceover_audio_autoplay', e.target.checked)}
              />
              Auto-play voiceover audio when scene loads
            </label>
          </div>
        )}
      </div>

      {/* Text Overlay */}
      <div className="config-section">
        <h4>Text Overlay</h4>
        
        <div className="form-group">
          <label>Overlay Text</label>
          <textarea
            className="form-textarea"
            value={scene.overlay_text || ''}
            onChange={(e) => handleFieldChange('overlay_text', e.target.value)}
            placeholder="Text to display on scene"
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Text Position</label>
            <select
              className="form-select"
              value={scene.text_position || 'bottom-left'}
              onChange={(e) => handleFieldChange('text_position', e.target.value)}
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="center-left">Center Left</option>
              <option value="center">Center</option>
              <option value="center-right">Center Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        </div>
      </div>

      {/* Article/Information */}
      <div className="config-section">
        <h4>Information Article</h4>
        
        <div className="form-group">
          <label>Article Title</label>
          <input
            type="text"
            className="form-input"
            value={scene.article_title || ''}
            onChange={(e) => handleFieldChange('article_title', e.target.value)}
            placeholder="Article title"
          />
        </div>

        <div className="form-group">
          <label>Article Content</label>
          <textarea
            className="form-textarea"
            value={scene.article_content || ''}
            onChange={(e) => handleFieldChange('article_content', e.target.value)}
            placeholder="Article content in markdown format"
            rows={6}
          />
        </div>

        <div className="form-group">
          <label>Article URL</label>
          <input
            type="url"
            className="form-input"
            value={scene.article_url || ''}
            onChange={(e) => handleFieldChange('article_url', e.target.value)}
            placeholder="External article URL"
          />
        </div>
      </div>
    </div>
  );
};

export default SceneConfigEditor; 