import React, { useState, useEffect } from 'react';
import { Tour } from '../../../types';
import { tourAPI, getMediaUrl } from '../../../services/api';
import './styles.css';

interface TourListProps {
  onTourSelect: (tourId: number) => void;
}

const TourList: React.FC<TourListProps> = ({ onTourSelect }) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      const toursData = await tourAPI.getTours();
      setTours(toursData);
    } catch (err) {
      setError('Failed to load tours. Please try again later.');
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      fetchTours();
      return;
    }

    try {
      setLoading(true);
      const toursData = await tourAPI.getTours();
      // Client-side filtering for simplicity
      const filtered = toursData.filter(tour =>
        tour.title.toLowerCase().includes(query.toLowerCase()) ||
        tour.description.toLowerCase().includes(query.toLowerCase())
      );
      setTours(filtered);
    } catch (err) {
      setError('Failed to search tours.');
    } finally {
      setLoading(false);
    }
  };

  const handleTourClick = (tour: Tour) => {
    if (tour.scene_count > 0) {
      onTourSelect(tour.id);
    }
  };

  if (loading) {
    return (
      <div className="tour-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading tours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-list-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchTours} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-list-container">
      <div className="tour-list-header">
        <h2>Available Tours</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search tours..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="no-tours">
          <p>No tours available.</p>
        </div>
      ) : (
        <div className="tours-grid">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className={`tour-card ${tour.scene_count === 0 ? 'disabled' : ''}`}
              onClick={() => handleTourClick(tour)}
              role="button"
              tabIndex={tour.scene_count > 0 ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTourClick(tour);
                }
              }}
            >
              <div className="tour-thumbnail">
                {tour.thumbnail ? (
                  <img
                    src={getMediaUrl(tour.thumbnail)}
                    alt={tour.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <span>📷</span>
                  </div>
                )}
              </div>
              
              <div className="tour-info">
                <h3 className="tour-title">{tour.title}</h3>
                <p className="tour-description">
                  {tour.description || 'No description available'}
                </p>
                <div className="tour-meta">
                  <span className="scene-count">
                    {tour.scene_count} {tour.scene_count === 1 ? 'scene' : 'scenes'}
                  </span>
                  <span className="tour-date">
                    {new Date(tour.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {tour.scene_count === 0 && (
                <div className="disabled-overlay">
                  <span>No scenes available</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TourList; 