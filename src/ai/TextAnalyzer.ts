import { SentimentAnalyzer } from './SentimentAnalyzer';
import { ConceptExtractor } from './ConceptExtractor';
import { ComplexityAnalyzer } from './ComplexityAnalyzer';
import type {
  AnalysisResult,
  SentimentAnalysis,
  Concept,
  ComplexityAnalysis,
  ScalingStrategy,
  ScalingType
} from '../types';
import { SCALING_THRESHOLDS } from '../types';

export class TextAnalyzer {
  private sentimentAnalyzer: SentimentAnalyzer;
  private conceptExtractor: ConceptExtractor;
  private complexityAnalyzer: ComplexityAnalyzer;
  private analysisCache = new Map<string, AnalysisResult>();
  private debounceTimeout: number | null = null;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.conceptExtractor = new ConceptExtractor();
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }

  async analyze(text: string, useCache = true): Promise<AnalysisResult> {
    const textHash = this.hashText(text);
    
    // Check cache first
    if (useCache && this.analysisCache.has(textHash)) {
      console.log('📋 Using cached analysis result');
      return this.analysisCache.get(textHash)!;
    }

    console.log('🧠 Starting comprehensive text analysis...');
    const startTime = Date.now();

    try {
      // Parallel analysis of different components
      const [
        words,
        emojiData,
        sentiment,
        concepts,
        complexity
      ] = await Promise.all([
        Promise.resolve(this.tokenizeText(text)),
        Promise.resolve(this.sentimentAnalyzer.extractEmojiData(text)),
        Promise.resolve(this.analyzeSentiment(text)),
        Promise.resolve(this.extractConcepts(text)),
        Promise.resolve(this.analyzeComplexity(text))
      ]);

      // Build semantic graph from concepts
      const semanticGraph = this.conceptExtractor.buildSemanticGraph(concepts);
      
      // Calculate emoji influence
      const emojiInfluence = this.sentimentAnalyzer.calculateEmojiInfluence(emojiData);
      
      // Determine scaling strategy based on word count and complexity
      const scalingStrategy = this.determineScalingStrategy(words.length, complexity, sentiment);
      
      // Create final analysis result
      const result: AnalysisResult = {
        words,
        sentiment,
        concepts,
        semanticGraph,
        complexity,
        scalingStrategy,
        emojis: emojiData,
        emojiInfluence,
        timestamp: Date.now()
      };

      // Cache the result
      if (useCache) {
        this.analysisCache.set(textHash, result);
        this.cleanupCache(); // Remove old entries
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Text analysis completed in ${processingTime}ms`);
      console.log(`📊 Analysis summary:`, {
        wordCount: words.length,
        conceptCount: concepts.length,
        dominantEmotion: sentiment.dominant.emotion,
        complexity: complexity.overallComplexity.toFixed(2),
        scalingStrategy: scalingStrategy.type
      });

      return result;

    } catch (error) {
      console.error('💥 Text analysis failed:', error);
      throw new Error(`Text analysis failed: ${error}`);
    }
  }

  // Debounced analysis for real-time text input
  async analyzeDebounced(text: string, delay = 500): Promise<Promise<AnalysisResult>> {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (this.debounceTimeout) {
        window.clearTimeout(this.debounceTimeout);
      }

      // Set new timeout
      this.debounceTimeout = window.setTimeout(async () => {
        try {
          const result = await this.analyze(text);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  private tokenizeText(text: string): string[] {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private analyzeSentiment(text: string): SentimentAnalysis {
    const emojiData = this.sentimentAnalyzer.extractEmojiData(text);
    const emojiInfluence = this.sentimentAnalyzer.calculateEmojiInfluence(emojiData);
    
    return this.sentimentAnalyzer.analyze(text, emojiInfluence);
  }

  private extractConcepts(text: string): Concept[] {
    return this.conceptExtractor.extract(text);
  }

  private analyzeComplexity(text: string): ComplexityAnalysis {
    return this.complexityAnalyzer.analyze(text);
  }

  private determineScalingStrategy(
    wordCount: number, 
    complexity: ComplexityAnalysis, 
    sentiment: SentimentAnalysis
  ): ScalingStrategy {
    // Find appropriate threshold based on word count
    let threshold: any = SCALING_THRESHOLDS.MICRO_TINY;
    
    for (const [, config] of Object.entries(SCALING_THRESHOLDS)) {
      if (wordCount >= config.min && wordCount <= config.max) {
        threshold = config;
        break;
      }
    }

    // Calculate base node count using the exact formula from documentation
    const baseNodeCount = this.calculateBaseNodeCount(
      wordCount, 
      complexity, 
      sentiment.intensity, 
      threshold.strategy
    );

    // Estimate particle count based on node count
    const particleCount = this.calculateParticleCount(baseNodeCount, threshold.strategy);

    // Calculate compression level (how much the original text is compressed)
    const compressionLevel = this.calculateCompressionLevel(wordCount, baseNodeCount);

    return {
      type: threshold.strategy,
      multiplier: threshold.multiplier,
      nodeCount: baseNodeCount,
      particleCount,
      compressionLevel
    };
  }

  private calculateBaseNodeCount(
    wordCount: number,
    complexity: ComplexityAnalysis,
    emotionIntensity: number,
    strategy: ScalingType
  ): number {
    // EXACT MATHEMATICAL FORMULA from documentation
    // N = log₂(W + 1) × 8 × ComplexityBonus × EmotionalBonus × StrategyMultiplier
    
    // Step 1: Logarithmic base scaling
    const baseNodes = Math.log2(wordCount + 1) * 8;
    
    // Step 2: Complexity amplification (0-1 range input)
    const complexityBonus = 1 + (complexity.overallComplexity * 1.5);
    
    // Step 3: Emotional intensity multiplier (0-1 range input)
    const emotionalBonus = 0.5 + (emotionIntensity * 1.5);
    
    // Step 4: Strategy multiplier lookup (16-tier system)
    const strategyMultipliers = {
      // Micro tier strategies (1-15 words)
      'micro_boost': 3.0,
      'micro_enhance': 2.2, 
      'micro_standard': 1.8,
      
      // Small tier strategies (16-100 words)
      'small_plus': 1.5,
      'small_standard': 1.2,
      'small_compress': 1.0,
      
      // Medium tier strategies (101-500 words)
      'medium_standard': 0.95,
      'medium_compress': 0.85,
      'medium_max': 0.75,
      
      // Large tier strategies (501-2000 words)
      'large_standard': 0.7,
      'large_compress': 0.6,
      'large_heavy': 0.5,
      
      // Massive tier strategies (2001-7000 words)
      'massive_standard': 0.45,
      'massive_compress': 0.4,
      'massive_max': 0.35,
      
      // Epic tier strategies (7001-12500 words)
      'epic_standard': 0.3,
      'epic_maximum': 0.25
    };
    
    const strategyMultiplier = strategyMultipliers[strategy] || 1.0;
    
    // Step 5: Final calculation with bounds (updated for 16-tier system)
    const rawNodeCount = baseNodes * complexityBonus * emotionalBonus * strategyMultiplier;
    const finalNodeCount = Math.floor(Math.max(8, Math.min(700, rawNodeCount)));
    
    console.log(`🔢 Node calculation: ${wordCount} words → ${finalNodeCount} nodes`, {
      baseNodes: baseNodes.toFixed(1),
      complexityBonus: complexityBonus.toFixed(2),
      emotionalBonus: emotionalBonus.toFixed(2),
      strategyMultiplier,
      strategy
    });

    return finalNodeCount;
  }

  private calculateParticleCount(nodeCount: number, strategy: ScalingType): number {
    // Tiered particle-per-node system for optimal performance
    let particlesPerNode: number;
    
    if (nodeCount <= 100) {
      particlesPerNode = 75;      // 1-100 nodes: High detail
    } else if (nodeCount <= 300) {
      particlesPerNode = 60;      // 101-300 nodes: Good detail
    } else if (nodeCount <= 500) {
      particlesPerNode = 50;      // 301-500 nodes: Balanced
    } else {
      particlesPerNode = 40;      // 501-700 nodes: Performance optimized
    }
    
    const baseParticleCount = nodeCount * particlesPerNode;
    
    // Apply strategy-based adjustments
    const strategyParticleMultipliers = {
      // Micro strategies - Rich particle effects
      'micro_boost': 1.2, 'micro_enhance': 1.1, 'micro_standard': 1.0,
      
      // Small strategies - Standard effects  
      'small_plus': 1.0, 'small_standard': 1.0, 'small_compress': 0.95,
      
      // Medium strategies - Balanced
      'medium_standard': 0.9, 'medium_compress': 0.85, 'medium_max': 0.8,
      
      // Large strategies - Performance conscious
      'large_standard': 0.75, 'large_compress': 0.7, 'large_heavy': 0.65,
      
      // Massive strategies - Optimized
      'massive_standard': 0.6, 'massive_compress': 0.55, 'massive_max': 0.5,
      
      // Epic strategies - Maximum performance
      'epic_standard': 0.45, 'epic_maximum': 0.4
    };

    const strategyMultiplier = strategyParticleMultipliers[strategy] || 1.0;
    const finalParticleCount = Math.floor(baseParticleCount * strategyMultiplier);
    
    // Enforce performance limits (maximum 35,000 particles)
    return Math.min(35000, Math.max(500, finalParticleCount));
  }

  private calculateCompressionLevel(originalWordCount: number, finalNodeCount: number): number {
    // Compression level indicates how much the original content is condensed
    // 0 = no compression, 1 = maximum compression
    
    if (originalWordCount <= 50) {
      // Small texts are enhanced, not compressed
      return Math.max(0, (50 - finalNodeCount) / 50);
    }
    
    // For larger texts, calculate compression ratio
    const idealNodeCount = Math.min(100, originalWordCount * 0.5); // Ideal is roughly 50% of word count
    const compressionRatio = 1 - (finalNodeCount / idealNodeCount);
    
    return Math.max(0, Math.min(1, compressionRatio));
  }

  private hashText(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private cleanupCache(): void {
    // Remove cache entries older than 10 minutes
    const maxAge = 10 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;
    
    for (const [key, result] of this.analysisCache.entries()) {
      if (result.timestamp < cutoffTime) {
        this.analysisCache.delete(key);
      }
    }

    // Limit cache size to 100 entries
    if (this.analysisCache.size > 100) {
      const entries = Array.from(this.analysisCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      // Keep only the 50 most recent entries
      this.analysisCache.clear();
      entries.slice(0, 50).forEach(([key, value]) => {
        this.analysisCache.set(key, value);
      });
    }
  }

  // Helper methods for accessing analysis components
  getSentimentAnalyzer(): SentimentAnalyzer {
    return this.sentimentAnalyzer;
  }

  getConceptExtractor(): ConceptExtractor {
    return this.conceptExtractor;
  }

  getComplexityAnalyzer(): ComplexityAnalyzer {
    return this.complexityAnalyzer;
  }

  // Clear analysis cache
  clearCache(): void {
    this.analysisCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
    if (this.analysisCache.size === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = Array.from(this.analysisCache.values()).map(result => result.timestamp);
    
    return {
      size: this.analysisCache.size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}