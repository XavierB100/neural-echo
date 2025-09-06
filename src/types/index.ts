import * as THREE from 'three';

// Core text analysis interfaces
export interface AnalysisResult {
  words: string[];
  sentiment: SentimentAnalysis;
  concepts: Concept[];
  semanticGraph: SemanticGraph;
  complexity: ComplexityAnalysis;
  scalingStrategy: ScalingStrategy;
  emojis: EmojiData[];
  emojiInfluence: number;
  timestamp: number;
}

export interface SentimentAnalysis {
  scores: EmotionScores;
  dominant: DominantEmotion;
  intensity: number;
  valence: number;  // -1 to +1
  arousal: number;  // 0 to 1
}

export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  anticipation: number;
}

export interface DominantEmotion {
  emotion: keyof EmotionScores;
  score: number;
  confidence: number;
}

export interface Concept {
  word: string;
  category: ConceptCategory;
  relevance: number;     // 0-1 normalized score
  frequency: number;
  position: number[];    // Positions in text
  connections: string[]; // Related concepts
}

export type ConceptCategory = 'emotion' | 'time' | 'people' | 'places' | 'actions' | 'abstract' | 'objects';

export interface SemanticGraph {
  nodes: Map<string, ConceptNode>;
  edges: Map<string, SemanticEdge>;
  clusters: ConceptCluster[];
}

export interface ConceptNode {
  id: string;
  concept: Concept;
  importance: number;
  connections: string[];
}

export interface SemanticEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  relationship: RelationshipType;
}

export type RelationshipType = 'semantic' | 'emotional' | 'temporal' | 'contextual';

export interface ConceptCluster {
  id: string;
  concepts: string[];
  centroid: Concept;
  coherence: number;
}

export interface ComplexityAnalysis {
  overallComplexity: number;
  vocabularyDiversity: number;
  sentenceComplexity: number;
  conceptDensity: number;
  emotionalComplexity: number;
}

export interface EmojiData {
  emoji: string;
  position: number;
  emotion: keyof EmotionScores;
  intensity: number;
}

// Scaling system interfaces
export interface ScalingStrategy {
  type: ScalingType;
  multiplier: number;
  nodeCount: number;
  particleCount: number;
  compressionLevel: number;
}

export type ScalingType = 
  // Micro tier strategies
  | 'micro_boost' | 'micro_enhance' | 'micro_standard'
  // Small tier strategies  
  | 'small_plus' | 'small_standard' | 'small_compress'
  // Medium tier strategies
  | 'medium_standard' | 'medium_compress' | 'medium_max'
  // Large tier strategies
  | 'large_standard' | 'large_compress' | 'large_heavy'
  // Massive tier strategies
  | 'massive_standard' | 'massive_compress' | 'massive_max'
  // Epic tier strategies
  | 'epic_standard' | 'epic_maximum';

export interface ScaledVisualization {
  nodes: Node[];
  connections: Connection[];
  particles: ParticleData[];
  scalingInfo: ScalingInfo;
  performanceProfile: PerformanceProfile;
}

export interface ScalingInfo {
  originalWordCount: number;
  finalNodeCount: number;
  compressionRatio: number;
  strategy: ScalingType;
  processingTime: number;
}

export interface NodeDistribution {
  primary: number;    // 30% - Most important
  secondary: number;  // 40% - Supporting
  tertiary: number;   // 20% - Background
  environmental: number; // 10% - Atmosphere
}

export interface EnhancedVisualization extends ScaledVisualization {
  syntheticNodes: Node[];
  impliedConcepts: Concept[];
  emotionalSatellites: Node[];
  temporalNodes: Node[];
}

// Visualization system interfaces
export interface Node {
  id: string;
  position: THREE.Vector3;
  activation: number;
  targetActivation: number;
  color: THREE.Color;
  size: number;
  type: NodeType;
  connections: string[];
  synthetic: boolean;
  lifetime: number;
  importance: number;
  data: NodeData;
}

export type NodeType = 'emotion' | 'concept' | 'synthetic' | 'temporal' | 'social';

export interface NodeData {
  word: string;
  concept?: Concept;
  emotion?: keyof EmotionScores;
  relevance: number;
  layer: number;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: ConnectionType;
  active: boolean;
  flow: number;
  color: THREE.Color;
}

export type ConnectionType = 'semantic' | 'emotional' | 'synthetic' | 'temporal';

export interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  behavior: ParticleBehavior;
  sourceNode?: string;
}

export type ParticleBehavior = 'flow' | 'orbit' | 'drift' | 'attract' | 'repel';

// Theme system interfaces
export interface ColorPalette {
  background: string[];
  nodes: {
    emotion: string;
    concept: string;
    synthetic: string;
  };
  connections: string;
  particles: string[];
}

export interface ThemeConfig {
  name: string;
  colorPalette: ColorPalette;
  effects: EffectConfig;
  materials: MaterialConfig;
}

export interface EffectConfig {
  glow: boolean;
  bloom: boolean;
  particles: boolean;
  postProcessing: boolean;
}

export interface MaterialConfig {
  nodeOpacity: number;
  connectionOpacity: number;
  particleOpacity: number;
  metalness: number;
  roughness: number;
}

// Performance monitoring interfaces
export interface PerformanceProfile {
  targetFPS: number;
  qualityLevel: number;
  adaptiveSettings: AdaptiveSettings;
}

export interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  gpuMemory: number;
  nodeCount: number;
  particleCount: number;
  qualityLevel: number;
  loadTime: number;
}

export interface AdaptiveSettings {
  maxParticles: number;
  maxNodes: number;
  particleComplexity: 'low' | 'medium' | 'high';
  shadowQuality: 'disabled' | 'low' | 'medium' | 'high';
  postProcessing: boolean;
}

// GPU and rendering interfaces
export interface WebGPUCapabilities {
  supported: boolean;
  adapter?: GPUAdapter;
  device?: GPUDevice;
  features: string[];
  limits: Record<string, number>;
}

export interface GPUBufferInfo {
  name: string;
  buffer: GPUBuffer;
  size: number;
  usage: GPUBufferUsageFlags;
}

export interface ShaderModuleInfo {
  name: string;
  module: GPUShaderModule;
  code: string;
}

export interface NeuralActivity {
  totalActivation: number;
  activeNodes: string[];
  flowIntensity: number;
  emotionalState: keyof EmotionScores;
  complexity: number;
}

export interface EffectData {
  intensity: number;
  color: THREE.Color;
  patterns: EffectPattern[];
  duration: number;
}

export interface EffectPattern {
  type: 'pulse' | 'wave' | 'spiral' | 'burst';
  frequency: number;
  amplitude: number;
  phase: number;
}

// User interaction interfaces
export interface InteractionEvent {
  type: 'click' | 'hover' | 'drag' | 'zoom' | 'rotate';
  target: string;
  position: THREE.Vector2;
  timestamp: number;
}

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  rotation: THREE.Euler;
  autoExplore: boolean;
}

// System configuration
export interface NeuralEchoConfig {
  performance: PerformanceConfig;
  scaling: ScalingConfig;
  rendering: RenderingConfig;
  ai: AIConfig;
}

export interface PerformanceConfig {
  targetFPS: number;
  adaptiveQuality: boolean;
  memoryLimit: number;
  gpuMemoryLimit: number;
}

export interface ScalingConfig {
  thresholds: Record<string, { min: number; max: number; strategy: ScalingType; multiplier: number }>;
  enhancementMultiplier: number;
  compressionRatio: number;
}

export interface RenderingConfig {
  maxParticles: number;
  maxNodes: number;
  webgpuFallback: boolean;
  antialias: boolean;
  shadows: boolean;
}

export interface AIConfig {
  emotionLexiconSize: number;
  conceptExtractionThreshold: number;
  complexityWeighting: number;
  sentimentSensitivity: number;
}

// Error handling types
export interface NeuralEchoError extends Error {
  code: ErrorCode;
  component: string;
  recoverable: boolean;
  fallbackAction?: string;
}

export type ErrorCode = 
  | 'WEBGPU_NOT_SUPPORTED'
  | 'WEBGL_FALLBACK_FAILED'
  | 'CANVAS2D_FALLBACK_FAILED'
  | 'SHADER_COMPILATION_FAILED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'GPU_MEMORY_LIMIT_EXCEEDED'
  | 'TEXT_ANALYSIS_FAILED'
  | 'SCALING_CALCULATION_FAILED'
  | 'RENDERING_PIPELINE_FAILED';

// Pool management types
export interface PoolStats {
  active: number;
  inactive: number;
  total: number;
}

export interface PoolableObject {
  reset?(...args: any[]): void;
}

// Session management
export interface SessionData {
  analysisHistory: AnalysisResult[];
  preferences: UserPreferences;
  performance: PerformanceMetrics[];
  timestamp: number;
}

export interface UserPreferences {
  theme: string;
  qualityLevel: number;
  autoExplore: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
}

// Constants for mathematical formulas - Enhanced 16-Tier Scaling System
export const SCALING_THRESHOLDS = {
  // MICRO TIER (1-15 words) - High enhancement for tiny texts
  MICRO_TINY: { min: 1, max: 3, strategy: 'micro_boost' as ScalingType, multiplier: 3.0 },
  MICRO_SMALL: { min: 4, max: 8, strategy: 'micro_enhance' as ScalingType, multiplier: 2.2 },
  MICRO_MEDIUM: { min: 9, max: 15, strategy: 'micro_standard' as ScalingType, multiplier: 1.8 },

  // SMALL TIER (16-100 words) - Gradual reduction
  SMALL_LIGHT: { min: 16, max: 30, strategy: 'small_plus' as ScalingType, multiplier: 1.5 },
  SMALL_MEDIUM: { min: 31, max: 60, strategy: 'small_standard' as ScalingType, multiplier: 1.2 },
  SMALL_HEAVY: { min: 61, max: 100, strategy: 'small_compress' as ScalingType, multiplier: 1.0 },

  // MEDIUM TIER (101-500 words) - Standard processing
  MEDIUM_LIGHT: { min: 101, max: 200, strategy: 'medium_standard' as ScalingType, multiplier: 0.95 },
  MEDIUM_HEAVY: { min: 201, max: 350, strategy: 'medium_compress' as ScalingType, multiplier: 0.85 },
  MEDIUM_MAX: { min: 351, max: 500, strategy: 'medium_max' as ScalingType, multiplier: 0.75 },

  // LARGE TIER (501-2000 words) - Controlled scaling
  LARGE_LIGHT: { min: 501, max: 800, strategy: 'large_standard' as ScalingType, multiplier: 0.7 },
  LARGE_MEDIUM: { min: 801, max: 1200, strategy: 'large_compress' as ScalingType, multiplier: 0.6 },
  LARGE_HEAVY: { min: 1201, max: 2000, strategy: 'large_heavy' as ScalingType, multiplier: 0.5 },

  // MASSIVE TIER (2001-7000 words) - Literary works
  MASSIVE_LIGHT: { min: 2001, max: 3500, strategy: 'massive_standard' as ScalingType, multiplier: 0.45 },
  MASSIVE_HEAVY: { min: 3501, max: 5000, strategy: 'massive_compress' as ScalingType, multiplier: 0.4 },
  MASSIVE_MAX: { min: 5001, max: 7000, strategy: 'massive_max' as ScalingType, multiplier: 0.35 },

  // EPIC TIER (7001-12500 words) - Maximum capacity
  EPIC_STANDARD: { min: 7001, max: 10000, strategy: 'epic_standard' as ScalingType, multiplier: 0.3 },
  EPIC_MAX: { min: 10001, max: 12500, strategy: 'epic_maximum' as ScalingType, multiplier: 0.25 }
} as const;

export const PERFORMANCE_TARGETS = {
  desktop: {
    frameRate: { target: 60, minimum: 45, critical: 30 },
    memoryUsage: { target: 200, maximum: 400, critical: 800 }, // MB
    processingTime: { aiAnalysis: 50, sceneUpdate: 16, userResponse: 100 } // ms
  },
  mobile: {
    frameRate: { target: 30, minimum: 24, critical: 15 },
    memoryUsage: { target: 100, maximum: 200, critical: 400 }, // MB
    batteryImpact: { cpuUsage: 30, gpuUsage: 40, thermalLimit: 70 } // percentages/celsius
  }
} as const;

// Performance profiling interface
export interface PerformanceProfile {
  expectedFPS: number;
  memoryUsage: number; // MB
  gpuLoad: number; // 0-1
}