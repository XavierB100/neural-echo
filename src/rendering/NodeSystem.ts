import * as THREE from 'three';
import type {
  AnalysisResult,
  Node,
  NodeData,
  NodeType,
  Connection,
  Concept,
  EmotionScores,
  ConceptCategory,
  NodeDistribution,
  ScaledVisualization
} from '../types';

/**
 * NodeSystem - Converts AI analysis results into 3D visual nodes
 * Handles node generation, positioning, and lifecycle management
 */
export class NodeSystem {
  private nodes: Map<string, Node> = new Map();
  private nodeObjects: Map<string, THREE.Mesh> = new Map();
  private connections: Map<string, Connection> = new Map();
  private connectionObjects: Map<string, THREE.Line> = new Map();
  
  // Materials for different node types
  private materials: Map<NodeType, THREE.MeshPhongMaterial> = new Map();
  private geometries: Map<string, THREE.BufferGeometry> = new Map();
  
  // Scene groups (managed by NeuralRenderer)
  private nodeGroup: THREE.Group;
  private connectionGroup: THREE.Group;
  
  // Animation
  private clock: THREE.Clock = new THREE.Clock();
  
  constructor(nodeGroup: THREE.Group, connectionGroup: THREE.Group) {
    this.nodeGroup = nodeGroup;
    this.connectionGroup = connectionGroup;
    this.initializeMaterials();
    this.initializeGeometries();
    
    console.log('🧠 NodeSystem initialized');
  }

  private initializeMaterials(): void {
    // Emotion nodes - warm, pulsing materials
    this.materials.set('emotion', new THREE.MeshPhongMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.8,
      emissive: 0x220000,
      shininess: 100
    }));

    // Concept nodes - cool, analytical materials  
    this.materials.set('concept', new THREE.MeshPhongMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.7,
      emissive: 0x002222,
      shininess: 80
    }));

    // Synthetic nodes - neutral, supporting materials
    this.materials.set('synthetic', new THREE.MeshPhongMaterial({
      color: 0x95a5a6,
      transparent: true,
      opacity: 0.5,
      emissive: 0x111111,
      shininess: 50
    }));

    // Temporal nodes - time-based, flowing materials
    this.materials.set('temporal', new THREE.MeshPhongMaterial({
      color: 0xf39c12,
      transparent: true,
      opacity: 0.6,
      emissive: 0x221100,
      shininess: 60
    }));

    // Social nodes - interpersonal, connecting materials
    this.materials.set('social', new THREE.MeshPhongMaterial({
      color: 0xe74c3c,
      transparent: true,
      opacity: 0.7,
      emissive: 0x220011,
      shininess: 90
    }));
  }

  private initializeGeometries(): void {
    // Primary sphere for most nodes
    this.geometries.set('sphere', new THREE.SphereGeometry(1, 16, 16));
    
    // Octahedron for emotion nodes
    this.geometries.set('octahedron', new THREE.OctahedronGeometry(1, 1));
    
    // Box for concept nodes
    this.geometries.set('box', new THREE.BoxGeometry(1.5, 1.5, 1.5));
    
    // Tetrahedron for synthetic nodes
    this.geometries.set('tetrahedron', new THREE.TetrahedronGeometry(1, 0));
    
    // Cylinder for temporal nodes
    this.geometries.set('cylinder', new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8));
  }

  /**
   * Generate complete visualization from analysis result
   */
  generateVisualization(analysisResult: AnalysisResult): ScaledVisualization {
    console.log('🎨 Generating visualization for', analysisResult.scalingStrategy.nodeCount, 'nodes');

    // Clear existing visualization
    this.clearVisualization();

    // Generate nodes from concepts and emotions
    const nodes = this.generateNodes(analysisResult);
    
    // Generate connections based on semantic graph
    const connections = this.generateConnections(analysisResult, nodes);
    
    // Create 3D objects
    this.createNodeObjects(nodes);
    this.createConnectionObjects(connections);
    
    // Position nodes using intelligent distribution
    this.distributeNodes(nodes, analysisResult.scalingStrategy.nodeCount);
    
    const visualization: ScaledVisualization = {
      nodes,
      connections,
      particles: [], // TODO: Implement particle system
      scalingInfo: {
        originalWordCount: analysisResult.words.length,
        finalNodeCount: nodes.length,
        compressionRatio: nodes.length / analysisResult.words.length,
        strategy: analysisResult.scalingStrategy.type,
        processingTime: Date.now() - analysisResult.timestamp
      },
      performanceProfile: {
        expectedFPS: 60,
        memoryUsage: this.estimateMemoryUsage(nodes.length),
        gpuLoad: this.estimateGPULoad(nodes.length)
      }
    };

    console.log('✅ Visualization generated:', {
      nodes: nodes.length,
      connections: connections.length,
      strategy: analysisResult.scalingStrategy.type
    });

    return visualization;
  }

  private generateNodes(analysisResult: AnalysisResult): Node[] {
    const nodes: Node[] = [];
    const targetNodeCount = analysisResult.scalingStrategy.nodeCount;
    const distribution = this.calculateNodeDistribution(targetNodeCount);
    
    // Generate primary nodes from top concepts
    const primaryConcepts = analysisResult.concepts
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, distribution.primary);
    
    primaryConcepts.forEach((concept, index) => {
      nodes.push(this.createNodeFromConcept(concept, 'concept', 1.0 - (index / primaryConcepts.length) * 0.3));
    });

    // Generate emotion nodes based on sentiment analysis
    if (analysisResult.sentiment.dominant.confidence > 0.3) {
      nodes.push(this.createEmotionNode(analysisResult.sentiment, 0.9));
    }

    // Generate secondary nodes from remaining concepts
    const secondaryConcepts = analysisResult.concepts
      .slice(distribution.primary)
      .slice(0, distribution.secondary);
    
    secondaryConcepts.forEach((concept, index) => {
      nodes.push(this.createNodeFromConcept(concept, 'concept', 0.7 - (index / secondaryConcepts.length) * 0.2));
    });

    // Generate synthetic nodes to reach target count
    const remainingCount = targetNodeCount - nodes.length;
    if (remainingCount > 0) {
      const syntheticNodes = this.generateSyntheticNodes(remainingCount, analysisResult);
      nodes.push(...syntheticNodes);
    }

    return nodes.slice(0, targetNodeCount); // Ensure exact count
  }

  private createNodeFromConcept(concept: Concept, nodeType: NodeType, importance: number): Node {
    const nodeId = `concept_${concept.word}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: nodeId,
      position: new THREE.Vector3(0, 0, 0), // Will be positioned later
      activation: Math.random() * 0.5 + 0.3, // Initial activation 0.3-0.8
      targetActivation: concept.relevance,
      color: this.getColorForConcept(concept),
      size: this.getSizeForImportance(importance),
      type: nodeType,
      connections: [],
      synthetic: false,
      lifetime: 0,
      importance,
      data: {
        word: concept.word,
        concept,
        relevance: concept.relevance,
        layer: this.getLayerForCategory(concept.category)
      }
    };
  }

  private createEmotionNode(sentiment: any, importance: number): Node {
    const nodeId = `emotion_${sentiment.dominant.emotion}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: nodeId,
      position: new THREE.Vector3(0, 0, 0),
      activation: sentiment.intensity,
      targetActivation: sentiment.dominant.score,
      color: this.getColorForEmotion(sentiment.dominant.emotion),
      size: Math.min(this.getSizeForImportance(importance) * 1.2, 2.0), // Emotion nodes slightly larger but capped
      type: 'emotion',
      connections: [],
      synthetic: false,
      lifetime: 0,
      importance,
      data: {
        word: sentiment.dominant.emotion,
        emotion: sentiment.dominant.emotion,
        relevance: sentiment.dominant.score,
        layer: 0 // Emotions at center layer
      }
    };
  }

  private generateSyntheticNodes(count: number, analysisResult: AnalysisResult): Node[] {
    const syntheticNodes: Node[] = [];
    
    for (let i = 0; i < count; i++) {
      const nodeId = `synthetic_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      syntheticNodes.push({
        id: nodeId,
        position: new THREE.Vector3(0, 0, 0),
        activation: Math.random() * 0.3 + 0.1, // Lower activation for synthetic
        targetActivation: Math.random() * 0.4 + 0.1,
        color: new THREE.Color(0x95a5a6),
        size: this.getSizeForImportance(0.3), // Smaller synthetic nodes
        type: 'synthetic',
        connections: [],
        synthetic: true,
        lifetime: 0,
        importance: 0.2 + Math.random() * 0.3,
        data: {
          word: `synthetic_${i}`,
          relevance: 0.1 + Math.random() * 0.2,
          layer: 2 // Outer layer
        }
      });
    }

    return syntheticNodes;
  }

  private generateConnections(analysisResult: AnalysisResult, nodes: Node[]): Connection[] {
    const connections: Connection[] = [];
    
    // Create connections based on semantic graph
    analysisResult.semanticGraph.edges.forEach((edge) => {
      const sourceNode = nodes.find(n => n.data.word === edge.source);
      const targetNode = nodes.find(n => n.data.word === edge.target);
      
      if (sourceNode && targetNode) {
        const connectionId = `conn_${sourceNode.id}_${targetNode.id}`;
        
        connections.push({
          id: connectionId,
          source: sourceNode.id,
          target: targetNode.id,
          weight: edge.weight,
          type: edge.relationship === 'semantic' ? 'semantic' : 'emotional',
          active: edge.weight > 0.3,
          flow: edge.weight,
          color: this.getColorForConnectionType(edge.relationship as any)
        });
      }
    });

    return connections;
  }

  private createNodeObjects(nodes: Node[]): void {
    nodes.forEach(node => {
      const geometry = this.getGeometryForNodeType(node.type);
      const material = this.materials.get(node.type)!.clone();
      
      // Customize material based on node data
      material.color = node.color;
      material.opacity = 0.5 + (node.importance * 0.4); // More important = more opaque
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(node.position);
      mesh.scale.setScalar(node.size);
      
      // Store node data for animations
      mesh.userData = {
        nodeId: node.id,
        node: node,
        animate: (deltaTime: number) => {
          this.animateNode(mesh, node, deltaTime);
        }
      };
      
      this.nodeObjects.set(node.id, mesh);
      this.nodeGroup.add(mesh);
    });
  }

  private createConnectionObjects(connections: Connection[]): void {
    connections.forEach(connection => {
      if (!connection.active) return;
      
      const sourceObj = this.nodeObjects.get(connection.source);
      const targetObj = this.nodeObjects.get(connection.target);
      
      if (sourceObj && targetObj) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          sourceObj.position,
          targetObj.position
        ]);
        
        const material = new THREE.LineBasicMaterial({
          color: connection.color,
          transparent: true,
          opacity: connection.weight * 0.5
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = {
          connectionId: connection.id,
          connection: connection
        };
        
        this.connectionObjects.set(connection.id, line);
        this.connectionGroup.add(line);
      }
    });
  }

  private distributeNodes(nodes: Node[], targetCount: number): void {
    // Spherical distribution with layered organization
    const radius = Math.max(10, targetCount / 10); // Scale radius with node count
    
    nodes.forEach((node, index) => {
      const layer = node.data.layer || 0;
      const layerRadius = radius * (0.3 + layer * 0.4);
      
      // Fibonacci spiral distribution for even spacing
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const angle = 2 * Math.PI * index / goldenRatio;
      const y = 1 - (index / (nodes.length - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      
      node.position.set(
        Math.cos(angle) * radiusAtY * layerRadius,
        y * layerRadius * 0.5,
        Math.sin(angle) * radiusAtY * layerRadius
      );
      
      // Update mesh position if it exists
      const mesh = this.nodeObjects.get(node.id);
      if (mesh) {
        mesh.position.copy(node.position);
      }
    });
  }

  private animateNode(mesh: THREE.Mesh, node: Node, deltaTime: number): void {
    // Smooth activation interpolation
    node.activation = THREE.MathUtils.lerp(node.activation, node.targetActivation, deltaTime * 2);
    
    // Pulsing effect based on activation
    const pulse = 1 + Math.sin(node.lifetime * 3) * 0.1 * node.activation;
    mesh.scale.setScalar(node.size * pulse);
    
    // Gentle floating animation
    const floatOffset = Math.sin(node.lifetime * 1.5 + node.position.x) * 0.2;
    mesh.position.y = node.position.y + floatOffset;
    
    // Update material opacity based on activation
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.opacity = 0.3 + (node.activation * 0.6);
    material.emissiveIntensity = node.activation * 0.3;
    
    node.lifetime += deltaTime;
  }

  // Helper methods for node properties
  private getColorForConcept(concept: Concept): THREE.Color {
    const categoryColors: Record<ConceptCategory, number> = {
      emotion: 0xff6b6b,
      time: 0xf39c12,
      people: 0xe74c3c,
      places: 0x27ae60,
      actions: 0x3498db,
      abstract: 0x9b59b6,
      objects: 0x34495e
    };
    
    return new THREE.Color(categoryColors[concept.category] || 0x95a5a6);
  }

  private getColorForEmotion(emotion: keyof EmotionScores): THREE.Color {
    const emotionColors: Record<keyof EmotionScores, number> = {
      joy: 0xf1c40f,
      sadness: 0x3498db,
      anger: 0xe74c3c,
      fear: 0x8e44ad,
      surprise: 0xe67e22,
      anticipation: 0x2ecc71
    };
    
    return new THREE.Color(emotionColors[emotion]);
  }

  private getSizeForImportance(importance: number): number {
    return 0.5 + importance * 1.5; // Size range: 0.5 - 2.0
  }

  private getLayerForCategory(category: ConceptCategory): number {
    const layerMap: Record<ConceptCategory, number> = {
      emotion: 0,    // Center
      people: 0,     // Center  
      time: 1,       // Mid
      actions: 1,    // Mid
      places: 1,     // Mid
      abstract: 2,   // Outer
      objects: 2     // Outer
    };
    
    return layerMap[category] || 1;
  }

  private getGeometryForNodeType(type: NodeType): THREE.BufferGeometry {
    const geometryMap: Record<NodeType, string> = {
      emotion: 'octahedron',
      concept: 'box',
      synthetic: 'tetrahedron',
      temporal: 'cylinder',
      social: 'sphere'
    };
    
    return this.geometries.get(geometryMap[type]) || this.geometries.get('sphere')!;
  }

  private getColorForConnectionType(type: string): THREE.Color {
    const colorMap: Record<string, number> = {
      semantic: 0x4ecdc4,
      emotional: 0xff6b6b,
      temporal: 0xf39c12,
      contextual: 0x95a5a6
    };
    
    return new THREE.Color(colorMap[type] || 0x95a5a6);
  }

  private calculateNodeDistribution(totalNodes: number): NodeDistribution {
    return {
      primary: Math.floor(totalNodes * 0.3),      // 30%
      secondary: Math.floor(totalNodes * 0.4),    // 40%
      tertiary: Math.floor(totalNodes * 0.2),     // 20%
      environmental: Math.floor(totalNodes * 0.1)  // 10%
    };
  }

  private estimateMemoryUsage(nodeCount: number): number {
    // Rough estimate: each node ~1KB of GPU memory
    return nodeCount * 0.001; // MB
  }

  private estimateGPULoad(nodeCount: number): number {
    // Estimate GPU load as percentage (0-1)
    return Math.min(nodeCount / 1000, 0.8); // Max 80% load
  }

  /**
   * Clear all visualization objects
   */
  clearVisualization(): void {
    this.nodes.clear();
    this.connections.clear();
    
    // Remove all objects from scene
    this.nodeObjects.forEach(mesh => {
      this.nodeGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    
    this.connectionObjects.forEach(line => {
      this.connectionGroup.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    
    this.nodeObjects.clear();
    this.connectionObjects.clear();
  }

  /**
   * Update all nodes and connections
   */
  update(deltaTime: number): void {
    this.nodes.forEach(node => {
      const mesh = this.nodeObjects.get(node.id);
      if (mesh) {
        this.animateNode(mesh, node, deltaTime);
      }
    });

    // Update connections dynamically
    this.connectionObjects.forEach((line, connectionId) => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        const sourceObj = this.nodeObjects.get(connection.source);
        const targetObj = this.nodeObjects.get(connection.target);
        
        if (sourceObj && targetObj) {
          const positions = line.geometry.attributes.position as THREE.BufferAttribute;
          positions.setXYZ(0, sourceObj.position.x, sourceObj.position.y, sourceObj.position.z);
          positions.setXYZ(1, targetObj.position.x, targetObj.position.y, targetObj.position.z);
          positions.needsUpdate = true;
        }
      }
    });
  }

  // Getters
  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  // Cleanup
  dispose(): void {
    console.log('🧹 Disposing NodeSystem...');
    
    this.clearVisualization();
    
    // Dispose materials
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
    
    // Dispose geometries
    this.geometries.forEach(geometry => geometry.dispose());
    this.geometries.clear();
    
    console.log('✅ NodeSystem disposed');
  }
}