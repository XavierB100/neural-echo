import type {
  WebGPUCapabilities,
  GPUBufferInfo,
  ShaderModuleInfo,
  NeuralEchoError,
  ErrorCode
} from '../types';

export class WebGPUManager {
  private device: GPUDevice | null = null;
  private adapter: GPUAdapter | null = null;
  private capabilities: WebGPUCapabilities;
  private buffers = new Map<string, GPUBufferInfo>();
  private shaderModules = new Map<string, ShaderModuleInfo>();
  private computePipelines = new Map<string, GPUComputePipeline>();
  private isInitialized = false;

  constructor() {
    this.capabilities = {
      supported: false,
      features: [],
      limits: {}
    };
  }

  async initialize(): Promise<GPUDevice> {
    console.log('🔧 Initializing WebGPU Manager...');
    
    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        throw this.createError('WEBGPU_NOT_SUPPORTED', 'WebGPU not supported in this browser');
      }

      // Request high-performance adapter
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
        forceFallbackAdapter: false
      });

      if (!this.adapter) {
        throw this.createError('WEBGPU_NOT_SUPPORTED', 'Failed to get WebGPU adapter');
      }

      console.log('✅ WebGPU adapter acquired:', this.adapter);

      // Check adapter features and limits
      const features = Array.from(this.adapter.features);
      const limits = this.adapter.limits;

      console.log('📋 WebGPU features:', features);
      console.log('📏 WebGPU limits:', limits);

      // Request device with required features and limits
      const requiredFeatures: GPUFeatureName[] = [];
      
      // Add shader-f16 if supported for better performance
      if (features.includes('shader-f16')) {
        requiredFeatures.push('shader-f16');
      }

      const requiredLimits: Record<string, number> = {
        maxBufferSize: Math.min(268435456, limits.maxBufferSize), // 256MB or device limit
        maxComputeWorkgroupSizeX: Math.min(256, limits.maxComputeWorkgroupSizeX),
        maxComputeWorkgroupsPerDimension: Math.min(65535, limits.maxComputeWorkgroupsPerDimension),
        maxStorageBuffersPerShaderStage: Math.min(8, limits.maxStorageBuffersPerShaderStage)
      };

      this.device = await this.adapter.requestDevice({
        requiredFeatures,
        requiredLimits
      });

      if (!this.device) {
        throw this.createError('WEBGPU_NOT_SUPPORTED', 'Failed to get WebGPU device');
      }

      // Set up error handling
      this.device.lost.then((info: any) => {
        console.error('💥 WebGPU device lost:', info.message);
        if (info.reason !== 'destroyed') {
          this.reinitialize();
        }
      });

      // Store capabilities
      this.capabilities = {
        supported: true,
        adapter: this.adapter,
        device: this.device,
        features: Array.from(features),
        limits: Object.fromEntries(
          Object.entries(limits).map(([key, value]) => [key, Number(value)])
        )
      };

      this.isInitialized = true;
      console.log('🚀 WebGPU Manager initialized successfully');
      
      return this.device;

    } catch (error) {
      console.warn('⚠️ WebGPU initialization failed:', error);
      throw error;
    }
  }

  async reinitialize(): Promise<void> {
    console.log('🔄 Reinitializing WebGPU Manager...');
    this.cleanup();
    await this.initialize();
  }

  createBuffer(name: string, size: number, usage: GPUBufferUsageFlags): GPUBuffer {
    if (!this.device) {
      throw this.createError('WEBGPU_NOT_SUPPORTED', 'Device not initialized');
    }

    try {
      const buffer = this.device.createBuffer({
        size,
        usage,
        mappedAtCreation: false
      });

      const bufferInfo: GPUBufferInfo = {
        name,
        buffer,
        size,
        usage
      };

      this.buffers.set(name, bufferInfo);
      console.log(`📦 Created GPU buffer '${name}' (${size} bytes)`);
      
      return buffer;
    } catch (error) {
      throw this.createError('WEBGPU_NOT_SUPPORTED', `Failed to create buffer '${name}': ${error}`);
    }
  }

  updateBuffer(name: string, data: ArrayBuffer | ArrayBufferView, offset = 0): void {
    if (!this.device) {
      throw this.createError('WEBGPU_NOT_SUPPORTED', 'Device not initialized');
    }

    const bufferInfo = this.buffers.get(name);
    if (!bufferInfo) {
      throw new Error(`Buffer '${name}' not found`);
    }

    try {
      this.device.queue.writeBuffer(bufferInfo.buffer, offset, data);
    } catch (error) {
      throw this.createError('WEBGPU_NOT_SUPPORTED', `Failed to update buffer '${name}': ${error}`);
    }
  }

  async loadShader(name: string, shaderPath: string): Promise<GPUShaderModule> {
    if (!this.device) {
      throw this.createError('WEBGPU_NOT_SUPPORTED', 'Device not initialized');
    }

    try {
      const response = await fetch(shaderPath);
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${response.statusText}`);
      }

      const shaderCode = await response.text();
      const module = this.device.createShaderModule({
        code: shaderCode,
        label: name
      });

      const shaderInfo: ShaderModuleInfo = {
        name,
        module,
        code: shaderCode
      };

      this.shaderModules.set(name, shaderInfo);
      console.log(`🎨 Loaded shader '${name}' from '${shaderPath}'`);
      
      return module;
    } catch (error) {
      throw this.createError('SHADER_COMPILATION_FAILED', `Failed to load shader '${name}': ${error}`);
    }
  }

  createComputePipeline(name: string, shaderModule: GPUShaderModule, entryPoint = 'main'): GPUComputePipeline {
    if (!this.device) {
      throw this.createError('WEBGPU_NOT_SUPPORTED', 'Device not initialized');
    }

    try {
      const pipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint
        },
        label: name
      });

      this.computePipelines.set(name, pipeline);
      console.log(`⚡ Created compute pipeline '${name}'`);
      
      return pipeline;
    } catch (error) {
      throw this.createError('SHADER_COMPILATION_FAILED', `Failed to create compute pipeline '${name}': ${error}`);
    }
  }

  getComputePipeline(name: string): GPUComputePipeline | undefined {
    return this.computePipelines.get(name);
  }

  getBuffer(name: string): GPUBuffer | undefined {
    return this.buffers.get(name)?.buffer;
  }

  getShaderModule(name: string): GPUShaderModule | undefined {
    return this.shaderModules.get(name)?.module;
  }

  getCapabilities(): WebGPUCapabilities {
    return { ...this.capabilities };
  }

  getDevice(): GPUDevice | null {
    return this.device;
  }

  isSupported(): boolean {
    return this.capabilities.supported && this.isInitialized;
  }

  getMemoryUsage(): number {
    let totalMemory = 0;
    this.buffers.forEach(bufferInfo => {
      totalMemory += bufferInfo.size;
    });
    return totalMemory;
  }

  cleanup(): void {
    console.log('🧹 Cleaning up WebGPU resources...');

    // Destroy all buffers
    this.buffers.forEach((bufferInfo, name) => {
      try {
        bufferInfo.buffer.destroy();
        console.log(`🗑️ Destroyed buffer '${name}'`);
      } catch (error) {
        console.warn(`Failed to destroy buffer '${name}':`, error);
      }
    });

    this.buffers.clear();
    this.shaderModules.clear();
    this.computePipelines.clear();

    // Destroy device
    if (this.device) {
      try {
        this.device.destroy();
        console.log('🗑️ WebGPU device destroyed');
      } catch (error) {
        console.warn('Failed to destroy WebGPU device:', error);
      }
    }

    this.device = null;
    this.adapter = null;
    this.isInitialized = false;
    this.capabilities.supported = false;
  }

  private createError(code: ErrorCode, message: string): NeuralEchoError {
    const error = new Error(message) as NeuralEchoError;
    error.code = code;
    error.component = 'WebGPUManager';
    error.recoverable = code !== 'WEBGPU_NOT_SUPPORTED';
    error.fallbackAction = this.getFallbackAction(code);
    return error;
  }

  private getFallbackAction(code: ErrorCode): string {
    switch (code) {
      case 'WEBGPU_NOT_SUPPORTED':
        return 'fallback_to_webgl';
      case 'SHADER_COMPILATION_FAILED':
        return 'use_simplified_shaders';
      case 'MEMORY_LIMIT_EXCEEDED':
        return 'reduce_quality';
      case 'GPU_MEMORY_LIMIT_EXCEEDED':
        return 'reduce_particle_count';
      default:
        return 'unknown';
    }
  }
}

// Progressive fallback system
export class RendererFallbackManager {
  private webgpuManager: WebGPUManager | null = null;
  private renderingMode: 'webgpu' | 'webgl' | 'canvas2d' = 'webgpu';

  async initializeRenderer(): Promise<{
    mode: 'webgpu' | 'webgl' | 'canvas2d';
    manager?: WebGPUManager;
    error?: NeuralEchoError;
  }> {
    console.log('🎮 Initializing rendering system with progressive fallback...');

    // Try WebGPU first
    try {
      this.webgpuManager = new WebGPUManager();
      await this.webgpuManager.initialize();
      this.renderingMode = 'webgpu';
      console.log('✅ WebGPU renderer initialized successfully');
      return { mode: 'webgpu', manager: this.webgpuManager };
    } catch (webgpuError) {
      console.warn('⚠️ WebGPU failed, falling back to WebGL:', webgpuError);
      
      // Try WebGL fallback
      try {
        if (this.isWebGLSupported()) {
          this.renderingMode = 'webgl';
          console.log('✅ WebGL renderer initialized successfully');
          return { mode: 'webgl' };
        } else {
          throw this.createError('WEBGL_FALLBACK_FAILED', 'WebGL not supported');
        }
      } catch (webglError) {
        console.warn('⚠️ WebGL failed, falling back to Canvas 2D:', webglError);
        
        // Final Canvas2D fallback
        try {
          if (this.isCanvas2DSupported()) {
            this.renderingMode = 'canvas2d';
            console.log('✅ Canvas 2D renderer initialized successfully');
            return { mode: 'canvas2d' };
          } else {
            throw this.createError('CANVAS2D_FALLBACK_FAILED', 'Canvas 2D not supported');
          }
        } catch (canvas2dError) {
          console.error('💥 All rendering fallbacks failed');
          return { 
            mode: 'canvas2d', 
            error: canvas2dError as NeuralEchoError 
          };
        }
      }
    }
  }

  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl') ||
        canvas.getContext('webgl2')
      );
    } catch (error) {
      return false;
    }
  }

  private isCanvas2DSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('2d');
    } catch (error) {
      return false;
    }
  }

  getRenderingMode(): 'webgpu' | 'webgl' | 'canvas2d' {
    return this.renderingMode;
  }

  getWebGPUManager(): WebGPUManager | null {
    return this.webgpuManager;
  }

  private createError(code: ErrorCode, message: string): NeuralEchoError {
    const error = new Error(message) as NeuralEchoError;
    error.code = code;
    error.component = 'RendererFallbackManager';
    error.recoverable = false;
    return error;
  }

  cleanup(): void {
    if (this.webgpuManager) {
      this.webgpuManager.cleanup();
      this.webgpuManager = null;
    }
  }
}