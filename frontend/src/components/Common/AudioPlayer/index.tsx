import React, { useRef, useEffect, useState } from 'react';
import './styles.css';

interface AudioPlayerProps {
  audioUrl: string;
  isEnabled: boolean;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  isEnabled,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      
      if (autoPlay && isEnabled) {
        audio.play().catch(console.error);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, isEnabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (!isEnabled && isPlaying) {
      audio.pause();
    }
  }, [isEnabled, isPlaying, isLoaded]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isEnabled) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (parseFloat(event.target.value) / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl || !isEnabled) {
    return null;
  }

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="audio-controls">
        <button
          onClick={togglePlayPause}
          className={`play-pause-btn ${isPlaying ? 'playing' : 'paused'}`}
          disabled={!isLoaded}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className="audio-progress">
          <span className="time-current">{formatTime(currentTime)}</span>
          
          <input
            type="range"
            min="0"
            max="100"
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="progress-bar"
            disabled={!isLoaded}
          />
          
          <span className="time-duration">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer; 