# ALGORITHM IMPLEMENTATION GUIDE
**Complete mathematical formulas and processing algorithms for Neural Echo**

---

## 🧮 CORE MATHEMATICAL FORMULAS

### **Node Generation Formula - CRITICAL IMPLEMENTATION**

```typescript
// PRIMARY NODE CALCULATION ALGORITHM
function calculateBaseNodeCount(
  wordCount: number,
  complexity: ComplexityAnalysis, 
  emotionIntensity: number,
  strategy: string
): number {
  
  // Step 1: Logarithmic base scaling
  const baseNodes = Math.log2(wordCount + 1) * 8
  
  // Step 2: Complexity amplification
  // complexity.overallComplexity range: 0-1 (vocabulary diversity + sentence complexity)
  const complexityBonus = 1 + (complexity.overallComplexity * 1.5)
  
  // Step 3: Emotional intensity multiplier  
  // emotionIntensity range: 0-1 (sum of all emotion scores normalized)
  const emotionalBonus = 0.5 + (emotionIntensity * 1.5)
  
  // Step 4: Strategy-specific scaling
  const strategyMultiplier = getStrategyMultiplier(strategy)
  
  // Step 5: Final calculation with bounds
  const rawNodeCount = baseNodes * complexityBonus * emotionalBonus * strategyMultiplier
  const finalNodeCount = Math.floor(Math.max(8, Math.min(1000, rawNodeCount)))
  
  return finalNodeCount
}

// STRATEGY MULTIPLIER LOOKUP
function getStrategyMultiplier(strategy: string): number {
  const multipliers = {
    'enhancement': 4.0,              // Small text gets 4x enhancement
    'standard': 1.0,                 // Medium text baseline
    'clustering': 0.8,               // Large text slight reduction
    'compression': 0.4,              // Huge text significant reduction
    'aggressive_compression': 0.2,   // Massive text heavy compression
    'emergency_mode': 0.1            // Emergency ultra-compression
  }
  return multipliers[strategy] || 1.0
}
```

### **Complexity Analysis Algorithm**

```typescript
interface ComplexityAnalysis {
  wordCount: number
  vocabularyDiversity: number      // unique words / total words
  avgSentenceLength: number
  conceptDensity: number           // concepts / total words  
  overallComplexity: number        // 0-1 normalized
}

function analyzeComplexity(text: string, concepts: Concept[]): ComplexityAnalysis {
  const words = text.split(/\s+/).filter(word => word.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  
  const wordCount = words.length
  const vocabularyDiversity = uniqueWords.size / wordCount
  const avgSentenceLength = wordCount / sentences.length
  const conceptDensity = concepts.length / wordCount
  
  // Normalize complexity metrics (0-1 range)
  const normalizedDiversity = Math.min(vocabularyDiversity * 2, 1) // Cap at 1
  const normalizedSentenceLength = Math.min(avgSentenceLength / 20, 1) // 20 words = max complexity
  const normalizedConceptDensity = Math.min(conceptDensity * 5, 1) // 20% concept density = max
  
  // Weighted overall complexity
  const overallComplexity = (
    normalizedDiversity * 0.4 +        // 40% vocabulary diversity
    normalizedSentenceLength * 0.3 +   // 30% sentence complexity
    normalizedConceptDensity * 0.3      // 30% concept density
  )
  
  return {
    wordCount,
    vocabularyDiversity: normalizedDiversity,
    avgSentenceLength: normalizedSentenceLength,
    conceptDensity: normalizedConceptDensity,
    overallComplexity
  }
}
```

---

## 🎯 SCALING STRATEGY ALGORITHMS

### **Strategy Determination Algorithm**

```typescript
interface ScalingStrategy {
  strategy: string
  multiplier: number
  limits: ScalingLimits
  enhancementLevel: number
  compressionRatio: number
  enableClustering: boolean
}

interface ScalingLimits {
  maxNodes: number
  maxConnections: number
  maxParticles: number
}

function determineScalingStrategy(wordCount: number, complexity: ComplexityAnalysis): ScalingStrategy {
  
  // STEP 1: Determine base strategy from word count
  let baseStrategy: string
  let baseMultiplier: number
  
  if (wordCount <= 5) {
    baseStrategy = 'enhancement'
    baseMultiplier = 8.0  // 8x enhancement for micro text
  } else if (wordCount <= 15) {
    baseStrategy = 'enhancement' 
    baseMultiplier = 4.0  // 4x enhancement for tiny text
  } else if (wordCount <= 50) {
    baseStrategy = 'standard'
    baseMultiplier = 1.0  // Standard processing
  } else if (wordCount <= 150) {
    baseStrategy = 'standard'
    baseMultiplier = 1.0
  } else if (wordCount <= 400) {
    baseStrategy = 'clustering'
    baseMultiplier = 0.8  // Slight reduction with clustering
  } else if (wordCount <= 1000) {
    baseStrategy = 'compression'
    baseMultiplier = 0.4  // Significant compression
  } else if (wordCount <= 2500) {
    baseStrategy = 'aggressive_compression'
    baseMultiplier = 0.2  // Heavy compression
  } else {
    baseStrategy = 'emergency_mode'
    baseMultiplier = 0.1  // Emergency ultra-compression
  }
  
  // STEP 2: Adjust based on complexity
  const complexityAdjustment = 1 + (complexity.overallComplexity - 0.5) * 0.3
  const finalMultiplier = baseMultiplier * complexityAdjustment
  
  // STEP 3: Set strategy-specific limits
  const limits = calculateScalingLimits(baseStrategy, wordCount, complexity)
  
  return {
    strategy: baseStrategy,
    multiplier: finalMultiplier,
    limits,
    enhancementLevel: baseStrategy === 'enhancement' ? finalMultiplier : 1.0,
    compressionRatio: baseStrategy.includes('compression') ? finalMultiplier : 1.0,
    enableClustering: baseStrategy === 'clustering' || baseStrategy.includes('compression')
  }
}

function calculateScalingLimits(strategy: string, wordCount: number, complexity: ComplexityAnalysis): ScalingLimits {
  const baseLimits = {
    enhancement: { maxNodes: 100, maxConnections: 200, maxParticles: 30000 },
    standard: { maxNodes: 200, maxConnections: 400, maxParticles: 50000 },
    clustering: { maxNodes: 150, maxConnections: 300, maxParticles: 40000 },
    compression: { maxNodes: 100, maxConnections: 200, maxParticles: 30000 },
    aggressive_compression: { maxNodes: 50, maxConnections: 100, maxParticles: 20000 },
    emergency_mode: { maxNodes: 25, maxConnections: 50, maxParticles: 10000 }
  }
  
  return baseLimits[strategy] || baseLimits['standard']
}
```

### **Node Distribution Algorithm**

```typescript
interface NodeDistribution {
  primary: number    // Most important nodes (30%)
  secondary: number  // Supporting nodes (40%)  
  tertiary: number   // Background nodes (20%)
  environmental: number // Atmosphere nodes (10%)
}

function distributeNodesByTier(totalNodes: number, analysis: AnalysisResult): NodeDistribution {
  const distribution = {
    primary: Math.floor(totalNodes * 0.30),
    secondary: Math.floor(totalNodes * 0.40),
    tertiary: Math.floor(totalNodes * 0.20),
    environmental: Math.floor(totalNodes * 0.10)
  }
  
  // Ensure total adds up (handle rounding)
  const sum = distribution.primary + distribution.secondary + distribution.tertiary + distribution.environmental
  const remainder = totalNodes - sum
  distribution.primary += remainder // Add remainder to primary tier
  
  return distribution
}
```

---

## 🧠 AI ANALYSIS ALGORITHMS

### **Sentiment Analysis Algorithm**

```typescript
function analyzeSentiment(text: string): SentimentAnalysis {
  const words = text.toLowerCase().split(/\s+/)
  const emotionScores = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, anticipation: 0 }
  
  // STEP 1: Calculate raw emotion scores
  words.forEach((word, index) => {
    Object.entries(EMOTION_LEXICON).forEach(([emotion, emotionWords]) => {
      if (emotionWords.includes(word)) {
        // Position weighting - later words have slightly more weight
        const positionWeight = 1 + (index / words.length) * 0.2
        emotionScores[emotion] += positionWeight
      }
    })
  })
  
  // STEP 2: Normalize scores (0-1 range)
  const maxScore = Math.max(...Object.values(emotionScores), 1)
  Object.keys(emotionScores).forEach(emotion => {
    emotionScores[emotion] = emotionScores[emotion] / maxScore
  })
  
  // STEP 3: Find dominant emotion
  const dominantEmotion = Object.entries(emotionScores)
    .sort(([,a], [,b]) => b - a)[0]
  
  // STEP 4: Calculate intensity (sum of all emotion scores)
  const intensity = Object.values(emotionScores).reduce((sum, score) => sum + score, 0) / 6
  
  // STEP 5: Calculate valence and arousal
  const valence = calculateValence(emotionScores)
  const arousal = calculateArousal(emotionScores)
  
  return {
    scores: emotionScores,
    dominant: { emotion: dominantEmotion[0], strength: dominantEmotion[1] },
    intensity: Math.min(intensity, 1),
    valence,
    arousal
  }
}

function calculateValence(scores: EmotionScores): number {
  // Positive emotions vs negative emotions
  const positive = scores.joy + scores.surprise + scores.anticipation
  const negative = scores.sadness + scores.anger + scores.fear
  
  return (positive - negative) / Math.max(positive + negative, 1)
}

function calculateArousal(scores: EmotionScores): number {
  // High arousal emotions vs low arousal emotions  
  const highArousal = scores.anger + scores.fear + scores.surprise
  const lowArousal = scores.sadness + scores.joy + scores.anticipation
  
  return highArousal / Math.max(highArousal + lowArousal, 1)
}
```

### **Concept Extraction Algorithm**

```typescript
function extractConcepts(text: string, options: ExtractionOptions = {}): Concept[] {
  const words = text.toLowerCase().split(/\s+/)
  const concepts: Map<string, Concept> = new Map()
  
  // STEP 1: Filter and classify words
  words.forEach((word, position) => {
    // Skip stop words and short words
    if (STOP_WORDS.has(word) || word.length < 3) return
    
    // Determine category
    const category = classifyWordCategory(word)
    if (category === 'unknown') return
    
    // Update or create concept
    if (concepts.has(word)) {
      const concept = concepts.get(word)!
      concept.frequency++
      concept.positions.push(position)
    } else {
      concepts.set(word, {
        word,
        category,
        frequency: 1,
        positions: [position],
        relevance: 0, // Calculated later
        connections: []
      })
    }
  })
  
  // STEP 2: Calculate relevance scores
  const maxFrequency = Math.max(...Array.from(concepts.values()).map(c => c.frequency))
  concepts.forEach(concept => {
    // Frequency component (0-0.6)
    const frequencyScore = (concept.frequency / maxFrequency) * 0.6
    
    // Position component (0-0.3) - later positions weighted higher
    const avgPosition = concept.positions.reduce((sum, pos) => sum + pos, 0) / concept.positions.length
    const positionScore = (avgPosition / words.length) * 0.3
    
    // Category importance (0-0.1)
    const categoryScore = getCategoryImportance(concept.category) * 0.1
    
    concept.relevance = Math.min(frequencyScore + positionScore + categoryScore, 1.0)
  })
  
  // STEP 3: Find semantic connections
  const conceptArray = Array.from(concepts.values())
  conceptArray.forEach(concept => {
    concept.connections = findSemanticConnections(concept, conceptArray)
  })
  
  // STEP 4: Sort by relevance and apply limits
  return conceptArray
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, options.maxConcepts || 50)
    .filter(c => c.relevance >= (options.minRelevance || 0.1))
}

function classifyWordCategory(word: string): ConceptCategory {
  // Pattern-based classification
  if (CATEGORY_PATTERNS.emotion.test(word)) return 'emotion'
  if (CATEGORY_PATTERNS.time.test(word)) return 'time'
  if (CATEGORY_PATTERNS.people.test(word)) return 'people'
  if (CATEGORY_PATTERNS.places.test(word)) return 'places'
  if (CATEGORY_PATTERNS.actions.test(word)) return 'actions'
  if (CATEGORY_PATTERNS.abstract.test(word)) return 'abstract'
  
  return 'objects' // Default category
}

function findSemanticConnections(concept: Concept, allConcepts: Concept[]): string[] {
  const connections: string[] = []
  
  allConcepts.forEach(otherConcept => {
    if (otherConcept.word === concept.word) return
    
    // Calculate semantic similarity
    const similarity = calculateSemanticSimilarity(concept, otherConcept)
    
    if (similarity > 0.3) { // Similarity threshold
      connections.push(otherConcept.word)
    }
  })
  
  return connections.slice(0, 5) // Max 5 connections per concept
}
```

---

## 🌟 ENHANCEMENT ALGORITHMS (Small Text)

### **Contextual Expansion Algorithm**

```typescript
function generateImpliedContext(concepts: Concept[], sentiment: SentimentAnalysis): Node[] {
  const impliedNodes: Node[] = []
  
  // STEP 1: Generate concept-based implications
  concepts.forEach((concept, conceptIndex) => {
    const implications = CONCEPT_IMPLICATIONS[concept.word] || []
    
    implications.forEach((implied, index) => {
      // Decay relevance for each implication
      const relevance = concept.relevance * (0.8 - index * 0.1)
      
      if (relevance > 0.3) {
        impliedNodes.push({
          id: `implied_${implied}_${concept.word}`,
          type: 'implied_concept',
          word: implied,
          category: 'contextual',
          relevance: relevance,
          sourceNode: concept.word,
          synthetic: true,
          position: calculateImpliedPosition(concept.word, conceptIndex, index)
        })
      }
    })
  })
  
  // STEP 2: Generate emotion-based implications  
  Object.entries(sentiment.scores).forEach(([emotion, score]) => {
    if (score > 0.3) {
      const implications = EMOTIONAL_IMPLICATIONS[emotion] || []
      
      implications.forEach((implied, index) => {
        const relevance = score * (0.7 - index * 0.15)
        
        if (relevance > 0.2) {
          impliedNodes.push({
            id: `implied_emotion_${implied}_${emotion}`,
            type: 'implied_emotion',
            word: implied,
            category: 'emotional_context',
            relevance: relevance,
            sourceEmotion: emotion,
            synthetic: true,
            position: calculateEmotionalImplicationPosition(emotion, index)
          })
        }
      })
    }
  })
  
  return impliedNodes
}

function calculateImpliedPosition(sourceWord: string, conceptIndex: number, impliedIndex: number): Vector3 {
  // Position implications in a small orbit around their source
  const baseRadius = 12
  const angle = (impliedIndex / 5) * Math.PI * 2
  const radius = baseRadius + Math.random() * 6
  const height = (Math.random() - 0.5) * 8
  
  // Base position for concept (if known) or calculate from index
  const baseX = conceptIndex * 25 // Spread concepts horizontally
  const baseY = 0
  const baseZ = 0
  
  return {
    x: baseX + Math.cos(angle) * radius,
    y: baseY + height,
    z: baseZ + Math.sin(angle) * radius
  }
}
```

### **Emotional Amplification Algorithm**

```typescript
function amplifyEmotions(sentiment: SentimentAnalysis, enhancementMultiplier: number): Node[] {
  const amplifiedNodes: Node[] = []
  
  Object.entries(sentiment.scores).forEach(([emotion, score]) => {
    if (score > 0.1) {
      // STEP 1: Create amplified base emotion
      amplifiedNodes.push({
        id: `amplified_${emotion}`,
        type: 'amplified_emotion',
        emotion: emotion,
        intensity: Math.min(score * enhancementMultiplier, 1.0),
        baseScore: score,
        synthetic: false,
        position: calculateEmotionPosition(emotion),
        size: 3 + score * enhancementMultiplier * 2,
        color: getEmotionColor(emotion)
      })
      
      // STEP 2: Add emotional nuance satellites
      const nuances = EMOTION_NUANCES[emotion] || []
      nuances.forEach((nuance, index) => {
        const nuanceIntensity = score * nuance.intensity * enhancementMultiplier * 0.6
        
        if (nuanceIntensity > 0.2) {
          amplifiedNodes.push({
            id: `nuance_${nuance.nuance}_${emotion}`,
            type: 'emotion_nuance',
            emotion: nuance.nuance,
            parentEmotion: emotion,
            intensity: nuanceIntensity,
            synthetic: true,
            position: calculateNuancePosition(emotion, index),
            size: 1.5 + nuanceIntensity * 2,
            color: nuance.color
          })
        }
      })
    }
  })
  
  return amplifiedNodes
}

function calculateEmotionPosition(emotion: string): Vector3 {
  // Emotional space positioning
  const emotionalPositions = {
    'joy': { x: 20, y: 15, z: 0 },
    'sadness': { x: -20, y: -15, z: -5 },
    'anger': { x: -25, y: 0, z: 10 },
    'fear': { x: -15, y: -10, z: 0 },
    'surprise': { x: 0, y: 25, z: 0 },
    'anticipation': { x: 25, y: 20, z: 5 }
  }
  
  const basePos = emotionalPositions[emotion] || { x: 0, y: 0, z: 0 }
  
  return {
    x: basePos.x + (Math.random() - 0.5) * 8,
    y: basePos.y + (Math.random() - 0.5) * 8,
    z: basePos.z + (Math.random() - 0.5) * 8
  }
}
```

---

## 🗜️ COMPRESSION ALGORITHMS (Large Text)

### **Hierarchical Clustering Algorithm**

```typescript
function clusterConcepts(concepts: Concept[], options: ClusteringOptions = {}): ClusterHierarchy {
  const maxClusters = options.maxClusters || 50
  const similarityThreshold = options.similarityThreshold || 0.6
  const maxLevels = options.maxLevels || 4
  
  // STEP 1: Initial clustering by semantic similarity
  let currentLevel = performInitialClustering(concepts, similarityThreshold)
  const hierarchy: ClusterHierarchy = { level0: currentLevel }
  
  // STEP 2: Multi-level hierarchical clustering
  for (let level = 1; level < maxLevels; level++) {
    if (currentLevel.length <= maxClusters) break
    
    currentLevel = performHierarchicalClustering(currentLevel, level)
    hierarchy[`level${level}`] = currentLevel
    
    if (currentLevel.length <= Math.max(maxClusters, 10)) break
  }
  
  return hierarchy
}

function performInitialClustering(concepts: Concept[], threshold: number): Cluster[] {
  const clusters: Cluster[] = []
  const processed = new Set<string>()
  
  concepts.forEach(concept => {
    if (processed.has(concept.word)) return
    
    const cluster: Cluster = {
      id: `cluster_l0_${clusters.length}`,
      level: 0,
      concepts: [concept],
      centroid: concept,
      coherence: 1.0,
      topics: extractTopics([concept]),
      importance: concept.relevance,
      semanticFingerprint: generateSemanticFingerprint([concept])
    }
    
    // Find similar concepts to group with this one
    concepts.forEach(otherConcept => {
      if (processed.has(otherConcept.word) || otherConcept.word === concept.word) return
      
      const similarity = calculateAdvancedSimilarity(concept, otherConcept)
      
      if (similarity > threshold && cluster.concepts.length < 25) {
        cluster.concepts.push(otherConcept)
        cluster.importance += otherConcept.relevance
        processed.add(otherConcept.word)
      }
    })
    
    // Update cluster properties
    cluster.centroid = calculateClusterCentroid(cluster.concepts)
    cluster.coherence = calculateClusterCoherence(cluster.concepts)
    cluster.importance = cluster.importance / cluster.concepts.length
    
    processed.add(concept.word)
    clusters.push(cluster)
  })
  
  return clusters
}

function calculateAdvancedSimilarity(concept1: Concept, concept2: Concept): number {
  // Multi-factor similarity calculation
  
  // 1. Category similarity (40% weight)
  const categoryScore = calculateCategoryRelatedness(concept1.category, concept2.category)
  
  // 2. Contextual similarity (25% weight) - position proximity
  const contextScore = calculateContextualProximity(concept1.positions, concept2.positions)
  
  // 3. Co-occurrence similarity (20% weight) - shared connections
  const cooccurrenceScore = calculateCooccurrenceStrength(concept1.connections, concept2.connections)
  
  // 4. Frequency correlation (15% weight)
  const frequencyScore = calculateFrequencyCorrelation(concept1.frequency, concept2.frequency)
  
  return (categoryScore * 0.4) + (contextScore * 0.25) + (cooccurrenceScore * 0.2) + (frequencyScore * 0.15)
}
```

### **Importance Weighting Algorithm**

```typescript
function calculateClusterImportance(cluster: Cluster, sentiment: SentimentAnalysis, complexity: ComplexityAnalysis): number {
  const weights = {
    frequency: 0.3,      // How often concepts appear
    sentiment: 0.25,     // Emotional significance
    uniqueness: 0.2,     // Rarity/distinctiveness
    connections: 0.15,   // Network centrality
    recency: 0.1         // Position bias
  }
  
  // 1. Frequency factor
  const avgFrequency = cluster.concepts.reduce((sum, c) => sum + c.frequency, 0) / cluster.concepts.length
  const frequencyScore = Math.min(avgFrequency / complexity.avgConceptFrequency, 2.0)
  
  // 2. Sentiment factor
  const emotionalRelevance = calculateEmotionalRelevance(cluster, sentiment)
  
  // 3. Uniqueness factor
  const uniquenessScore = calculateUniquenessScore(cluster, complexity)
  
  // 4. Connection factor
  const connectivityScore = calculateConnectivityScore(cluster)
  
  // 5. Recency factor
  const recencyScore = calculateRecencyScore(cluster)
  
  return (
    frequencyScore * weights.frequency +
    emotionalRelevance * weights.sentiment +
    uniquenessScore * weights.uniqueness +
    connectivityScore * weights.connections +
    recencyScore * weights.recency
  )
}

function assignRenderingTiers(sortedClusters: Cluster[]): Cluster[] {
  const totalClusters = sortedClusters.length
  
  return sortedClusters.map((cluster, index) => {
    const percentile = index / totalClusters
    
    let tier: RenderingTier
    let renderingProperties: RenderingProperties
    
    if (percentile <= 0.2) {
      // Top 20% - Always visible, full detail
      tier = 'primary'
      renderingProperties = {
        alwaysVisible: true,
        detailLevel: 'full',
        nodeSize: 'large',
        connectionOpacity: 1.0,
        particleDensity: 'high'
      }
    } else if (percentile <= 0.5) {
      // Next 30% - High detail, contextual visibility
      tier = 'secondary'
      renderingProperties = {
        alwaysVisible: false,
        detailLevel: 'high',
        nodeSize: 'medium',
        connectionOpacity: 0.8,
        particleDensity: 'medium'
      }
    } else if (percentile <= 0.8) {
      // Next 30% - Medium detail
      tier = 'tertiary'
      renderingProperties = {
        alwaysVisible: false,
        detailLevel: 'medium',
        nodeSize: 'small',
        connectionOpacity: 0.6,
        particleDensity: 'low'
      }
    } else {
      // Bottom 20% - Minimal detail, hidden unless explored
      tier = 'background'
      renderingProperties = {
        alwaysVisible: false,
        detailLevel: 'minimal',
        nodeSize: 'tiny',
        connectionOpacity: 0.3,
        particleDensity: 'minimal'
      }
    }
    
    return {
      ...cluster,
      renderingTier: tier,
      renderingProperties,
      lodThreshold: calculateLODThreshold(tier)
    }
  })
}
```

---

This algorithm guide provides all the mathematical formulas and processing logic needed to implement the intelligent scaling and AI analysis systems.