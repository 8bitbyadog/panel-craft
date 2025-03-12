import React, { useState } from 'react';
import { generateElement } from '../services/api';
import { Element } from '../types/comic';
import { GenerationOptions } from '../types/api';

interface ElementLibraryProps {
  onAddElement: (element: Element) => void;
}

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onAddElement }) => {
  const [prompt, setPrompt] = useState('');
  const [elementType, setElementType] = useState<'character' | 'prop' | 'background'>('prop');
  const [style, setStyle] = useState<GenerationOptions['style']>('COMIC_BOOK');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedElements, setGeneratedElements] = useState<Element[]>([]);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a description of what to generate.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateElement(prompt, elementType, { style });
      
      if (!result.success) {
        setError(result.error.detail);
        console.error('Generation failed:', result.error);
        return;
      }
      
      const newElement: Element = {
        id: `element-${Date.now()}`,
        type: elementType,
        name: prompt,
        imageUrl: result.data,
        position: { x: 0, y: 0, z: 1 },
        size: { width: 200, height: 200 },
        rotation: 0,
        isSelected: false
      };
      
      setGeneratedElements(prev => [...prev, newElement]);
      setPrompt(''); // Clear the prompt after successful generation
    } catch (error) {
      console.error('Generation error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (error) setError(null); // Clear error when user starts typing
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating && prompt) {
      handleGenerate();
    }
  };

  return (
    <div className="element-library">
      <div className="generation-controls">
        <select 
          value={elementType} 
          onChange={(e) => setElementType(e.target.value as 'character' | 'prop' | 'background')}
          className="element-type-select"
        >
          <option value="prop">Prop</option>
          <option value="character">Character</option>
          <option value="background">Background</option>
        </select>

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as GenerationOptions['style'])}
          className="style-select"
        >
          <option value="COMIC_BOOK">Comic Book</option>
          <option value="PIXEL_ART">Pixel Art</option>
          <option value="REALISTIC">Realistic</option>
          <option value="CARTOON">Cartoon</option>
        </select>

        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          onKeyPress={handleKeyPress}
          placeholder="Describe what to generate..."
          className="prompt-input"
          disabled={isGenerating}
        />

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className="generate-button"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="generated-elements">
        {generatedElements.map(element => (
          <div key={element.id} className="element-card">
            <img src={element.imageUrl} alt={element.name} />
            <div className="element-info">
              <span>{element.name}</span>
              <button 
                onClick={() => {
                  onAddElement(element);
                  // Optional: Show feedback when element is added
                  const feedback = document.createElement('div');
                  feedback.textContent = 'Added to scene!';
                  feedback.className = 'add-feedback';
                  document.body.appendChild(feedback);
                  setTimeout(() => feedback.remove(), 2000);
                }}
                className="add-to-scene-button"
              >
                Add to Scene
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ElementLibrary; 