import type {
  Concept,
  ConceptCategory,
  SemanticGraph,
  ConceptNode,
  SemanticEdge,
  ConceptCluster,
  RelationshipType
} from '../types';

export class ConceptExtractor {
  private categoryPatterns: Map<ConceptCategory, RegExp>;
  private stopWords: Set<string>;
  private categoryKeywords: Map<ConceptCategory, string[]>;

  constructor() {
    this.categoryPatterns = new Map();
    this.stopWords = new Set();
    this.categoryKeywords = new Map();
    this.initializePatterns();
    this.initializeStopWords();
    this.initializeCategoryKeywords();
  }

  private initializePatterns(): void {
    this.categoryPatterns.set('emotion', 
      /emotional|feeling|mood|happy|sad|angry|fear|joy|love|hate|excited|nervous|calm|stressed|peaceful|worried|confident|anxious|hopeful|disappointed/i
    );
    
    this.categoryPatterns.set('time', 
      /time|day|night|morning|evening|afternoon|yesterday|today|tomorrow|now|then|when|before|after|during|while|moment|hour|minute|second|week|month|year|future|past|present|recently|soon|later|early|late/i
    );
    
    this.categoryPatterns.set('people', 
      /person|people|friend|family|someone|everyone|nobody|mother|father|parent|child|son|daughter|brother|sister|colleague|teammate|neighbor|stranger|community|group|individual|human|man|woman|boy|girl|adult|baby|elder/i
    );
    
    this.categoryPatterns.set('places', 
      /place|home|house|school|work|office|city|town|country|world|room|kitchen|bedroom|bathroom|garden|park|street|road|building|store|restaurant|hospital|church|library|museum|beach|mountain|forest|lake|river|university|college/i
    );
    
    this.categoryPatterns.set('actions', 
      /do|did|doing|done|run|walk|think|create|build|make|write|read|speak|listen|see|watch|look|go|come|move|stop|start|finish|begin|end|work|play|learn|teach|help|give|take|bring|send|receive|buy|sell|eat|drink|sleep|wake/i
    );
    
    this.categoryPatterns.set('abstract', 
      /idea|concept|thought|dream|hope|belief|philosophy|theory|principle|value|meaning|purpose|goal|plan|strategy|solution|problem|challenge|opportunity|success|failure|progress|change|growth|development|improvement|achievement|experience|memory|knowledge|wisdom|understanding|truth|justice|freedom|creativity|innovation|inspiration|motivation|determination/i
    );
    
    this.categoryPatterns.set('objects', 
      /thing|object|item|tool|car|bike|phone|computer|laptop|book|paper|pen|table|chair|bed|door|window|light|food|water|money|clothes|shoes|bag|camera|music|movie|game|toy|gift|key|lock|box|bottle|cup|plate|spoon|fork|knife/i
    );
  }

  private initializeStopWords(): void {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
      'if', 'then', 'else', 'so', 'as', 'than', 'too', 'very', 'much', 'many',
      'some', 'any', 'all', 'each', 'every', 'both', 'either', 'neither'
    ];

    stopWords.forEach(word => this.stopWords.add(word));
  }

  private initializeCategoryKeywords(): void {
    this.categoryKeywords.set('emotion', [
      'happiness', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'joy', 'love',
      'excitement', 'nervousness', 'anxiety', 'peace', 'stress', 'worry', 'confidence',
      'hope', 'disappointment', 'frustration', 'contentment', 'loneliness', 'gratitude'
    ]);

    this.categoryKeywords.set('time', [
      'morning', 'afternoon', 'evening', 'night', 'yesterday', 'today', 'tomorrow',
      'moment', 'instant', 'period', 'duration', 'schedule', 'deadline', 'appointment',
      'meeting', 'event', 'occasion', 'anniversary', 'birthday', 'holiday', 'vacation'
    ]);

    this.categoryKeywords.set('people', [
      'relationship', 'friendship', 'partnership', 'marriage', 'romance', 'dating',
      'conversation', 'communication', 'interaction', 'connection', 'bond', 'trust',
      'support', 'care', 'love', 'respect', 'understanding', 'empathy', 'kindness'
    ]);

    this.categoryKeywords.set('places', [
      'location', 'destination', 'journey', 'travel', 'exploration', 'adventure',
      'environment', 'atmosphere', 'scenery', 'landscape', 'architecture', 'design',
      'space', 'area', 'region', 'territory', 'boundary', 'distance', 'proximity'
    ]);

    this.categoryKeywords.set('actions', [
      'activity', 'behavior', 'performance', 'execution', 'implementation', 'practice',
      'exercise', 'training', 'skill', 'ability', 'talent', 'expertise', 'experience',
      'effort', 'attempt', 'try', 'struggle', 'fight', 'compete', 'collaborate'
    ]);

    this.categoryKeywords.set('abstract', [
      'concept', 'principle', 'theory', 'hypothesis', 'assumption', 'belief', 'opinion',
      'perspective', 'viewpoint', 'attitude', 'approach', 'method', 'strategy', 'plan',
      'goal', 'objective', 'purpose', 'meaning', 'significance', 'importance', 'value'
    ]);

    this.categoryKeywords.set('objects', [
      'device', 'equipment', 'instrument', 'machine', 'appliance', 'gadget', 'technology',
      'material', 'substance', 'product', 'creation', 'invention', 'design', 'structure',
      'system', 'component', 'element', 'feature', 'characteristic', 'property'
    ]);
  }

  extract(text: string): Concept[] {
    const words = this.tokenizeText(text);
    const concepts: Concept[] = [];
    const wordCounts = new Map<string, number>();
    const wordPositions = new Map<string, number[]>();

    // Count word frequencies and track positions
    words.forEach((word, index) => {
      if (!this.stopWords.has(word) && word.length > 2) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        
        if (!wordPositions.has(word)) {
          wordPositions.set(word, []);
        }
        wordPositions.get(word)!.push(index);
      }
    });

    // Extract concepts from significant words
    wordCounts.forEach((frequency, word) => {
      const category = this.classifyWord(word);
      const relevance = this.calculateRelevance(word, frequency, words.length, text);
      const connections = this.findConnectedWords(word, words, wordCounts);

      if (relevance > 0.1) { // Only include words with significant relevance
        concepts.push({
          word,
          category,
          relevance,
          frequency,
          position: wordPositions.get(word) || [],
          connections
        });
      }
    });

    // Sort by relevance and return top concepts
    return concepts
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, Math.min(50, concepts.length)); // Limit to top 50 concepts
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private classifyWord(word: string): ConceptCategory {
    // First check direct keyword matches
    for (const [category, keywords] of this.categoryKeywords) {
      if (keywords.includes(word)) {
        return category;
      }
    }

    // Then check pattern matches
    for (const [category, pattern] of this.categoryPatterns) {
      if (pattern.test(word)) {
        return category;
      }
    }

    // Default classification based on common patterns
    if (word.endsWith('ing') || word.endsWith('ed')) {
      return 'actions';
    }
    
    if (word.endsWith('ness') || word.endsWith('ity') || word.endsWith('ism')) {
      return 'abstract';
    }
    
    if (word.endsWith('er') || word.endsWith('or') || word.endsWith('ian')) {
      return 'people';
    }

    // Default to objects for concrete nouns
    return 'objects';
  }

  private calculateRelevance(
    word: string, 
    frequency: number, 
    totalWords: number, 
    originalText: string
  ): number {
    // Term frequency
    const tf = frequency / totalWords;
    
    // Word length bonus (longer words often more meaningful)
    const lengthBonus = Math.min(1, word.length / 10);
    
    // Position bonus (words at beginning/end more important)
    const positions = originalText.toLowerCase().indexOf(word);
    const positionBonus = positions < originalText.length * 0.2 ? 0.2 : 0;
    
    // Category importance multiplier
    const categoryMultiplier = this.getCategoryImportance(this.classifyWord(word));
    
    // Combine factors
    let relevance = (tf * 2) + lengthBonus + positionBonus;
    relevance *= categoryMultiplier;
    
    return Math.min(1, relevance);
  }

  private getCategoryImportance(category: ConceptCategory): number {
    const importance = {
      emotion: 1.5,    // Emotions are very important for visualization
      abstract: 1.3,   // Abstract concepts are significant
      people: 1.2,     // People are important
      actions: 1.1,    // Actions show dynamics
      time: 1.0,       // Time provides context
      places: 0.9,     // Places provide setting
      objects: 0.8     // Objects are less central
    };

    return importance[category] || 1.0;
  }

  private findConnectedWords(
    targetWord: string, 
    allWords: string[], 
    wordCounts: Map<string, number>
  ): string[] {
    const connections: string[] = [];
    const windowSize = 3; // Look 3 words before and after
    
    // Find all positions of the target word
    const targetPositions: number[] = [];
    allWords.forEach((word, index) => {
      if (word === targetWord) {
        targetPositions.push(index);
      }
    });

    // For each occurrence, check nearby words
    targetPositions.forEach(position => {
      const start = Math.max(0, position - windowSize);
      const end = Math.min(allWords.length, position + windowSize + 1);
      
      for (let i = start; i < end; i++) {
        if (i !== position) {
          const nearbyWord = allWords[i];
          if (!this.stopWords.has(nearbyWord) && 
              nearbyWord.length > 2 && 
              (wordCounts.get(nearbyWord) || 0) > 1) {
            if (!connections.includes(nearbyWord)) {
              connections.push(nearbyWord);
            }
          }
        }
      }
    });

    return connections.slice(0, 10); // Limit connections
  }

  buildSemanticGraph(concepts: Concept[]): SemanticGraph {
    const nodes = new Map<string, ConceptNode>();
    const edges = new Map<string, SemanticEdge>();
    
    // Create nodes
    concepts.forEach(concept => {
      nodes.set(concept.word, {
        id: concept.word,
        concept,
        importance: concept.relevance * concept.frequency,
        connections: concept.connections
      });
    });

    // Create edges based on connections
    concepts.forEach(concept => {
      concept.connections.forEach(connectedWord => {
        if (nodes.has(connectedWord)) {
          const edgeId = `${concept.word}-${connectedWord}`;
          const reverseEdgeId = `${connectedWord}-${concept.word}`;
          
          if (!edges.has(edgeId) && !edges.has(reverseEdgeId)) {
            edges.set(edgeId, {
              id: edgeId,
              source: concept.word,
              target: connectedWord,
              weight: this.calculateConnectionWeight(concept, nodes.get(connectedWord)!.concept),
              relationship: this.determineRelationshipType(concept, nodes.get(connectedWord)!.concept)
            });
          }
        }
      });
    });

    // Create clusters using simple category-based clustering
    const clusters = this.createConceptClusters(concepts);

    return {
      nodes,
      edges,
      clusters
    };
  }

  private calculateConnectionWeight(concept1: Concept, concept2: Concept): number {
    // Weight based on relevance and frequency
    const relevanceWeight = (concept1.relevance + concept2.relevance) / 2;
    const frequencyWeight = Math.min(1, (concept1.frequency + concept2.frequency) / 10);
    
    // Category similarity bonus
    const categoryBonus = concept1.category === concept2.category ? 0.3 : 0;
    
    return Math.min(1, relevanceWeight * 0.5 + frequencyWeight * 0.3 + categoryBonus + 0.2);
  }

  private determineRelationshipType(concept1: Concept, concept2: Concept): RelationshipType {
    if (concept1.category === 'emotion' || concept2.category === 'emotion') {
      return 'emotional';
    }
    
    if (concept1.category === 'time' || concept2.category === 'time') {
      return 'temporal';
    }
    
    if (concept1.category === concept2.category) {
      return 'semantic';
    }
    
    return 'contextual';
  }

  private createConceptClusters(concepts: Concept[]): ConceptCluster[] {
    const clusters: ConceptCluster[] = [];
    const conceptsByCategory = new Map<ConceptCategory, Concept[]>();
    
    // Group concepts by category
    concepts.forEach(concept => {
      if (!conceptsByCategory.has(concept.category)) {
        conceptsByCategory.set(concept.category, []);
      }
      conceptsByCategory.get(concept.category)!.push(concept);
    });

    // Create clusters from categories
    conceptsByCategory.forEach((categoryConcepts, category) => {
      if (categoryConcepts.length > 1) {
        // Find the most relevant concept as centroid
        const centroid = categoryConcepts.reduce((best, current) => 
          current.relevance > best.relevance ? current : best
        );

        // Calculate cluster coherence
        const coherence = this.calculateClusterCoherence(categoryConcepts);

        clusters.push({
          id: `cluster-${category}`,
          concepts: categoryConcepts.map(c => c.word),
          centroid,
          coherence
        });
      }
    });

    return clusters;
  }

  private calculateClusterCoherence(concepts: Concept[]): number {
    if (concepts.length <= 1) return 1;

    const relevanceVariance = this.calculateVariance(concepts.map(c => c.relevance));
    const frequencyVariance = this.calculateVariance(concepts.map(c => c.frequency));
    
    // Lower variance means higher coherence
    const relevanceCoherence = 1 / (1 + relevanceVariance);
    const frequencyCoherence = 1 / (1 + frequencyVariance);
    
    return (relevanceCoherence + frequencyCoherence) / 2;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  // Helper method to get top concepts by category
  getConceptsByCategory(concepts: Concept[], category: ConceptCategory, limit = 10): Concept[] {
    return concepts
      .filter(concept => concept.category === category)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // Helper method to find the most connected concepts
  getMostConnectedConcepts(concepts: Concept[], limit = 10): Concept[] {
    return concepts
      .sort((a, b) => b.connections.length - a.connections.length)
      .slice(0, limit);
  }
}