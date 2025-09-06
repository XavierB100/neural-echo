import { useEffect, useRef, useState, useCallback } from 'react';
import { TextAnalyzer } from '../ai/TextAnalyzer';
import { NeuralRenderer } from '../rendering/NeuralRenderer';
import type {
  AnalysisResult,
  PerformanceMetrics,
  NeuralEchoError
} from '../types';
import './App.css';

interface AppState {
  isInitialized: boolean;
  isAnalyzing: boolean;
  currentText: string;
  analysisResult: AnalysisResult | null;
  performanceMetrics: PerformanceMetrics | null;
  error: NeuralEchoError | null;
  renderingMode: 'webgpu' | 'webgl' | 'canvas2d';
}

export function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textAnalyzer = useRef<TextAnalyzer | null>(null);
  const neuralRenderer = useRef<NeuralRenderer | null>(null);
  const [state, setState] = useState<AppState>({
    isInitialized: false,
    isAnalyzing: false,
    currentText: '',
    analysisResult: null,
    performanceMetrics: null,
    error: null,
    renderingMode: 'webgpu'
  });

  // Initialize the application
  useEffect(() => {
    initializeApp();
    return () => cleanup();
  }, []);

  // Performance metrics update loop
  useEffect(() => {
    if (!state.isInitialized) return;

    const metricsInterval = setInterval(() => {
      if (neuralRenderer.current) {
        const metrics = neuralRenderer.current.getPerformanceMetrics();
        setState(prev => ({ ...prev, performanceMetrics: metrics }));
      }
    }, 1000);

    return () => clearInterval(metricsInterval);
  }, [state.isInitialized]);

  const initializeApp = async (): Promise<void> => {
    console.log('🚀 Initializing Neural Echo...');
    
    try {
      // Initialize text analyzer
      textAnalyzer.current = new TextAnalyzer();
      console.log('✅ Text analyzer initialized');

      // Initialize neural renderer
      if (canvasContainerRef.current) {
        neuralRenderer.current = new NeuralRenderer();
        await neuralRenderer.current.initialize(canvasContainerRef.current);
        
        const renderingMode = neuralRenderer.current.getRenderingMode();
        console.log('✅ Neural renderer initialized with', renderingMode);
        
        // Start rendering loop
        neuralRenderer.current.startRendering();
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          renderingMode,
          error: null
        }));
        
        console.log('🎉 Neural Echo initialization complete!');
      } else {
        throw new Error('Canvas container not found');
      }
    } catch (error) {
      console.error('💥 Failed to initialize Neural Echo:', error);
      setState(prev => ({
        ...prev,
        error: error as NeuralEchoError,
        isInitialized: false
      }));
    }
  };

  const cleanup = (): void => {
    if (neuralRenderer.current) {
      neuralRenderer.current.dispose();
    }
    if (textAnalyzer.current) {
      textAnalyzer.current.clearCache();
    }
  };

  const handleTextChange = useCallback(async (text: string): Promise<void> => {
    if (!textAnalyzer.current || !neuralRenderer.current) return;

    setState(prev => ({
      ...prev,
      currentText: text,
      isAnalyzing: true,
      error: null
    }));

    try {
      if (text.trim().length === 0) {
        // Clear visualization for empty text
        neuralRenderer.current.clearScene();
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          analysisResult: null
        }));
        return;
      }

      console.log(`🧠 Analyzing text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      // Analyze text with debouncing for real-time input
      const analysisResult = await textAnalyzer.current.analyzeDebounced(text, 500);
      
      console.log('📊 Analysis complete:', {
        wordCount: analysisResult.words.length,
        nodeCount: analysisResult.scalingStrategy.nodeCount,
        particleCount: analysisResult.scalingStrategy.particleCount,
        strategy: analysisResult.scalingStrategy.type,
        dominantEmotion: analysisResult.sentiment.dominant.emotion
      });

      // Generate and render neural visualization from analysis result
      console.log('🎨 Generating neural network visualization...');
      const visualization = neuralRenderer.current.generateVisualization(analysisResult);
      
      if (visualization) {
        console.log('✅ Visualization rendered successfully:', {
          actualNodes: visualization.nodes.length,
          connections: visualization.connections.length,
          compressionRatio: visualization.scalingInfo.compressionRatio.toFixed(3),
          processingTime: `${visualization.scalingInfo.processingTime}ms`
        });
      } else {
        console.warn('⚠️ Failed to generate visualization');
      }

      setState(prev => ({
        ...prev,
        analysisResult,
        isAnalyzing: false
      }));

    } catch (error) {
      console.error('💥 Text analysis failed:', error);
      setState(prev => ({
        ...prev,
        error: error as NeuralEchoError,
        isAnalyzing: false
      }));
    }
  }, []);

  const formatPerformanceMetrics = (metrics: PerformanceMetrics | null): string => {
    if (!metrics) return 'Initializing...';
    
    return `FPS: ${metrics.frameRate} | Memory: ${Math.round(metrics.memoryUsage)}MB | Nodes: ${metrics.nodeCount} | Particles: ${metrics.particleCount}`;
  };

  const getStatusColor = (): string => {
    if (state.error) return '#ff4444';
    if (!state.isInitialized) return '#ffaa44';
    if (state.isAnalyzing) return '#44aaff';
    return '#44ff44';
  };

  const getStatusText = (): string => {
    if (state.error) return `Error: ${state.error.message}`;
    if (!state.isInitialized) return 'Initializing...';
    if (state.isAnalyzing) return 'Analyzing...';
    return `Ready (${state.renderingMode.toUpperCase()})`;
  };

  return (
    <div className="neural-echo-app">
      <header className="app-header">
        <h1>Neural Echo</h1>
        <div className="app-subtitle">
          AI-Powered Text Visualization with Intelligent Scaling
        </div>
      </header>

      <main className="app-main">
        {/* Text Input Section */}
        <section className="input-section">
          <div className="input-container">
            <textarea
              className="text-input"
              placeholder="Enter your text here to see it come alive as a neural network..."
              value={state.currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              disabled={!state.isInitialized}
              rows={4}
            />
            <div className="input-info">
              <span className="word-count">
                Words: {state.currentText.trim().split(/\s+/).filter(w => w).length}
              </span>
              {state.analysisResult && (
                <span className="strategy-info">
                  Strategy: {state.analysisResult.scalingStrategy.type} 
                  ({state.analysisResult.scalingStrategy.nodeCount} nodes)
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Visualization Section */}
        <section className="visualization-section">
          <div 
            ref={canvasContainerRef} 
            className="canvas-container"
            style={{ 
              width: '100%', 
              height: '600px',
              border: '1px solid #333',
              borderRadius: '8px',
              backgroundColor: '#0a0a0a'
            }}
          >
            {!state.isInitialized && (
              <div className="initialization-overlay">
                <div className="loading-spinner"></div>
                <div>Initializing Neural Echo...</div>
              </div>
            )}
          </div>
        </section>

        {/* Analysis Results Section */}
        {state.analysisResult && (
          <section className="analysis-section">
            <h3>Analysis Results</h3>
            <div className="analysis-grid">
              <div className="analysis-card">
                <h4>Sentiment</h4>
                <div className="sentiment-info">
                  <strong>{state.analysisResult.sentiment.dominant.emotion}</strong>
                  <br />
                  Intensity: {Math.round(state.analysisResult.sentiment.intensity * 100)}%
                  <br />
                  Confidence: {Math.round(state.analysisResult.sentiment.dominant.confidence * 100)}%
                </div>
              </div>
              
              <div className="analysis-card">
                <h4>Complexity</h4>
                <div className="complexity-info">
                  Overall: {Math.round(state.analysisResult.complexity.overallComplexity * 100)}%
                  <br />
                  Vocabulary: {Math.round(state.analysisResult.complexity.vocabularyDiversity * 100)}%
                  <br />
                  Concepts: {Math.round(state.analysisResult.complexity.conceptDensity * 100)}%
                </div>
              </div>
              
              <div className="analysis-card">
                <h4>Scaling</h4>
                <div className="scaling-info">
                  Strategy: {state.analysisResult.scalingStrategy.type}
                  <br />
                  Nodes: {state.analysisResult.scalingStrategy.nodeCount}
                  <br />
                  Particles: {state.analysisResult.scalingStrategy.particleCount}
                </div>
              </div>
              
              <div className="analysis-card">
                <h4>Concepts</h4>
                <div className="concepts-info">
                  Total: {state.analysisResult.concepts.length}
                  <br />
                  Top: {state.analysisResult.concepts.slice(0, 3).map(c => c.word).join(', ')}
                  <br />
                  Emojis: {state.analysisResult.emojis.length}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Status Bar */}
      <footer className="app-footer">
        <div className="status-bar">
          <div className="status-indicator">
            <div 
              className="status-dot" 
              style={{ backgroundColor: getStatusColor() }}
            ></div>
            <span className="status-text">{getStatusText()}</span>
          </div>
          
          <div className="performance-metrics">
            {formatPerformanceMetrics(state.performanceMetrics)}
          </div>
          
          <div className="app-info">
            Neural Echo v1.0 - Phase 1 Foundation
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;