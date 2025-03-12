import React, { useState, useEffect } from 'react';
import ElementLibrary from './components/ElementLibrary';
import SceneCanvas from './components/SceneCanvas';
import ScriptEditor from './components/ScriptEditor';
import { generateComicScript } from './services/api';
import { Comic, Panel, Element } from './types/comic';
import './App.css';

function App() {
  // API key state
  const [huggingfaceApiKey, setHuggingfaceApiKey] = useState(localStorage.getItem('huggingfaceApiKey') || '');
  
  // Comic state
  const [comic, setComic] = useState<Comic>({
    id: `comic-${Date.now()}`,
    title: 'My Comic',
    panels: []
  });
  
  // UI state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [scriptPanelCount, setScriptPanelCount] = useState(4);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'script'>('library');
  
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('comic', JSON.stringify(comic));
  }, [comic]);
  
  useEffect(() => {
    if (huggingfaceApiKey) localStorage.setItem('huggingfaceApiKey', huggingfaceApiKey);
  }, [huggingfaceApiKey]);
  
  // Load from localStorage
  useEffect(() => {
    const savedComic = localStorage.getItem('comic');
    if (savedComic) {
      try {
        setComic(JSON.parse(savedComic));
      } catch (e) {
        console.error('Failed to parse saved comic', e);
      }
    }
  }, []);
  
  // Generate script
  const handleGenerateScript = async () => {
    if (!huggingfaceApiKey) {
      alert('Please enter your Hugging Face API key in settings');
      return;
    }
    
    if (!scriptPrompt) return;
    
    setIsGeneratingScript(true);
    try {
      const scriptText = await generateComicScript(
        scriptPrompt,
        scriptPanelCount,
        [], // No characters for now
        'adventure'
      );
      
      // Parse script into panels
      const panelDescriptions = scriptText.split('\n').filter(line => line.trim());
      
      // Create new panels
      const newPanels: Panel[] = panelDescriptions.map(description => ({
        id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description,
        elements: []
      }));
      
      // Add panels to comic
      setComic({
        ...comic,
        panels: [...comic.panels, ...newPanels]
      });
    } catch (error) {
      console.error('Failed to generate script:', error);
      alert('Failed to generate script. See console for details.');
    } finally {
      setIsGeneratingScript(false);
    }
  };
  
  // Add element to active panel
  const addElementToPanel = (element: Element) => {
    if (!activePanel) {
      alert('Please select a panel first');
      return;
    }
    
    const updatedPanels = comic.panels.map(panel => {
      if (panel.id === activePanel) {
        // If it's a background element, set it as the panel background
        if (element.type === 'background') {
          return {
            ...panel,
            background: element
          };
        } else {
          // Otherwise add it to the elements array
          return {
            ...panel,
            elements: [...panel.elements, element]
          };
        }
      }
      return panel;
    });
    
    setComic({
      ...comic,
      panels: updatedPanels
    });
  };
  
  // Update panel
  const updatePanel = (updatedPanel: Panel) => {
    const updatedPanels = comic.panels.map(panel => 
      panel.id === updatedPanel.id ? updatedPanel : panel
    );
    
    setComic({
      ...comic,
      panels: updatedPanels
    });
  };
  
  // Add new empty panel
  const addEmptyPanel = () => {
    const newPanel: Panel = {
      id: `panel-${Date.now()}`,
      description: 'New panel',
      elements: []
    };
    
    setComic({
      ...comic,
      panels: [...comic.panels, newPanel]
    });
    
    // Activate the new panel
    setActivePanel(newPanel.id);
  };
  
  // Get active panel object
  const getActivePanel = () => {
    return comic.panels.find(panel => panel.id === activePanel);
  };
  
  // Export comic
  const exportComic = () => {
    // For MVP, we just download the comic data as JSON
    const dataStr = JSON.stringify(comic, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${comic.title.replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Layered Comic Creator</h1>
        <input
          type="text"
          value={comic.title}
          onChange={(e) => setComic({...comic, title: e.target.value})}
          placeholder="Comic title"
          className="title-input"
        />
      </header>
      
      <div className="settings-panel">
        <label>
          Hugging Face API Key:
          <input 
            type="text" 
            value={huggingfaceApiKey} 
            onChange={(e) => setHuggingfaceApiKey(e.target.value)}
            placeholder="Enter Hugging Face API key" 
          />
        </label>
      </div>
      
      <div className="main-content">
        <div className="panels-list">
          <h2>Panels</h2>
          <div className="panels-container">
            {comic.panels.map(panel => (
              <div 
                key={panel.id} 
                className={`panel-item ${panel.id === activePanel ? 'active' : ''}`}
                onClick={() => setActivePanel(panel.id)}
              >
                <div className="panel-preview">
                  {panel.background && (
                    <img 
                      src={panel.background.imageUrl} 
                      alt="Background" 
                      className="background-preview" 
                    />
                  )}
                  {panel.elements.length > 0 && (
                    <div className="elements-count">
                      {panel.elements.length} elements
                    </div>
                  )}
                </div>
                <div className="panel-title">{panel.description}</div>
              </div>
            ))}
            <button className="add-panel-btn" onClick={addEmptyPanel}>
              + Add Panel
            </button>
          </div>
        </div>
        
        <div className="editor-area">
          {activePanel ? (
            getActivePanel() && (
              <SceneCanvas 
                panel={getActivePanel()!} 
                updatePanel={updatePanel} 
              />
            )
          ) : (
            <div className="no-panel-selected">
              <p>Select a panel or create a new one</p>
            </div>
          )}
        </div>
        
        <div className="sidebar">
          <div className="tabs">
            <button 
              className={activeTab === 'library' ? 'active' : ''} 
              onClick={() => setActiveTab('library')}
            >
              Element Library
            </button>
            <button 
              className={activeTab === 'script' ? 'active' : ''} 
              onClick={() => setActiveTab('script')}
            >
              Script Generator
            </button>
          </div>
          
          {activeTab === 'library' ? (
            <ElementLibrary onAddElement={addElementToPanel} />
          ) : (
            <div className="script-generator">
              <h2>Generate Comic Script</h2>
              <ScriptEditor 
                onGenerateElement={(imageUrl) => {
                  if (activePanel) {
                    addElementToPanel({
                      id: `element-${Date.now()}`,
                      type: 'character',
                      name: 'Generated Character',
                      imageUrl,
                      position: { x: 0, y: 0, z: 1 },
                      size: { width: 200, height: 200 },
                      rotation: 0,
                      isSelected: false
                    });
                  } else {
                    alert('Please select a panel first');
                  }
                }}
              />
              <div className="generator-form">
                <label>
                  Story Idea:
                  <input 
                    type="text" 
                    value={scriptPrompt} 
                    onChange={(e) => setScriptPrompt(e.target.value)}
                    placeholder="Describe your comic idea..."
                  />
                </label>
                <label>
                  Number of Panels:
                  <input 
                    type="number" 
                    min={1}
                    max={10}
                    value={scriptPanelCount} 
                    onChange={(e) => setScriptPanelCount(parseInt(e.target.value))}
                  />
                </label>
                <button 
                  onClick={handleGenerateScript} 
                  disabled={isGeneratingScript || !scriptPrompt}
                >
                  {isGeneratingScript ? 'Generating...' : 'Generate Script'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="app-footer">
        <button onClick={exportComic} className="export-btn">
          Export Comic
        </button>
      </div>
    </div>
  );
}

export default App; 