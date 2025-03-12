export interface ApiError {
  type: string;
  title: string;
  status?: number;
  detail: string;
  instance?: string;
}

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface GenerationOptions {
  model: 'STABLE_DIFFUSION' | 'STABLE_DIFFUSION_XL' | 'KANDINSKY';
  style: 'PIXEL_ART' | 'COMIC_BOOK' | 'REALISTIC' | 'CARTOON';
  negativePrompt?: string;
  guidanceScale?: number;
  steps?: number;
} 