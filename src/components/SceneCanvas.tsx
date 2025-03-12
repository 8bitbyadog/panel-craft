import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Transformer, Group } from 'react-konva';
import { Element, Panel } from '../types/comic';

interface SceneCanvasProps {
  panel: Panel;
  updatePanel: (updatedPanel: Panel) => void;
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ panel, updatePanel }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load images
  useEffect(() => {
    const loadImage = (element: Element) => {
      const img = new window.Image();
      img.src = element.imageUrl;
      img.onload = () => {
        setImages(prev => ({
          ...prev,
          [element.id]: img
        }));
      };
    };

    panel.elements.forEach(loadImage);
    if (panel.background?.imageUrl) {
      const bgImg = new window.Image();
      bgImg.src = panel.background.imageUrl;
      bgImg.onload = () => {
        setImages(prev => ({
          ...prev,
          background: bgImg
        }));
      };
    }
  }, [panel.elements, panel.background]);

  // Update stage size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle selection
  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Update transformer on selection change
  useEffect(() => {
    if (transformerRef.current) {
      const node = stageRef.current?.findOne('#' + selectedId);
      transformerRef.current.nodes(node ? [node] : []);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Handle element transform
  const handleTransform = (elementId: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const x = node.x();
    const y = node.y();

    const updatedElements = panel.elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          position: { ...element.position, x, y },
          size: {
            width: element.size.width * scaleX,
            height: element.size.height * scaleY
          },
          rotation: rotation
        };
      }
      return element;
    });

    updatePanel({
      ...panel,
      elements: updatedElements
    });

    // Reset scale after updating size
    node.scaleX(1);
    node.scaleY(1);
  };

  // Handle element drag
  const handleDragEnd = (elementId: string, e: any) => {
    const updatedElements = panel.elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          position: {
            ...element.position,
            x: e.target.x(),
            y: e.target.y()
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

  return (
    <div ref={containerRef} className="scene-canvas">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {/* Background */}
          {panel.background && images.background && (
            <Image
              image={images.background}
              width={stageSize.width}
              height={stageSize.height}
              opacity={0.5}
            />
          )}

          {/* Elements */}
          {panel.elements
            .sort((a, b) => a.position.z - b.position.z)
            .map(element => {
              if (!images[element.id]) return null;

              return (
                <Group
                  key={element.id}
                  id={element.id}
                  x={element.position.x}
                  y={element.position.y}
                  width={element.size.width}
                  height={element.size.height}
                  rotation={element.rotation || 0}
                  draggable
                  onClick={() => setSelectedId(element.id)}
                  onTap={() => setSelectedId(element.id)}
                  onDragEnd={(e) => handleDragEnd(element.id, e)}
                  onTransformEnd={(e) => handleTransform(element.id, e)}
                >
                  <Image
                    image={images[element.id]}
                    width={element.size.width}
                    height={element.size.height}
                    opacity={element.opacity || 1}
                  />
                </Group>
              );
            })}

          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              const minWidth = 5;
              const minHeight = 5;
              const maxWidth = stageSize.width;
              const maxHeight = stageSize.height;

              if (
                newBox.width < minWidth ||
                newBox.height < minHeight ||
                newBox.width > maxWidth ||
                newBox.height > maxHeight
              ) {
                return oldBox;
              }
              return newBox;
            }}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            rotationSnapTolerance={5}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default SceneCanvas; 