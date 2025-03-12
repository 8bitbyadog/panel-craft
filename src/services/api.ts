import axios, { AxiosError } from 'axios';
import { Result, ApiError, GenerationOptions } from '../types/api';

// Use environment variable with localStorage as fallback
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_KEY || localStorage.getItem('huggingfaceApiKey') || '';

// Validate API token
function validateApiToken(token: string = HUGGINGFACE_API_TOKEN): boolean {
  return Boolean(token && token.length > 32);
}

// Available models for image generation
const IMAGE_MODELS = {
  STABLE_DIFFUSION: 'stabilityai/stable-diffusion-2',
  STABLE_DIFFUSION_XL: 'stabilityai/stable-diffusion-xl-base-1.0',
  KANDINSKY: 'kandinsky-community/kandinsky-2-2',
} as const;

// Style presets for different element types
const STYLE_PRESETS = {
  PIXEL_ART: 'isometric pixel art, 16-bit style, clean pixel edges',
  COMIC_BOOK: 'comic book art style, cel shaded, clean lineart',
  REALISTIC: 'realistic 3D render, clean edges, high detail',
  CARTOON: 'cartoon style, vibrant colors, clean outlines',
} as const;

// Default negative prompts for different element types
const NEGATIVE_PROMPTS = {
  character: 'blurry, low quality, text, watermark, signature, extra limbs, deformed, distorted, disfigured, bad anatomy, multiple characters, duplicate, background, environment, scene',
  prop: 'blurry, low quality, text, watermark, signature, deformed, distorted, disfigured, bad anatomy, multiple objects, duplicate, background details, scene elements',
  background: 'blurry, low quality, text, watermark, signature, deformed, distorted, characters, foreground objects'
} as const;

// Create API error
function createApiError(
  title: string,
  detail: string,
  status?: number,
  type: string = 'https://api.example.com/errors/generation-failed'
): ApiError {
  return {
    type,
    title,
    status,
    detail,
    instance: '/generate-element'
  };
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate transparent background elements using selected model
export async function generateElement(
  prompt: string, 
  elementType: 'character' | 'prop' | 'background' = 'character',
  options: Partial<GenerationOptions> = {}
): Promise<Result<string>> {
  // Validate API token
  if (!validateApiToken()) {
    console.error('No valid API token found:', HUGGINGFACE_API_TOKEN);
    return {
      success: false,
      error: createApiError(
        'Missing API Token',
        'Please set your Hugging Face API token in the settings or .env file.',
        401
      )
    };
  }

  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const model = options.model || 'STABLE_DIFFUSION';
      const style = options.style || 'COMIC_BOOK';
      
      const enhancedPrompt = buildPrompt(prompt.trim(), elementType, STYLE_PRESETS[style]);
      
      console.log('API Request:', { 
        url: `https://api-inference.huggingface.co/models/${IMAGE_MODELS[model]}`,
        prompt: enhancedPrompt,
        model: IMAGE_MODELS[model],
        options,
        tokenLength: HUGGINGFACE_API_TOKEN.length
      });
      
      const response = await axios({
        method: 'post',
        url: `https://api-inference.huggingface.co/models/${IMAGE_MODELS[model]}`,
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: options.negativePrompt || NEGATIVE_PROMPTS[elementType],
            guidance_scale: options.guidanceScale || 8.5,
            num_inference_steps: options.steps || 40,
            width: 768,
            height: 768,
            seed: Math.floor(Math.random() * 2147483647)
          }
        },
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (!response.data) {
        throw new Error('No data received from API');
      }

      const base64 = arrayBufferToBase64(response.data);
      return {
        success: true,
        data: `data:image/jpeg;base64,${base64}`
      };
    } catch (error) {
      console.error('Detailed error:', {
        error,
        isAxiosError: axios.isAxiosError(error),
        response: error?.response,
        message: error?.message,
        stack: error?.stack
      });
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Check if it's a GPU memory error
        if (axiosError.response?.status === 500) {
          try {
            const decoder = new TextDecoder();
            const errorMessage = decoder.decode(axiosError.response.data as ArrayBuffer);
            const errorJson = JSON.parse(errorMessage);
            
            if (errorJson.warnings?.some((warning: string) => warning.includes('CUDA out of memory'))) {
              console.log(`Attempt ${retries + 1}/${MAX_RETRIES}: GPU memory error, retrying after delay...`);
              await delay(RETRY_DELAY);
              retries++;
              continue;
            }
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
        }
        
        // Handle other errors
        return {
          success: false,
          error: createApiError(
            'Generation Failed',
            'The image generation service is currently busy. Please try again in a few moments.',
            axiosError.response?.status || 500
          )
        };
      }
      
      return {
        success: false,
        error: createApiError(
          'Unknown Error',
          'An unexpected error occurred while generating the image. Please try again.',
          500
        )
      };
    }
  }
  
  // If we've exhausted all retries
  return {
    success: false,
    error: createApiError(
      'Service Unavailable',
      'The image generation service is experiencing high load. Please try again later.',
      503
    )
  };
}

// Script generation using GPT2
export async function generateComicScript(
  prompt: string, 
  panelCount: number = 4,
  characters: string[] = [],
  tone: string = 'adventure'
): Promise<string> {
  try {
    validateApiToken();
    
    const fullPrompt = buildScriptPrompt(prompt, panelCount, characters, tone);
    console.log('Generating script:', { prompt: fullPrompt });

    const response = await axios({
      method: 'post',
      url: 'https://api-inference.huggingface.co/models/gpt2',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: fullPrompt,
        parameters: {
          max_length: panelCount * 50, // Adjust length based on panel count
          num_return_sequences: 1,
          temperature: 0.8,
          top_p: 0.9,
          repetition_penalty: 1.2
        }
      },
      timeout: 15000 // 15 second timeout
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from the script generation API');
    }

    return formatScriptResponse(response.data[0]?.generated_text || '', panelCount);
  } catch (error: any) {
    console.error('Error generating script:', {
      message: error.message,
      response: error.response?.data,
      prompt,
      panelCount,
      characters,
      tone
    });
    
    if (error.response?.status === 401) {
      throw new Error('Invalid API token. Please check your Hugging Face API key in settings.');
    } else if (error.response?.status === 503) {
      throw new Error('The script generation service is currently busy. Please try again in a few moments.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('The request timed out. The service might be experiencing high load.');
    }
    
    throw new Error('Failed to generate script. Please try again.');
  }
}

// Helper function to build optimized prompts for elements
function buildPrompt(
  basePrompt: string, 
  elementType: 'character' | 'prop' | 'background', 
  style: string
): string {
  const commonPrompt = `${style}, ${basePrompt}, masterpiece, best quality`;
  
  const typeSpecificPrompts = {
    character: ', single character centered, full body pose, clean edges, solid white background, studio lighting, professional photography, transparent background ready',
    prop: ', single object centered, clean edges, solid white background, studio lighting, professional photography, transparent background ready',
    background: ', detailed environment, establishing shot, no characters, full scene'
  };
  
  return `${commonPrompt}${typeSpecificPrompts[elementType]}`;
}

// Helper function to build script prompts
function buildScriptPrompt(
  basePrompt: string,
  panelCount: number,
  characters: string[],
  tone: string
): string {
  let prompt = `Write a ${panelCount}-panel comic script about ${basePrompt}.`;
  
  if (characters.length > 0) {
    prompt += ` Include these characters: ${characters.join(', ')}.`;
  }
  
  prompt += ` The tone should be ${tone}.`;
  prompt += ' Each panel should be a clear, descriptive sentence.';
  
  return prompt;
}

// Helper function to format script response
function formatScriptResponse(text: string, panelCount: number): string {
  return text
    .split(/[.!?]/) // Split on sentence endings
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .slice(0, panelCount)
    .map((sentence, index) => `Panel ${index + 1}: ${sentence}`)
    .join('\n\n');
} 