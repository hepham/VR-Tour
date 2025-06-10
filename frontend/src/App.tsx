import React, { useState } from 'react';
import TourList from './components/TourList';
import TourViewer from './components/TourViewer';
import VRDemo from './components/VRDemo';
import './App.css';

interface AppState {
  currentView: 'list' | 'tour' | 'demo';
  selectedTourId: number | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'demo', // Start with demo mode to test the 360° image
    selectedTourId: null,
  });

  const handleTourSelect = (tourId: number) => {
    setAppState({
      currentView: 'tour',
      selectedTourId: tourId,
    });
  };

  const handleBackToList = () => {
    setAppState({
      currentView: 'list',
      selectedTourId: null,
    });
  };

  const handleDemoMode = () => {
    setAppState({
      currentView: 'demo',
      selectedTourId: null,
    });
  };

  const handleBackToDemo = () => {
    setAppState({
      currentView: 'demo',
      selectedTourId: null,
    });
  };

  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'demo':
        return (
          <VRDemo
            panoramaUrl="./iStock_2170832197.jpg" // Your 360° image
            initialYaw={73}    // Góc nhìn ngang theo yêu cầu
            initialPitch={-31} // Góc nhìn dọc theo yêu cầu
            onBack={handleBackToList}
          />
        );
      case 'tour':
        return appState.selectedTourId ? (
          <TourViewer 
            tourId={appState.selectedTourId} 
            onBack={handleBackToList}
          />
        ) : null;
      case 'list':
      default:
        return <TourList onTourSelect={handleTourSelect} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>360° VR Tours</h1>
        <div className="header-controls">
          {appState.currentView !== 'list' && (
            <button 
              className="nav-button"
              onClick={handleBackToList}
              aria-label="Back to tour list"
            >
              ← Tours
            </button>
          )}
          {appState.currentView !== 'demo' && (
            <button 
              className="nav-button demo-button"
              onClick={handleDemoMode}
              aria-label="VR Demo"
            >
              🥽 Demo
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {renderCurrentView()}
      </main>

      <footer className="app-footer">
        <p>Powered by Three.js and React</p>
        {appState.currentView === 'demo' && (
          <p className="demo-info">
            Demo Mode - Testing 360° panoramic viewer
          </p>
        )}
      </footer>
    </div>
  );
};

export default App; 