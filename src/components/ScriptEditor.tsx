import React, { useState, useRef } from 'react';
import { generateElement } from '../services/api';

interface BubbleStyle {
  type: 'speech' | 'thought' | 'shout' | 'whisper';
  color: string;
  borderRadius: string;
}

interface ScriptBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
  bubbleStyle?: BubbleStyle;
}

interface ScriptEditorProps {
  onGenerateElement: (imageUrl: string) => void;
}

interface BubbleStyleOption {
  type: BubbleStyle['type'];
  icon: string;
  borderRadius: string;
}

const BubbleStyleOptions: BubbleStyleOption[] = [
  { type: 'speech', icon: '💭', borderRadius: '20px' },
  { type: 'thought', icon: '💭', borderRadius: '50%' },
  { type: 'shout', icon: '📢', borderRadius: '0px' },
  { type: 'whisper', icon: '🤫', borderRadius: '10px' }
];

const ScriptEditor: React.FC<ScriptEditorProps> = ({ onGenerateElement }) => {
  const [blocks, setBlocks] = useState<ScriptBlock[]>([
    { id: '1', type: 'text', content: 'Start writing your script here...' }
  ]);
  const [selectedText, setSelectedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBubbleMenu, setActiveBubbleMenu] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleGenerateFromSelection = async (blockId: string) => {
    if (!selectedText) return;
    setIsGenerating(true);

    try {
      const imageUrl = await generateElement(selectedText, 'character');
      
      // Find the block and its index
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      const block = blocks[blockIndex];
      
      // Get the selection positions within the block
      const selection = window.getSelection();
      if (!selection || !selection.anchorNode || !selection.focusNode) return;
      
      const text = block.content;
      const start = Math.min(selection.anchorOffset, selection.focusOffset);
      const end = Math.max(selection.anchorOffset, selection.focusOffset);
      
      // Split the block into three: text before, image, text after
      const newBlocks: ScriptBlock[] = [
        ...blocks.slice(0, blockIndex),
        {
          id: block.id + '-1',
          type: 'text' as const,
          content: text.slice(0, start).trim()
        },
        {
          id: block.id + '-image',
          type: 'image' as const,
          content: selectedText,
          imageUrl
        },
        {
          id: block.id + '-2',
          type: 'text' as const,
          content: text.slice(end).trim()
        },
        ...blocks.slice(blockIndex + 1)
      ].filter(b => b.content || b.type === 'image');

      setBlocks(newBlocks);
      onGenerateElement(imageUrl);
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
      setSelectedText('');
    }
  };

  const handleBubbleStyle = (blockId: string, style: BubbleStyleOption) => {
    const newBlocks: ScriptBlock[] = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          bubbleStyle: {
            type: style.type,
            color: '#ffffff',
            borderRadius: style.borderRadius
          }
        };
      }
      return block;
    });
    
    setBlocks(newBlocks);
    setActiveBubbleMenu(null);
  };

  return (
    <div className="script-editor">
      <div 
        className="editor-content" 
        ref={editorRef}
        onMouseUp={handleTextSelection}
      >
        {blocks.map(block => (
          <div key={block.id} className="block-container">
            {block.type === 'text' ? (
              <div className="text-block">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className={`editable-text ${block.bubbleStyle ? 'bubble' : ''}`}
                  style={block.bubbleStyle ? {
                    backgroundColor: block.bubbleStyle.color,
                    borderRadius: block.bubbleStyle.borderRadius,
                    padding: '10px',
                    margin: '5px 0'
                  } : undefined}
                  onBlur={(e) => {
                    const newBlocks = blocks.map(b =>
                      b.id === block.id ? { ...b, content: e.target.textContent || '' } : b
                    );
                    setBlocks(newBlocks);
                  }}
                >
                  {block.content}
                </div>
                {selectedText && (
                  <div className="selection-tools">
                    <button
                      onClick={() => handleGenerateFromSelection(block.id)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generating...' : '🎨 Generate'}
                    </button>
                    <button
                      onClick={() => setActiveBubbleMenu(block.id)}
                    >
                      💭 Bubble Style
                    </button>
                  </div>
                )}
                {activeBubbleMenu === block.id && (
                  <div className="bubble-style-menu">
                    {BubbleStyleOptions.map(style => (
                      <button
                        key={style.type}
                        onClick={() => handleBubbleStyle(block.id, style)}
                        className="bubble-style-option"
                      >
                        {style.icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="image-block">
                <img src={block.imageUrl} alt={block.content} />
                <div className="image-caption">{block.content}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptEditor; 