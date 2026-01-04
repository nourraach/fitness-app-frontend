import { Injectable } from '@angular/core';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {

  constructor() { }

  async compressImage(file: File, options: CompressionOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            options.maxWidthOrHeight || 1920
          );

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          const quality = options.quality || 0.8;
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                
                // Check if compression was successful
                if (compressedFile.size <= options.maxSizeMB * 1024 * 1024) {
                  resolve(compressedFile);
                } else {
                  // Try with lower quality
                  this.compressWithLowerQuality(canvas, file, options, quality - 0.1)
                    .then(resolve)
                    .catch(reject);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(originalWidth: number, originalHeight: number, maxSize: number): { width: number; height: number } {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
      return { width: originalWidth, height: originalHeight };
    }

    const ratio = Math.min(maxSize / originalWidth, maxSize / originalHeight);
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    };
  }

  private async compressWithLowerQuality(
    canvas: HTMLCanvasElement, 
    originalFile: File, 
    options: CompressionOptions, 
    quality: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      if (quality < 0.1) {
        reject(new Error('Cannot compress image to target size'));
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], originalFile.name, {
              type: originalFile.type,
              lastModified: Date.now()
            });
            
            if (compressedFile.size <= options.maxSizeMB * 1024 * 1024) {
              resolve(compressedFile);
            } else {
              // Recursively try with even lower quality
              this.compressWithLowerQuality(canvas, originalFile, options, quality - 0.1)
                .then(resolve)
                .catch(reject);
            }
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        originalFile.type,
        quality
      );
    });
  }
}