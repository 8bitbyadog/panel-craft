import axios, { AxiosError } from 'axios';
import { Result, ApiError, GenerationOptions } from '../types/api';

// Use environment variable with localStorage as fallback
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_KEY || localStorage.getItem('huggingfaceApiKey') || '';

// Available models for image generation
const IMAGE_MODELS = {
  STABLE_DIFFUSION: 'stabilityai/stable-diffusion-2',
  STABLE_DIFFUSION_XL: 'stabilityai/stable-diffusion-xl-base-1.0',
  KANDINSKY: 'kandinsky-community/kandinsky-2-2',
} as const;

// Style presets for different element types
const STYLE_PRESETS = {
  PIXEL_ART: 'isometric pixel art, 16-bit style',
  COMIC_BOOK: 'comic book art style, cel shaded',
  REALISTIC: 'realistic 3D render, high detail',
  CARTOON: 'cartoon style, vibrant colors',
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

// Generate transparent background elements using selected model
export async function generateElement(
  prompt: string, 
  elementType: 'character' | 'prop' | 'background' = 'character',
  options: Partial<GenerationOptions> = {}
): Promise<Result<string>> {
  // Validate API token
  if (!HUGGINGFACE_API_TOKEN) {
    return {
      success: false,
      error: createApiError(
        'Missing API Token',
        'Please set your Hugging Face API token in the settings or .env file.',
        401
      )
    };
  }

  try {
    const model = options.model || 'STABLE_DIFFUSION';
    const style = options.style || 'COMIC_BOOK';
    const enhancedPrompt = buildPrompt(prompt, elementType, STYLE_PRESETS[style]);
    
    console.log('Generating element:', { 
      prompt: enhancedPrompt, 
      model: IMAGE_MODELS[model],
      options 
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
          negative_prompt: options.negativePrompt || 'blurry, low quality, text, watermark, signature, extra limbs, deformed',
          guidance_scale: options.guidanceScale || 7.5,
          num_inference_steps: options.steps || 50
        }
      },
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });

    if (!response.data) {
      return {
        success: false,
        error: createApiError(
          'No Data Received',
          'The image generation service did not return any data.',
          500
        )
      };
    }

    // Convert the image buffer to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return {
      success: true,
      data: `data:image/jpeg;base64,${base64Image}`
    };
  } catch (error) {
    console.error('Error generating element:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: createApiError(
            'Invalid API Token',
            'The provided Hugging Face API token is invalid. Please check your settings.',
            401
          )
        };
      }
      
      if (axiosError.response?.status === 503) {
        return {
          success: false,
          error: createApiError(
            'Service Unavailable',
            'The image generation service is currently busy. Please try again in a few moments.',
            503
          )
        };
      }
      
      if (axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          error: createApiError(
            'Request Timeout',
            'The request timed out. The service might be experiencing high load.',
            408
          )
        };
      }
      
      // Handle other API errors
      return {
        success: false,
        error: createApiError(
          'Generation Failed',
          axiosError.response?.data ? 
            Buffer.from(axiosError.response.data).toString() : 
            'An unexpected error occurred while generating the image.',
          axiosError.response?.status || 500
        )
      };
    }
    
    // Handle unknown errors
    return {
      success: false,
      error: createApiError(
        'Unknown Error',
        'An unexpected error occurred while generating the image.',
        500
      )
    };
  }
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
  const commonPrompt = `${style}, ${basePrompt}, high quality, detailed`;
  
  const typeSpecificPrompts = {
    character: ', single character centered, full body pose, clean edges, white background, no text',
    prop: ', single object centered, clean edges, white background, no text',
    background: ', detailed environment, establishing shot, no characters, no text'
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