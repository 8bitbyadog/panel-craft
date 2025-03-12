/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUGGINGFACE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Buffer type augmentation for TypeScript
declare module 'buffer' {
  interface Buffer extends Uint8Array {
    write(string: string, encoding?: BufferEncoding): number;
    toString(encoding?: BufferEncoding, start?: number, end?: number): string;
  }
  
  interface BufferConstructor {
    from(arrayBuffer: ArrayBuffer): Buffer;
    from(data: number[]): Buffer;
    from(data: Uint8Array): Buffer;
    from(str: string, encoding?: BufferEncoding): Buffer;
    isBuffer(obj: any): obj is Buffer;
  }
  
  const Buffer: BufferConstructor;
  export { Buffer };
}