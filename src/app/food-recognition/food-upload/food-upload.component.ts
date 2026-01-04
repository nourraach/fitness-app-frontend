import { Component, Output, EventEmitter, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodRecognitionService } from '../../services/food-recognition.service';
import { ImageCompressionService } from '../../services/image-compression.service';

@Component({
  selector: 'app-food-upload',
  standalone: true,
  imports: [CommonModule],
  providers: [ImageCompressionService],
  templateUrl: './food-upload.component.html',
  styleUrls: ['./food-upload.component.css']
})
export class FoodUploadComponent {
  @Output() imageUploaded = new EventEmitter<File>();
  @Output() recognitionStarted = new EventEmitter<void>();
  @Output() recognitionResult = new EventEmitter<any>();
  @Output() recognitionError = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragOver = false;
  isUploading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;

  readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  constructor(
    private foodRecognitionService: FoodRecognitionService,
    private imageCompressionService: ImageCompressionService
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  private async handleFileSelection(file: File): Promise<void> {
    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      this.recognitionError.emit('Format de fichier non supporté. Utilisez JPG, PNG ou GIF.');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.recognitionError.emit('Le fichier est trop volumineux. Taille maximale : 10MB.');
      return;
    }

    try {
      // Compress image if needed
      const processedFile = await this.compressImageIfNeeded(file);
      
      this.selectedFile = processedFile;
      this.createPreview(processedFile);
      this.imageUploaded.emit(processedFile);
      
    } catch (error) {
      console.error('Error processing image:', error);
      this.recognitionError.emit('Erreur lors du traitement de l\'image.');
    }
  }

  private async compressImageIfNeeded(file: File): Promise<File> {
    // Compress if file is larger than 2MB
    if (file.size > 2 * 1024 * 1024) {
      return await this.imageCompressionService.compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      });
    }
    return file;
  }

  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async recognizeFood(): Promise<void> {
    if (!this.selectedFile) {
      this.recognitionError.emit('Aucune image sélectionnée.');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.recognitionStarted.emit();

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        this.uploadProgress += 10;
        if (this.uploadProgress >= 90) {
          clearInterval(progressInterval);
        }
      }, 200);

      const result = await this.foodRecognitionService.recognizeFood(this.selectedFile).toPromise();
      
      clearInterval(progressInterval);
      this.uploadProgress = 100;
      
      setTimeout(() => {
        this.isUploading = false;
        this.recognitionResult.emit(result);
      }, 500);

    } catch (error) {
      console.error('Error recognizing food:', error);
      this.isUploading = false;
      this.uploadProgress = 0;
      this.recognitionError.emit('Erreur lors de la reconnaissance. Veuillez réessayer.');
    }
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    
    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  getFileSizeText(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  retryRecognition(): void {
    if (this.selectedFile) {
      this.recognizeFood();
    }
  }
}