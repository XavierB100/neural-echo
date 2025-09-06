import * as THREE from 'three';
import { WebGPUManager, RendererFallbackManager } from '../core/WebGPUManager';
import type {
  PerformanceMetrics
} from '../types';

export class NeuralRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private webgpuManager: WebGPUManager | null = null;
  private fallbackManager: RendererFallbackManager;
  private renderingMode: 'webgpu' | 'webgl' | 'canvas2d' = 'webgpu';
  
  // Scene objects
  private nodeGroup: THREE.Group;
  private connectionGroup: THREE.Group;
  private particleGroup: THREE.Group;
  private backgroundGroup: THREE.Group;
  
  // Render targets
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private postProcessingEnabled = true;
  
  // Performance tracking
  private frameCount = 0;
  private lastFPSCheck = 0;
  private currentFPS = 60;
  
  // Animation
  private clock: THREE.Clock;
  private animationId: number | null = null;
  
  // Canvas and sizing
  private canvas: HTMLCanvasElement | null = null;
  private container: HTMLElement | null = null;
  private isResizing = false;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.clock = new THREE.Clock();
    this.fallbackManager = new RendererFallbackManager();
    
    // Initialize scene groups
    this.nodeGroup = new THREE.Group();
    this.connectionGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    this.backgroundGroup = new THREE.Group();
    
    this.scene.add(this.nodeGroup);
    this.scene.add(this.connectionGroup);
    this.scene.add(this.particleGroup);
    this.scene.add(this.backgroundGroup);
    
    // Initialize with placeholder renderer (will be replaced during init)
    this.renderer = new THREE.WebGLRenderer();
  }

  async initialize(container: HTMLElement): Promise<void> {
    console.log('🎬 Initializing Neural Renderer...');
    this.container = container;

    try {
      // Initialize rendering system with progressive fallback
      const fallbackResult = await this.fallbackManager.initializeRenderer();
      this.renderingMode = fallbackResult.mode;
      
      if (fallbackResult.error) {
        console.warn('⚠️ Renderer initialization with fallback warnings:', fallbackResult.error);
      }

      // Setup renderer based on fallback result
      await this.setupRenderer(container, fallbackResult);
      
      // Setup camera
      this.setupCamera(container);
      
      // Setup scene
      this.setupScene();
      
      // Setup lighting
      this.setupLighting();
      
      // Setup post-processing if supported
      if (this.renderingMode === 'webgpu' || this.renderingMode === 'webgl') {
        this.setupPostProcessing();
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log(`✅ Neural Renderer initialized successfully with ${this.renderingMode}`);
      
    } catch (error) {
      console.error('💥 Failed to initialize Neural Renderer:', error);
      throw error;
    }
  }

  private async setupRenderer(container: HTMLElement, fallbackResult: any): Promise<void> {
    // Clean up existing renderer
    if (this.renderer) {
      this.renderer.dispose();
    }

    switch (this.renderingMode) {
      case 'webgpu':
        await this.setupWebGPURenderer(container, fallbackResult.manager);
        break;
      case 'webgl':
        this.setupWebGLRenderer(container);
        break;
      case 'canvas2d':
        this.setupCanvas2DRenderer(container);
        break;
    }

    // Configure common renderer settings
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Enable shadows if supported
    if (this.renderingMode !== 'canvas2d') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  private async setupWebGPURenderer(container: HTMLElement, webgpuManager: WebGPUManager): Promise<void> {
    this.webgpuManager = webgpuManager;
    
    // Note: Three.js WebGPU renderer is still experimental
    // For now, we'll use WebGL renderer with WebGPU compute shaders for particles
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.createCanvas(container),
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.canvas = this.renderer.domElement;
    console.log('🚀 WebGPU-enhanced WebGL renderer initialized');
  }

  private setupWebGLRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.createCanvas(container),
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.canvas = this.renderer.domElement;
    console.log('🎮 WebGL renderer initialized');
  }

  private setupCanvas2DRenderer(container: HTMLElement): void {
    // For Canvas2D fallback, we'll create a minimal WebGL context
    // and handle 2D rendering separately if needed
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.createCanvas(container),
      antialias: false,
      alpha: false,
      powerPreference: 'low-power'
    });
    
    this.canvas = this.renderer.domElement;
    this.postProcessingEnabled = false;
    console.log('📐 Canvas2D fallback renderer initialized');
  }

  private createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    return canvas;
  }

  private setupCamera(container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    
    this.camera.fov = 75;
    this.camera.aspect = aspect;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    
    console.log('📷 Camera configured:', {
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      position: this.camera.position
    });
  }

  private setupScene(): void {
    // Scene background
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.001);
    
    // Scene user data for animations
    this.scene.userData = {
      time: 0,
      deltaTime: 0
    };
    
    console.log('🎭 Scene configured');
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    this.scene.add(directionalLight);
    
    // Additional point lights for neural activity
    const pointLight1 = new THREE.PointLight(0x4488ff, 0.5, 100);
    pointLight1.position.set(20, 20, 20);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff4488, 0.3, 80);
    pointLight2.position.set(-20, -10, 30);
    this.scene.add(pointLight2);
    
    console.log('💡 Lighting system configured');
  }

  private setupPostProcessing(): void {
    if (!this.postProcessingEnabled || !this.canvas) return;
    
    // Create render target for post-processing
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.canvas.width,
      this.canvas.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        colorSpace: THREE.SRGBColorSpace
      }
    );
    
    console.log('🎨 Post-processing configured');
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Window resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Visibility change listener for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseRendering();
      } else {
        this.resumeRendering();
      }
    });
    
    console.log('👂 Event listeners configured');
  }

  private handleResize(): void {
    if (!this.container || !this.canvas || this.isResizing) return;
    
    this.isResizing = true;
    
    // Debounce resize events
    setTimeout(() => {
      const rect = this.container!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Update camera aspect ratio
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      // Update renderer size
      this.renderer.setSize(width, height, false);
      
      // Update render target if exists
      if (this.renderTarget) {
        this.renderTarget.setSize(width, height);
      }
      
      console.log('📏 Renderer resized:', { width, height });
      this.isResizing = false;
    }, 100);
  }

  // Rendering methods
  startRendering(): void {
    if (this.animationId !== null) return;
    
    console.log('▶️ Starting render loop');
    this.renderLoop();
  }

  pauseRendering(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('⏸️ Rendering paused');
    }
  }

  resumeRendering(): void {
    if (this.animationId === null && !document.hidden) {
      console.log('▶️ Rendering resumed');
      this.renderLoop();
    }
  }

  stopRendering(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('⏹️ Rendering stopped');
    }
  }

  private renderLoop(): void {
    this.animationId = requestAnimationFrame(() => this.renderLoop());
    
    const deltaTime = this.clock.getDelta();
    this.scene.userData.time = this.clock.getElapsedTime();
    this.scene.userData.deltaTime = deltaTime;
    
    // Update scene animations
    this.updateAnimations(deltaTime);
    
    // Render scene
    this.render();
    
    // Track FPS
    this.trackFPS();
  }

  private updateAnimations(deltaTime: number): void {
    // Update node animations
    this.nodeGroup.children.forEach(node => {
      if (node.userData.animate) {
        node.userData.animate(deltaTime);
      }
    });
    
    // Update particle animations
    this.particleGroup.children.forEach(particles => {
      if (particles.userData.animate) {
        particles.userData.animate(deltaTime);
      }
    });
    
    // Update connection animations
    this.connectionGroup.children.forEach(connection => {
      if (connection.userData.animate) {
        connection.userData.animate(deltaTime);
      }
    });
  }

  private render(): void {
    if (this.postProcessingEnabled && this.renderTarget) {
      // Render to target for post-processing
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.camera);
      
      // Apply post-processing effects
      this.renderer.setRenderTarget(null);
      // Post-processing would be applied here
    } else {
      // Direct render
      this.renderer.render(this.scene, this.camera);
    }
  }

  private trackFPS(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now >= this.lastFPSCheck + 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSCheck));
      this.frameCount = 0;
      this.lastFPSCheck = now;
    }
  }

  // Scene management methods
  clearScene(): void {
    this.nodeGroup.clear();
    this.connectionGroup.clear();
    this.particleGroup.clear();
    this.backgroundGroup.clear();
  }

  addNode(node: THREE.Object3D): void {
    this.nodeGroup.add(node);
  }

  addConnection(connection: THREE.Object3D): void {
    this.connectionGroup.add(connection);
  }

  addParticleSystem(particles: THREE.Object3D): void {
    this.particleGroup.add(particles);
  }

  // Getters
  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getWebGPUManager(): WebGPUManager | null {
    return this.webgpuManager;
  }

  getRenderingMode(): 'webgpu' | 'webgl' | 'canvas2d' {
    return this.renderingMode;
  }

  getCurrentFPS(): number {
    return this.currentFPS;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const info = this.renderer.info;
    
    return {
      frameRate: this.currentFPS,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
      gpuMemory: info.memory?.geometries + info.memory?.textures || 0,
      nodeCount: this.nodeGroup.children.length,
      particleCount: this.particleGroup.children.length,
      qualityLevel: 1.0,
      loadTime: 0
    };
  }

  // Cleanup
  dispose(): void {
    console.log('🧹 Disposing Neural Renderer...');
    
    this.stopRendering();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Dispose Three.js resources
    this.clearScene();
    
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    
    this.renderer.dispose();
    
    // Cleanup WebGPU
    if (this.webgpuManager) {
      this.webgpuManager.cleanup();
    }
    
    if (this.fallbackManager) {
      this.fallbackManager.cleanup();
    }
    
    // Remove canvas from DOM
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    console.log('✅ Neural Renderer disposed');
  }
}