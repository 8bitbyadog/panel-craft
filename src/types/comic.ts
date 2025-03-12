export interface Element {
  id: string;
  type: 'character' | 'prop' | 'background';
  name: string;
  imageUrl: string;
  position: {
    x: number;
    y: number;
    z: number; // For layering
  };
  size: {
    width: number;
    height: number;
  };
  rotation?: number;
  opacity?: number;
  isSelected?: boolean;
}

export interface Panel {
  id: string;
  title: string;
  elements: Element[];
  background?: Element;
}

export interface Comic {
  id: string;
  title: string;
  panels: Panel[];
} 