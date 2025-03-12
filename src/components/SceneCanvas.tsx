import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Element, Panel } from '../types/comic';

interface SceneCanvasProps {
  panel: Panel;
  updatePanel: (updatedPanel: Panel) => void;
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ panel, updatePanel }) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const handleElementSelect = (elementId: string) => {
    setSelectedElementId(elementId);
    
    // Update selected state in panel elements
    const updatedElements = panel.elements.map(element => ({
      ...element,
      isSelected: element.id === elementId
    }));
    
    updatePanel({
      ...panel,
      elements: updatedElements
    });
  };
  
  const handleElementMove = (elementId: string, x: number, y: number) => {
    const updatedElements = panel.elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          position: {
            ...element.position,
            x,
            y
          }
        };
      }
      return element;
    });
    
    updatePanel({
      ...panel,
      elements: updatedElements
    });
  };
  
  const handleElementResize = (elementId: string, width: number, height: number) => {
    const updatedElements = panel.elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          size: {
            width,
            height
          }
        };
      }
      return element;
    });
    
    updatePanel({
      ...panel,
      elements: updatedElements
    });
  };
  
  const moveElementLayer = (elementId: string, direction: 'up' | 'down') => {
    // Get current elements sorted by z-index
    const sortedElements = [...panel.elements].sort((a, b) => a.position.z - b.position.z);
    
    // Find the element index
    const elementIndex = sortedElements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;
    
    // Can't move up if already at top, or down if already at bottom
    if (
      (direction === 'up' && elementIndex === sortedElements.length - 1) ||
      (direction === 'down' && elementIndex === 0)
    ) {
      return;
    }
    
    // Swap z-index with adjacent element
    const adjacentIndex = direction === 'up' ? elementIndex + 1 : elementIndex - 1;
    const elementZ = sortedElements[elementIndex].position.z;
    const adjacentZ = sortedElements[adjacentIndex].position.z;
    
    const updatedElements = panel.elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          position: {
            ...element.position,
            z: adjacentZ
          }
        };
      } else if (element.id === sortedElements[adjacentIndex].id) {
        return {
          ...element,
          position: {
            ...element.position,
            z: elementZ
          }
        };
      }
      return element;
    });
    
    updatePanel({
      ...panel,
      elements: updatedElements
    });
  };
  
  const removeElement = (elementId: string) => {
    const updatedElements = panel.elements.filter(element => element.id !== elementId);
    
    updatePanel({
      ...panel,
      elements: updatedElements
    });
  };
  
  // Sort elements by z-index for proper layering
  const sortedElements = [...panel.elements].sort((a, b) => a.position.z - b.position.z);
  
  return (
    <div className="scene-canvas">
      <div className="canvas-controls">
        <button 
          onClick={() => selectedElementId && moveElementLayer(selectedElementId, 'up')}
          disabled={!selectedElementId}
        >
          Move Up
        </button>
        <button 
          onClick={() => selectedElementId && moveElementLayer(selectedElementId, 'down')}
          disabled={!selectedElementId}
        >
          Move Down
        </button>
        <button 
          onClick={() => selectedElementId && removeElement(selectedElementId)}
          disabled={!selectedElementId}
        >
          Remove
        </button>
      </div>
      
      <div className="canvas-area">
        {/* Background element (if exists) rendered first */}
        {panel.background && (
          <div 
            className="background-element"
            style={{
              backgroundImage: `url(${panel.background.imageUrl})`,
              backgroundSize: 'cover',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        )}
        
        {/* Render elements sorted by z-index */}
        {sortedElements.map(element => (
          <Rnd
            key={element.id}
            position={{ x: element.position.x, y: element.position.y }}
            size={{ width: element.size.width, height: element.size.height }}
            onDragStop={(e, d) => handleElementMove(element.id, d.x, d.y)}
            onResizeStop={(e, direction, ref, delta, position) => {
              handleElementResize(
                element.id, 
                ref.offsetWidth, 
                ref.offsetHeight
              );
              handleElementMove(element.id, position.x, position.y);
            }}
            className={`draggable-element ${element.isSelected ? 'selected' : ''}`}
            onClick={() => handleElementSelect(element.id)}
          >
            <div 
              className="element-content"
              style={{
                backgroundImage: `url(${element.imageUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%'
              }}
            />
          </Rnd>
        ))}
      </div>
    </div>
  );
};

export default SceneCanvas; 