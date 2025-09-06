import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { NodeSystem } from '../rendering/NodeSystem';
import type { AnalysisResult, Concept, EmotionScores } from '../types';

// Mock analysis result for testing
const mockAnalysisResult: AnalysisResult = {
  words: ['romeo', 'juliet', 'love', 'tragedy', 'death'],
  sentiment: {
    scores: {
      joy: 0.3,
      sadness: 0.8,
      anger: 0.2,
      fear: 0.4,
      surprise: 0.1,
      anticipation: 0.6
    },
    dominant: {
      emotion: 'sadness',
      score: 0.8,
      confidence: 0.85
    },
    intensity: 0.7,
    valence: -0.3,
    arousal: 0.6
  },
  concepts: [
    {
      word: 'love',
      category: 'emotion',
      relevance: 0.9,
      frequency: 3,
      position: [0, 5, 10],
      connections: ['romeo', 'juliet']
    },
    {
      word: 'romeo',
      category: 'people',
      relevance: 0.8,
      frequency: 2,
      position: [0, 15],
      connections: ['love', 'juliet']
    },
    {
      word: 'juliet',
      category: 'people',
      relevance: 0.8,
      frequency: 2,
      position: [1, 20],
      connections: ['love', 'romeo']
    }
  ],
  semanticGraph: {
    nodes: new Map([
      ['love', {
        id: 'love',
        concept: {
          word: 'love',
          category: 'emotion',
          relevance: 0.9,
          frequency: 3,
          position: [0, 5, 10],
          connections: ['romeo', 'juliet']
        },
        importance: 0.9,
        connections: ['romeo', 'juliet']
      }]
    ]),
    edges: new Map([
      ['love-romeo', {
        id: 'love-romeo',
        source: 'love',
        target: 'romeo',
        weight: 0.7,
        relationship: 'semantic'
      }]
    ]),
    clusters: []
  },
  complexity: {
    overallComplexity: 0.6,
    vocabularyDiversity: 0.7,
    sentenceComplexity: 0.5,
    conceptDensity: 0.8,
    emotionalComplexity: 0.4
  },
  scalingStrategy: {
    type: 'small_standard',
    multiplier: 1.2,
    nodeCount: 8,
    particleCount: 50,
    compressionLevel: 0.1
  },
  emojis: [],
  emojiInfluence: 0,
  timestamp: Date.now()
};

describe('NodeSystem', () => {
  let nodeGroup: THREE.Group;
  let connectionGroup: THREE.Group;
  let nodeSystem: NodeSystem;

  beforeEach(() => {
    nodeGroup = new THREE.Group();
    connectionGroup = new THREE.Group();
    nodeSystem = new NodeSystem(nodeGroup, connectionGroup);
  });

  describe('initialization', () => {
    it('should initialize with empty node and connection maps', () => {
      expect(nodeSystem.getNodeCount()).toBe(0);
      expect(nodeSystem.getConnectionCount()).toBe(0);
    });

    it('should have materials and geometries prepared', () => {
      // NodeSystem should initialize without throwing errors
      expect(nodeSystem).toBeDefined();
    });
  });

  describe('generateVisualization', () => {
    it('should generate nodes based on analysis result', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(visualization).toBeDefined();
      expect(visualization!.nodes.length).toBeGreaterThan(0);
      expect(visualization!.nodes.length).toBeLessThanOrEqual(mockAnalysisResult.scalingStrategy.nodeCount);
    });

    it('should create nodes from concepts', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      const conceptNodes = visualization!.nodes.filter(node => 
        mockAnalysisResult.concepts.some(concept => concept.word === node.data.word)
      );
      
      expect(conceptNodes.length).toBeGreaterThan(0);
    });

    it('should create emotion nodes when sentiment is strong', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      const emotionNodes = visualization!.nodes.filter(node => node.type === 'emotion');
      expect(emotionNodes.length).toBeGreaterThan(0);
    });

    it('should distribute nodes in 3D space', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      visualization!.nodes.forEach(node => {
        expect(node.position).toBeDefined();
        expect(node.position.x).toBeTypeOf('number');
        expect(node.position.y).toBeTypeOf('number');
        expect(node.position.z).toBeTypeOf('number');
      });
    });

    it('should create connections between related nodes', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(visualization!.connections.length).toBeGreaterThan(0);
      
      visualization!.connections.forEach(connection => {
        expect(connection.source).toBeDefined();
        expect(connection.target).toBeDefined();
        expect(connection.weight).toBeGreaterThan(0);
      });
    });
  });

  describe('node properties', () => {
    let visualization: any;

    beforeEach(() => {
      visualization = nodeSystem.generateVisualization(mockAnalysisResult);
    });

    it('should assign correct colors based on node type', () => {
      const emotionNodes = visualization.nodes.filter((node: any) => node.type === 'emotion');
      const conceptNodes = visualization.nodes.filter((node: any) => node.type === 'concept');
      
      emotionNodes.forEach((node: any) => {
        expect(node.color).toBeDefined();
        expect(node.color.r).toBeGreaterThanOrEqual(0);
        expect(node.color.g).toBeGreaterThanOrEqual(0);
        expect(node.color.b).toBeGreaterThanOrEqual(0);
      });

      conceptNodes.forEach((node: any) => {
        expect(node.color).toBeDefined();
      });
    });

    it('should assign sizes based on importance', () => {
      visualization.nodes.forEach((node: any) => {
        expect(node.size).toBeGreaterThan(0);
        expect(node.size).toBeLessThanOrEqual(2.0);
        
        // More important nodes should be larger
        if (node.importance > 0.8) {
          expect(node.size).toBeGreaterThan(1.0);
        }
      });
    });

    it('should set activation levels appropriately', () => {
      visualization.nodes.forEach((node: any) => {
        expect(node.activation).toBeGreaterThanOrEqual(0);
        expect(node.activation).toBeLessThanOrEqual(1);
        expect(node.targetActivation).toBeGreaterThanOrEqual(0);
        expect(node.targetActivation).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('scaling system', () => {
    it('should respect target node count from scaling strategy', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      // Should generate approximately the target number of nodes
      expect(visualization!.nodes.length).toBeLessThanOrEqual(mockAnalysisResult.scalingStrategy.nodeCount + 2);
      expect(visualization!.nodes.length).toBeGreaterThanOrEqual(mockAnalysisResult.scalingStrategy.nodeCount - 2);
    });

    it('should generate synthetic nodes to reach target count', () => {
      // Test with a strategy that requires more nodes than concepts
      const largeScaleResult = {
        ...mockAnalysisResult,
        scalingStrategy: {
          ...mockAnalysisResult.scalingStrategy,
          nodeCount: 15 // More than available concepts
        }
      };

      const visualization = nodeSystem.generateVisualization(largeScaleResult);
      
      const syntheticNodes = visualization!.nodes.filter(node => node.synthetic);
      expect(syntheticNodes.length).toBeGreaterThan(0);
    });
  });

  describe('performance metrics', () => {
    it('should calculate compression ratio correctly', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      const expectedRatio = visualization!.nodes.length / mockAnalysisResult.words.length;
      expect(visualization!.scalingInfo.compressionRatio).toBeCloseTo(expectedRatio, 3);
    });

    it('should estimate performance metrics', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(visualization!.performanceProfile.expectedFPS).toBeGreaterThan(0);
      expect(visualization!.performanceProfile.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(visualization!.performanceProfile.gpuLoad).toBeGreaterThanOrEqual(0);
      expect(visualization!.performanceProfile.gpuLoad).toBeLessThanOrEqual(1);
    });

    it('should track processing time', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(visualization!.scalingInfo.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Three.js integration', () => {
    it('should add node objects to the scene', () => {
      const initialChildren = nodeGroup.children.length;
      
      nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(nodeGroup.children.length).toBeGreaterThan(initialChildren);
    });

    it('should add connection objects to the scene', () => {
      const initialChildren = connectionGroup.children.length;
      
      nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(connectionGroup.children.length).toBeGreaterThanOrEqual(initialChildren);
    });

    it('should create meshes with proper materials and geometries', () => {
      nodeSystem.generateVisualization(mockAnalysisResult);
      
      nodeGroup.children.forEach(child => {
        expect(child).toBeInstanceOf(THREE.Mesh);
        const mesh = child as THREE.Mesh;
        expect(mesh.material).toBeDefined();
        expect(mesh.geometry).toBeDefined();
      });
    });
  });

  describe('update and animation', () => {
    it('should update node animations', () => {
      const visualization = nodeSystem.generateVisualization(mockAnalysisResult);
      const initialLifetime = visualization!.nodes[0].lifetime;
      
      // Simulate animation update
      nodeSystem.update(0.016); // 60 FPS delta
      
      expect(visualization!.nodes[0].lifetime).toBeGreaterThanOrEqual(initialLifetime);
    });
  });

  describe('cleanup', () => {
    it('should clear all nodes and connections', () => {
      nodeSystem.generateVisualization(mockAnalysisResult);
      
      expect(nodeGroup.children.length).toBeGreaterThan(0);
      
      nodeSystem.clearVisualization();
      
      expect(nodeGroup.children.length).toBe(0);
      expect(connectionGroup.children.length).toBe(0);
      expect(nodeSystem.getNodeCount()).toBe(0);
      expect(nodeSystem.getConnectionCount()).toBe(0);
    });

    it('should dispose resources properly', () => {
      nodeSystem.generateVisualization(mockAnalysisResult);
      
      // Should not throw errors
      expect(() => nodeSystem.dispose()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty analysis result', () => {
      const emptyResult: AnalysisResult = {
        ...mockAnalysisResult,
        words: [],
        concepts: [],
        scalingStrategy: {
          ...mockAnalysisResult.scalingStrategy,
          nodeCount: 0
        }
      };

      const visualization = nodeSystem.generateVisualization(emptyResult);
      expect(visualization!.nodes.length).toBe(0);
    });

    it('should handle very large node counts', () => {
      const largeResult: AnalysisResult = {
        ...mockAnalysisResult,
        scalingStrategy: {
          ...mockAnalysisResult.scalingStrategy,
          nodeCount: 500
        }
      };

      const visualization = nodeSystem.generateVisualization(largeResult);
      expect(visualization!.nodes.length).toBeLessThanOrEqual(500);
      expect(visualization!.performanceProfile.gpuLoad).toBeLessThanOrEqual(1);
    });
  });
});