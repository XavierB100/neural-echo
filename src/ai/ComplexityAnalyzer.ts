import type { ComplexityAnalysis } from '../types';

export class ComplexityAnalyzer {
  private commonWords: Set<string>;
  private complexWords: Set<string>;

  constructor() {
    this.commonWords = new Set();
    this.complexWords = new Set();
    this.initializeWordLists();
  }

  private initializeWordLists(): void {
    // Most common 1000 English words (simplified list)
    const common = [
      'the', 'a', 'to', 'and', 'of', 'in', 'i', 'you', 'it', 'have', 'be', 'on', 'for', 'do', 'say',
      'this', 'they', 'is', 'an', 'at', 'but', 'we', 'his', 'from', 'that', 'not', 'by', 'she', 'or',
      'as', 'what', 'go', 'their', 'can', 'who', 'get', 'if', 'would', 'her', 'all', 'my', 'make',
      'about', 'know', 'will', 'as', 'up', 'one', 'time', 'has', 'been', 'there', 'year', 'so',
      'think', 'when', 'which', 'them', 'some', 'me', 'people', 'take', 'out', 'into', 'just', 'see',
      'him', 'your', 'come', 'could', 'now', 'than', 'like', 'other', 'how', 'then', 'its', 'our',
      'two', 'more', 'these', 'want', 'way', 'look', 'first', 'also', 'new', 'because', 'day', 'more',
      'use', 'no', 'man', 'find', 'here', 'thing', 'give', 'many', 'well', 'only', 'those', 'tell',
      'very', 'her', 'even', 'back', 'any', 'good', 'woman', 'through', 'us', 'life', 'child', 'work',
      'down', 'may', 'after', 'should', 'call', 'world', 'over', 'school', 'still', 'try', 'in', 'as',
      'last', 'ask', 'need', 'too', 'feel', 'three', 'when', 'state', 'never', 'become', 'between',
      'high', 'really', 'something', 'most', 'another', 'much', 'family', 'own', 'out', 'leave'
    ];

    common.forEach(word => this.commonWords.add(word));

    // Complex/sophisticated words
    const complex = [
      'sophisticated', 'implementation', 'consideration', 'fundamental', 'comprehensive', 'significance',
      'extraordinary', 'revolutionary', 'unprecedented', 'phenomenal', 'magnificent', 'consequently',
      'nevertheless', 'furthermore', 'elaborate', 'intricate', 'meticulous', 'substantial', 'considerable',
      'remarkable', 'exceptional', 'outstanding', 'distinguished', 'prominent', 'inevitable', 'essential',
      'critical', 'crucial', 'significant', 'substantial', 'extensive', 'comprehensive', 'thorough',
      'elaborate', 'sophisticated', 'advanced', 'complex', 'intricate', 'detailed', 'specific',
      'particular', 'individual', 'unique', 'distinct', 'separate', 'independent', 'autonomous',
      'contemporary', 'modern', 'current', 'recent', 'latest', 'updated', 'revised', 'modified',
      'alternative', 'optional', 'additional', 'supplementary', 'complementary', 'corresponding',
      'equivalent', 'similar', 'comparable', 'analogous', 'parallel', 'related', 'associated',
      'connected', 'linked', 'attached', 'combined', 'integrated', 'unified', 'consolidated'
    ];

    complex.forEach(word => this.complexWords.add(word));
  }

  analyze(text: string): ComplexityAnalysis {
    const words = this.tokenizeText(text);
    const sentences = this.splitIntoSentences(text);
    
    const vocabularyDiversity = this.calculateVocabularyDiversity(words);
    const sentenceComplexity = this.calculateSentenceComplexity(sentences);
    const conceptDensity = this.calculateConceptDensity(words);
    const emotionalComplexity = this.calculateEmotionalComplexity(text, words);
    
    // Overall complexity is a weighted combination
    const overallComplexity = (
      vocabularyDiversity * 0.3 +
      sentenceComplexity * 0.3 +
      conceptDensity * 0.25 +
      emotionalComplexity * 0.15
    );

    return {
      overallComplexity: Math.min(1, overallComplexity),
      vocabularyDiversity,
      sentenceComplexity,
      conceptDensity,
      emotionalComplexity
    };
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  private calculateVocabularyDiversity(words: string[]): number {
    if (words.length === 0) return 0;

    const uniqueWords = new Set(words);
    const typeTokenRatio = uniqueWords.size / words.length;
    
    // Count sophisticated vocabulary
    let sophisticatedCount = 0;
    let commonCount = 0;
    
    uniqueWords.forEach(word => {
      if (this.complexWords.has(word) || word.length > 8) {
        sophisticatedCount++;
      } else if (this.commonWords.has(word)) {
        commonCount++;
      }
    });

    const sophisticatedRatio = sophisticatedCount / uniqueWords.size;
    const commonRatio = commonCount / uniqueWords.size;
    
    // Higher type-token ratio and sophisticated vocabulary = higher diversity
    const diversityScore = (typeTokenRatio * 0.6) + (sophisticatedRatio * 0.3) + ((1 - commonRatio) * 0.1);
    
    return Math.min(1, diversityScore * 2); // Scale up for better distribution
  }

  private calculateSentenceComplexity(sentences: string[]): number {
    if (sentences.length === 0) return 0;

    let totalComplexity = 0;
    
    sentences.forEach(sentence => {
      const sentenceWords = sentence.split(/\s+/).filter(word => word.length > 0);
      const wordCount = sentenceWords.length;
      
      // Length complexity
      let lengthComplexity = 0;
      if (wordCount <= 10) lengthComplexity = 0.2;
      else if (wordCount <= 20) lengthComplexity = 0.5;
      else if (wordCount <= 30) lengthComplexity = 0.8;
      else lengthComplexity = 1.0;
      
      // Punctuation complexity (commas, semicolons indicate complex structure)
      const commaCount = (sentence.match(/,/g) || []).length;
      const semicolonCount = (sentence.match(/;/g) || []).length;
      const colonCount = (sentence.match(/:/g) || []).length;
      const punctuationComplexity = Math.min(1, (commaCount * 0.1) + (semicolonCount * 0.2) + (colonCount * 0.15));
      
      // Subordinate clause indicators
      const subordinateIndicators = [
        'because', 'since', 'although', 'while', 'whereas', 'if', 'unless', 'until',
        'before', 'after', 'when', 'where', 'which', 'that', 'who', 'whom'
      ];
      
      const subordinateCount = subordinateIndicators.reduce((count, indicator) => {
        return count + (sentence.toLowerCase().split(indicator).length - 1);
      }, 0);
      
      const subordinateComplexity = Math.min(1, subordinateCount * 0.3);
      
      // Combine factors for sentence complexity
      const sentenceComplexity = (lengthComplexity * 0.4) + (punctuationComplexity * 0.3) + (subordinateComplexity * 0.3);
      totalComplexity += sentenceComplexity;
    });

    return totalComplexity / sentences.length;
  }

  private calculateConceptDensity(words: string[]): number {
    if (words.length === 0) return 0;

    // Count different types of concepts
    let abstractConcepts = 0;
    let technicalTerms = 0;
    let actionWords = 0;
    let descriptiveWords = 0;

    // Abstract concept indicators
    const abstractIndicators = [
      'concept', 'idea', 'theory', 'principle', 'philosophy', 'belief', 'thought', 'notion',
      'understanding', 'knowledge', 'wisdom', 'meaning', 'purpose', 'significance', 'importance',
      'value', 'quality', 'characteristic', 'nature', 'essence', 'reality', 'truth', 'fact',
      'assumption', 'hypothesis', 'conclusion', 'inference', 'implication', 'consequence'
    ];

    // Technical/domain-specific indicators
    const technicalIndicators = [
      'system', 'process', 'method', 'approach', 'technique', 'procedure', 'mechanism',
      'function', 'operation', 'performance', 'efficiency', 'optimization', 'analysis',
      'evaluation', 'assessment', 'measurement', 'calculation', 'computation', 'algorithm',
      'structure', 'framework', 'architecture', 'design', 'implementation', 'development'
    ];

    words.forEach(word => {
      // Check for abstract concepts
      if (abstractIndicators.some(indicator => word.includes(indicator)) ||
          word.endsWith('ness') || word.endsWith('ity') || word.endsWith('ism')) {
        abstractConcepts++;
      }
      
      // Check for technical terms
      if (technicalIndicators.some(indicator => word.includes(indicator)) ||
          word.endsWith('tion') || word.endsWith('sion') || word.endsWith('ment')) {
        technicalTerms++;
      }
      
      // Check for action words (verbs)
      if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('en')) {
        actionWords++;
      }
      
      // Check for descriptive words (adjectives/adverbs)
      if (word.endsWith('ly') || word.endsWith('ful') || word.endsWith('less') ||
          word.endsWith('ous') || word.endsWith('ive') || word.endsWith('able')) {
        descriptiveWords++;
      }
    });

    const totalConceptualWords = abstractConcepts + technicalTerms + actionWords + descriptiveWords;
    const conceptDensity = totalConceptualWords / words.length;
    
    // Weight different types of concepts
    const weightedDensity = (
      (abstractConcepts / words.length) * 0.4 +
      (technicalTerms / words.length) * 0.3 +
      (actionWords / words.length) * 0.2 +
      (descriptiveWords / words.length) * 0.1
    );

    // Use conceptDensity for potential future enhancements
    void conceptDensity;

    return Math.min(1, weightedDensity * 3); // Scale for better distribution
  }

  private calculateEmotionalComplexity(text: string, words: string[]): number {
    // Emotional indicators
    const emotionWords = new Set([
      'happy', 'sad', 'angry', 'fear', 'joy', 'love', 'hate', 'excited', 'nervous',
      'calm', 'stressed', 'peaceful', 'worried', 'confident', 'anxious', 'hopeful',
      'disappointed', 'frustrated', 'content', 'lonely', 'grateful', 'proud',
      'embarrassed', 'ashamed', 'guilty', 'relieved', 'surprised', 'shocked',
      'amazed', 'confused', 'curious', 'interested', 'bored', 'tired', 'energetic'
    ]);

    // Emotional complexity indicators
    const complexEmotions = new Set([
      'melancholy', 'euphoric', 'despondent', 'elated', 'apprehensive', 'contemplative',
      'nostalgic', 'bittersweet', 'ambivalent', 'conflicted', 'overwhelmed', 'underwhelmed',
      'disillusioned', 'enlightened', 'empowered', 'vulnerable', 'resilient', 'determined'
    ]);

    // Emotional intensity words
    const intensifiers = new Set([
      'extremely', 'incredibly', 'absolutely', 'completely', 'utterly', 'deeply',
      'profoundly', 'intensely', 'overwhelmingly', 'exceptionally', 'remarkably'
    ]);

    let simpleEmotions = 0;
    let complexEmotionCount = 0;
    let intensifierCount = 0;
    let emotionalNuance = 0;

    words.forEach(word => {
      if (emotionWords.has(word)) simpleEmotions++;
      if (complexEmotions.has(word)) complexEmotionCount++;
      if (intensifiers.has(word)) intensifierCount++;
    });

    // Check for emotional nuance (contradictions, mixed feelings)
    const nuanceIndicators = [
      'but', 'however', 'although', 'despite', 'nevertheless', 'yet', 'still',
      'on the other hand', 'at the same time', 'mixed feelings', 'torn between'
    ];

    nuanceIndicators.forEach(indicator => {
      if (text.toLowerCase().includes(indicator)) {
        emotionalNuance += 0.2;
      }
    });

    const totalEmotionalWords = simpleEmotions + complexEmotionCount;
    const emotionalDensity = totalEmotionalWords / words.length;
    
    // Complex emotions and nuance indicate higher emotional complexity
    const complexityScore = (
      (emotionalDensity * 0.3) +
      (complexEmotionCount / words.length * 0.4) +
      (intensifierCount / words.length * 0.2) +
      (Math.min(1, emotionalNuance) * 0.1)
    );
    
    // Use conceptDensity if needed for future enhancements
    const conceptDensity = totalEmotionalWords / words.length;
    void conceptDensity;

    return Math.min(1, complexityScore * 4); // Scale for better distribution
  }

  // Helper method to get complexity level as human-readable string
  getComplexityLevel(complexity: number): string {
    if (complexity < 0.2) return 'Very Simple';
    if (complexity < 0.4) return 'Simple';
    if (complexity < 0.6) return 'Moderate';
    if (complexity < 0.8) return 'Complex';
    return 'Very Complex';
  }

  // Helper method to get detailed complexity breakdown
  getComplexityBreakdown(analysis: ComplexityAnalysis): Record<string, string> {
    return {
      overall: this.getComplexityLevel(analysis.overallComplexity),
      vocabulary: this.getComplexityLevel(analysis.vocabularyDiversity),
      sentence: this.getComplexityLevel(analysis.sentenceComplexity),
      concepts: this.getComplexityLevel(analysis.conceptDensity),
      emotional: this.getComplexityLevel(analysis.emotionalComplexity)
    };
  }
}