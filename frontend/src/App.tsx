import React, { useState } from 'react';
import { TourList, TourViewer } from './components/Tour';
import { VRDemo } from './components/VR';
import { TourEditor } from './components/Editor';
import './App.css';

interface AppState {
  currentView: 'list' | 'tour' | 'demo' | 'editor';
  selectedTourId: number | null;
  editingTourId: number | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'demo', // Start with demo mode to test the 360° image
    selectedTourId: null,
    editingTourId: null,
  });

  const handleTourSelect = (tourId: number) => {
    setAppState({
      currentView: 'tour',
      selectedTourId: tourId,
      editingTourId: null,
    });
  };

  const handleBackToList = () => {
    setAppState({
      currentView: 'list',
      selectedTourId: null,
      editingTourId: null,
    });
  };

  const handleDemoMode = () => {
    setAppState({
      currentView: 'demo',
      selectedTourId: null,
      editingTourId: null,
    });
  };

  const handleBackToDemo = () => {
    setAppState({
      currentView: 'demo',
      selectedTourId: null,
      editingTourId: null,
    });
  };

  const handleEditTour = (tourId?: number) => {
    setAppState({
      currentView: 'editor',
      selectedTourId: null,
      editingTourId: tourId || null,
    });
  };

  const handleSaveTour = (tour: any) => {
    console.log('Tour saved:', tour);
    // TODO: Save tour to backend
    handleBackToList();
  };

  const handleCancelEdit = () => {
    handleBackToList();
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
      case 'editor':
        return (
          <TourEditor
            tourId={appState.editingTourId || undefined}
            onSave={handleSaveTour}
            onCancel={handleCancelEdit}
          />
        );
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
          {appState.currentView !== 'editor' && (
            <button 
              className="nav-button editor-button"
              onClick={() => handleEditTour()}
              aria-label="Tour Editor"
            >
              ✏️ Editor
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {renderCurrentView()}
      </main>

      <footer className="app-footer">
        <p>Powered by hepham developer</p>
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