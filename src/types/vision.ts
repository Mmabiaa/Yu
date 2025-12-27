// Vision Types and Models

export interface VisionAnalysisRequest {
  imageFile: File;
  task?: 'analyze' | 'ocr' | 'objects' | 'faces' | 'scene' | 'vqa';
  options?: AnalysisOptions;
}

export interface AnalysisOptions {
  includeObjects?: boolean;
  includeFaces?: boolean;
  includeText?: boolean;
  includeScene?: boolean;
  language?: string;
  threshold?: number;
}

export interface VisionAnalysisResponse {
  analysis: string;
  objects?: DetectedObject[];
  faces?: DetectedFace[];
  text?: ExtractedText[];
  scene?: SceneClassification;
  confidence: number;
  processingTime: number;
  imageMetadata: ImageMetadata;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: ObjectAttribute[];
}

export interface ObjectAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface DetectedFace {
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: FaceAttribute[];
  landmarks?: FaceLandmark[];
}

export interface FaceAttribute {
  name: 'age' | 'gender' | 'emotion' | 'glasses' | 'beard';
  value: string;
  confidence: number;
}

export interface FaceLandmark {
  type: string;
  x: number;
  y: number;
}

export interface ExtractedText {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language?: string;
}

export interface SceneClassification {
  category: string;
  confidence: number;
  subcategories?: SceneSubcategory[];
}

export interface SceneSubcategory {
  name: string;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  colorSpace?: string;
  hasAlpha?: boolean;
}

export interface OCRRequest {
  imageFile: File;
  language?: string;
  enableStructure?: boolean;
}

export interface OCRResponse {
  text: string;
  confidence: number;
  language: string;
  blocks?: TextBlock[];
  processingTime: number;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  lines?: TextLine[];
}

export interface TextLine {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words?: TextWord[];
}

export interface TextWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface VQARequest {
  imageFile: File;
  question: string;
  context?: string;
  language?: string;
}

export interface VQAResponse {
  answer: string;
  confidence: number;
  reasoning?: string;
  alternatives?: VQAAlternative[];
  processingTime: number;
}

export interface VQAAlternative {
  answer: string;
  confidence: number;
}

export interface ImageComparisonRequest {
  image1: File;
  image2: File;
  method?: 'similarity' | 'difference' | 'features';
}

export interface ImageComparisonResponse {
  similarity: number;
  differences?: ImageDifference[];
  features?: ComparisonFeature[];
  processingTime: number;
}

export interface ImageDifference {
  type: string;
  description: string;
  boundingBox?: BoundingBox;
  confidence: number;
}

export interface ComparisonFeature {
  name: string;
  similarity: number;
  description: string;
}

export interface DescriptionRequest {
  imageFile: File;
  style?: 'detailed' | 'brief' | 'creative' | 'technical';
  focus?: 'objects' | 'scene' | 'people' | 'text' | 'all';
  language?: string;
}

export interface DescriptionResponse {
  description: string;
  style: string;
  confidence: number;
  keywords?: string[];
  processingTime: number;
}

export interface ImageUploadRequest {
  imageFile: File;
  metadata?: Partial<ImageMetadata>;
  tags?: string[];
}

export interface ImageUploadResponse {
  imageId: string;
  url: string;
  thumbnailUrl?: string;
  metadata: ImageMetadata;
  uploadedAt: Date;
}

export interface ImageList {
  images: ImageItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  metadata: ImageMetadata;
  tags?: string[];
  uploadedAt: Date;
  lastAnalyzed?: Date;
}

export interface ImageDetails extends ImageItem {
  analysisHistory?: VisionAnalysisResponse[];
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}