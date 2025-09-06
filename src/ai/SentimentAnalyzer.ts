import type {
  SentimentAnalysis,
  EmotionScores,
  DominantEmotion,
  EmojiData
} from '../types';

export class SentimentAnalyzer {
  private emotionLexicon: Map<string, { emotion: keyof EmotionScores; intensity: number }>;
  private negationWords: Set<string>;
  private intensifierWords: Map<string, number>;

  constructor() {
    this.emotionLexicon = new Map();
    this.negationWords = new Set();
    this.intensifierWords = new Map();
    this.initializeLexicons();
  }

  private initializeLexicons(): void {
    // Joy/Happiness lexicon
    const joyWords = [
      'happy', 'joy', 'excited', 'wonderful', 'amazing', 'brilliant', 'delighted', 'ecstatic',
      'joyful', 'cheerful', 'elated', 'euphoric', 'blissful', 'content', 'pleased', 'satisfied',
      'thrilled', 'overjoyed', 'gleeful', 'merry', 'upbeat', 'optimistic', 'positive', 'bright',
      'fantastic', 'great', 'excellent', 'perfect', 'beautiful', 'love', 'adore', 'celebrate',
      'triumph', 'victory', 'success', 'achievement', 'accomplishment', 'pride', 'confident',
      'hope', 'hopeful', 'inspiring', 'motivated', 'energetic', 'vibrant', 'alive'
    ];

    joyWords.forEach(word => {
      this.emotionLexicon.set(word, { emotion: 'joy', intensity: 0.8 });
    });

    // Sadness lexicon
    const sadnessWords = [
      'sad', 'depressed', 'gloomy', 'melancholy', 'disappointed', 'sorrowful', 'grief',
      'heartbroken', 'devastated', 'dejected', 'despondent', 'downhearted', 'miserable',
      'unhappy', 'blue', 'down', 'low', 'morose', 'mournful', 'woeful', 'tearful',
      'crying', 'weeping', 'sobbing', 'lonely', 'isolated', 'abandoned', 'lost',
      'hopeless', 'helpless', 'despair', 'anguish', 'pain', 'hurt', 'suffering',
      'regret', 'remorse', 'guilt', 'shame', 'burden', 'heavy', 'dark'
    ];

    sadnessWords.forEach(word => {
      this.emotionLexicon.set(word, { emotion: 'sadness', intensity: 0.8 });
    });

    // Anger lexicon
    const angerWords = [
      'angry', 'furious', 'rage', 'hostile', 'irritated', 'annoyed', 'outraged',
      'mad', 'livid', 'enraged', 'irate', 'incensed', 'wrathful', 'fuming',
      'aggravated', 'frustrated', 'exasperated', 'indignant', 'resentful', 'bitter',
      'hatred', 'hate', 'loathe', 'despise', 'disgusted', 'revolted', 'appalled',
      'offended', 'insulted', 'provoked', 'triggered', 'agitated', 'upset',
      'pissed', 'ticked', 'steamed', 'boiling', 'seething', 'explosive'
    ];

    angerWords.forEach(word => {
      this.emotionLexicon.set(word, { emotion: 'anger', intensity: 0.8 });
    });

    // Fear lexicon
    const fearWords = [
      'afraid', 'terrified', 'anxious', 'worried', 'nervous', 'scared', 'frightened',
      'fearful', 'panicked', 'horrified', 'petrified', 'trembling', 'shaking',
      'paranoid', 'concerned', 'uneasy', 'apprehensive', 'dreadful', 'ominous',
      'threatening', 'dangerous', 'risky', 'uncertain', 'insecure', 'vulnerable',
      'stressed', 'tense', 'overwhelmed', 'panic', 'terror', 'horror', 'nightmare',
      'phobia', 'anxiety', 'stress', 'pressure', 'burden', 'threat'
    ];

    fearWords.forEach(word => {
      this.emotionLexicon.set(word, { emotion: 'fear', intensity: 0.8 });
    });

    // Surprise lexicon
    const surpriseWords = [
      'surprised', 'shocked', 'astonished', 'amazed', 'stunned', 'startled',
      'bewildered', 'perplexed', 'confused', 'puzzled', 'baffled', 'mystified',
      'unexpected', 'sudden', 'abrupt', 'unforeseen', 'remarkable', 'extraordinary',
      'incredible', 'unbelievable', 'astounding', 'mind-blowing', 'wow', 'whoa',
      'gasped', 'speechless', 'thunderstruck', 'flabbergasted', 'dumbfounded'
    ];

    surpriseWords.forEach(word => {
      this.emotionLexicon.set(word, { emotion: 'surprise', intensity: 0.7 });
    });

    // Anticipation lexicon
    const anticipationWords = [
      'excited', 'eager', 'hopeful', 'optimistic', 'expecting', 'anticipating',
      'looking forward', 'awaiting', 'prepared', 'ready', 'planning', 'future',
      'tomorrow', 'soon', 'upcoming', 'approaching', 'imminent', 'pending',
      'prospect', 'possibility', 'potential', 'opportunity', 'chance', 'maybe',
      'curious', 'interested', 'intrigued', 'wondering', 'expectant'
    ];

    anticipationWords.forEach(word => {
      this.emotionLexicon.set(word, { emotion: 'anticipation', intensity: 0.6 });
    });

    // Negation words
    const negations = [
      'not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere',
      'neither', 'nor', 'without', 'barely', 'hardly', 'scarcely', 'seldom'
    ];

    negations.forEach(word => this.negationWords.add(word));

    // Intensifier words with their multiplier values
    const intensifiers = new Map([
      ['very', 1.5], ['extremely', 2.0], ['incredibly', 1.8], ['absolutely', 1.7],
      ['completely', 1.6], ['totally', 1.5], ['really', 1.3], ['quite', 1.2],
      ['rather', 1.1], ['somewhat', 0.8], ['slightly', 0.6], ['barely', 0.4],
      ['utterly', 1.9], ['exceptionally', 1.8], ['remarkably', 1.6], ['particularly', 1.4]
    ]);

    this.intensifierWords = intensifiers;
  }

  analyze(text: string, emojiInfluence: number = 0): SentimentAnalysis {
    const words = this.tokenizeText(text);
    const emotionScores = this.calculateEmotionScores(words);
    
    // Apply emoji influence if present
    if (emojiInfluence > 0) {
      this.applyEmojiInfluence(emotionScores, emojiInfluence);
    }

    const dominant = this.findDominantEmotion(emotionScores);
    const { valence, arousal } = this.calculateDimensions(emotionScores);
    const intensity = this.calculateIntensity(emotionScores, dominant);

    return {
      scores: emotionScores,
      dominant,
      intensity,
      valence,
      arousal
    };
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private calculateEmotionScores(words: string[]): EmotionScores {
    const scores: EmotionScores = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      anticipation: 0
    };

    let totalEmotionalWords = 0;
    let negationActive = false;
    let currentIntensifier = 1.0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Check for negation
      if (this.negationWords.has(word)) {
        negationActive = true;
        continue;
      }

      // Check for intensifiers
      if (this.intensifierWords.has(word)) {
        currentIntensifier = this.intensifierWords.get(word) || 1.0;
        continue;
      }

      // Check for emotional content
      const emotionData = this.emotionLexicon.get(word);
      if (emotionData) {
        let intensity = emotionData.intensity * currentIntensifier;
        
        // Apply negation by inverting the emotion
        if (negationActive) {
          intensity *= -0.5; // Reduce and invert
          negationActive = false;
        }

        scores[emotionData.emotion] += intensity;
        totalEmotionalWords++;
      }

      // Reset intensifier after processing word
      currentIntensifier = 1.0;
    }

    // Normalize scores
    if (totalEmotionalWords > 0) {
      Object.keys(scores).forEach(emotion => {
        scores[emotion as keyof EmotionScores] = Math.max(0, 
          scores[emotion as keyof EmotionScores] / totalEmotionalWords
        );
      });
    }

    return scores;
  }

  private applyEmojiInfluence(scores: EmotionScores, influence: number): void {
    // Amplify positive emotions if positive emojis are present
    if (influence > 0) {
      scores.joy = Math.min(1, scores.joy + influence * 0.3);
      scores.anticipation = Math.min(1, scores.anticipation + influence * 0.2);
    } else if (influence < 0) {
      // Amplify negative emotions if negative emojis are present
      scores.sadness = Math.min(1, scores.sadness + Math.abs(influence) * 0.3);
      scores.fear = Math.min(1, scores.fear + Math.abs(influence) * 0.2);
    }
  }

  findDominantEmotion(scores: EmotionScores): DominantEmotion {
    let maxScore = 0;
    let dominantEmotion: keyof EmotionScores = 'joy';

    Object.entries(scores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion as keyof EmotionScores;
      }
    });

    // Calculate confidence based on the gap between dominant and second-highest
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const confidence = sortedScores.length > 1 ? 
      (sortedScores[0] - sortedScores[1]) / (sortedScores[0] || 1) : 1;

    return {
      emotion: dominantEmotion,
      score: maxScore,
      confidence: Math.min(1, confidence)
    };
  }

  private calculateDimensions(scores: EmotionScores): { valence: number; arousal: number } {
    // Valence: how positive/negative (-1 to +1)
    const positive = scores.joy + scores.anticipation + scores.surprise * 0.5;
    const negative = scores.sadness + scores.anger + scores.fear;
    const valence = (positive - negative) / Math.max(positive + negative, 1);

    // Arousal: how activated/calm (0 to 1)
    const highArousal = scores.anger + scores.fear + scores.surprise + scores.joy * 0.7;
    const lowArousal = scores.sadness + scores.anticipation * 0.3;
    const arousal = highArousal / Math.max(highArousal + lowArousal, 1);

    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal))
    };
  }

  private calculateIntensity(scores: EmotionScores, dominant: DominantEmotion): number {
    // Calculate overall emotional intensity
    const totalEmotionalContent = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const dominantWeight = dominant.score * 2; // Give extra weight to dominant emotion
    
    return Math.min(1, (totalEmotionalContent + dominantWeight) / 3);
  }

  // Extract and analyze emoji emotions
  extractEmojiData(text: string): EmojiData[] {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis: EmojiData[] = [];
    let match;

    while ((match = emojiRegex.exec(text)) !== null) {
      const emoji = match[0];
      const position = match.index;
      const emotionData = this.getEmojiEmotion(emoji);
      
      emojis.push({
        emoji,
        position,
        emotion: emotionData.emotion,
        intensity: emotionData.intensity
      });
    }

    return emojis;
  }

  private getEmojiEmotion(emoji: string): { emotion: keyof EmotionScores; intensity: number } {
    // Basic emoji emotion mapping
    const joyEmojis = ['😊', '😄', '😃', '😀', '🙂', '😌', '😍', '🥰', '😘', '😆', '😂', '🤣', '😇'];
    const sadnessEmojis = ['😢', '😭', '😞', '😔', '😟', '🙁', '☹️', '😕', '😿', '💔'];
    const angerEmojis = ['😠', '😡', '🤬', '😤', '👿', '💢'];
    const fearEmojis = ['😨', '😱', '😰', '😧', '😦', '😮', '😯', '🫨'];
    const surpriseEmojis = ['😲', '😳', '🤯', '😵', '🫢'];

    if (joyEmojis.includes(emoji)) return { emotion: 'joy', intensity: 0.8 };
    if (sadnessEmojis.includes(emoji)) return { emotion: 'sadness', intensity: 0.8 };
    if (angerEmojis.includes(emoji)) return { emotion: 'anger', intensity: 0.9 };
    if (fearEmojis.includes(emoji)) return { emotion: 'fear', intensity: 0.7 };
    if (surpriseEmojis.includes(emoji)) return { emotion: 'surprise', intensity: 0.6 };
    
    // Default to mild anticipation for unknown emojis
    return { emotion: 'anticipation', intensity: 0.3 };
  }

  // Calculate overall emoji influence on sentiment
  calculateEmojiInfluence(emojiData: EmojiData[]): number {
    if (emojiData.length === 0) return 0;

    let totalInfluence = 0;
    emojiData.forEach(emoji => {
      // Positive emotions contribute positively, negative contribute negatively
      const emotionPolarity = this.getEmotionPolarity(emoji.emotion);
      totalInfluence += emotionPolarity * emoji.intensity;
    });

    // Normalize by number of emojis
    return totalInfluence / emojiData.length;
  }

  private getEmotionPolarity(emotion: keyof EmotionScores): number {
    switch (emotion) {
      case 'joy': return 1.0;
      case 'anticipation': return 0.5;
      case 'surprise': return 0.2;
      case 'sadness': return -0.8;
      case 'anger': return -0.9;
      case 'fear': return -0.7;
      default: return 0;
    }
  }
}