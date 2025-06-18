import React, { useState, useCallback } from 'react';
import { Tour } from '../../../types';
import './styles.css';

interface TourMetadataFormProps {
  tour: Partial<Tour>;
  onChange: (updates: Partial<Tour>) => void;
}

const TourMetadataForm: React.FC<TourMetadataFormProps> = ({
  tour,
  onChange,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
        } else if (value.length > 100) {
          newErrors.title = 'Title must be less than 100 characters';
        } else {
          delete newErrors.title;
        }
        break;
      
      case 'description':
        if (value.length > 500) {
          newErrors.description = 'Description must be less than 500 characters';
        } else {
          delete newErrors.description;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = useCallback((field: keyof Tour, value: string) => {
    validateField(field, value);
    onChange({ [field]: value });
  }, [onChange, errors]);

  const handleThumbnailUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement thumbnail upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const thumbnail = e.target?.result as string;
        onChange({ thumbnail });
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  return (
    <div className="tour-metadata-form">
      <h3>📋 Tour Information</h3>
      
      <div className="form-group">
        <label htmlFor="tour-title" className="form-label">
          Title <span className="required">*</span>
        </label>
        <input
          id="tour-title"
          type="text"
          className={`form-input ${errors.title ? 'error' : ''}`}
          value={tour.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter tour title..."
          maxLength={100}
        />
        {errors.title && (
          <span className="error-message">{errors.title}</span>
        )}
        <div className="char-count">
          {(tour.title || '').length}/100
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tour-description" className="form-label">
          Description
        </label>
        <textarea
          id="tour-description"
          className={`form-textarea ${errors.description ? 'error' : ''}`}
          value={tour.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter tour description..."
          rows={4}
          maxLength={500}
        />
        {errors.description && (
          <span className="error-message">{errors.description}</span>
        )}
        <div className="char-count">
          {(tour.description || '').length}/500
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tour-thumbnail" className="form-label">
          Thumbnail Image
        </label>
        
        <div className="thumbnail-upload">
          {tour.thumbnail ? (
            <div className="thumbnail-preview">
              <img src={tour.thumbnail} alt="Tour thumbnail" />
              <div className="thumbnail-overlay">
                <button
                  type="button"
                  className="change-thumbnail-btn"
                  onClick={() => document.getElementById('tour-thumbnail')?.click()}
                >
                  📷 Change
                </button>
                <button
                  type="button"
                  className="remove-thumbnail-btn"
                  onClick={() => onChange({ thumbnail: '' })}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="thumbnail-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">🖼️</span>
                <p>Upload thumbnail image</p>
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => document.getElementById('tour-thumbnail')?.click()}
                >
                  Choose File
                </button>
              </div>
            </div>
          )}
          
          <input
            id="tour-thumbnail"
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="form-hint">
          Recommended: 16:9 aspect ratio, max 2MB
        </div>
      </div>

      <div className="form-stats">
        <div className="stat-item">
          <span className="stat-label">Status:</span>
          <span className="stat-value">
            {Object.keys(errors).length === 0 && tour.title ? 
              '✅ Valid' : '❌ Invalid'
            }
          </span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Last modified:</span>
          <span className="stat-value">
            {tour.updated_at ? 
              new Date(tour.updated_at).toLocaleString() : 
              'Never'
            }
          </span>
        </div>
      </div>

      <div className="form-actions">
        <div className="validation-summary">
          {Object.keys(errors).length > 0 && (
            <div className="error-summary">
              <strong>Please fix the following errors:</strong>
              <ul>
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourMetadataForm; 