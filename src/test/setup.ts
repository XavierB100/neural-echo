import '@testing-library/jest-dom';

// Mock WebGL context for Three.js testing
const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  getExtension: () => null,
  getParameter: () => null,
  clearColor: () => {},
  clear: () => {},
  drawArrays: () => {},
  drawElements: () => {},
  useProgram: () => {},
  createShader: () => ({}),
  createProgram: () => ({}),
  attachShader: () => {},
  linkProgram: () => {},
  getProgramParameter: () => true,
  getShaderParameter: () => true,
  getShaderInfoLog: () => '',
  getProgramInfoLog: () => '',
  createBuffer: () => ({}),
  bindBuffer: () => {},
  bufferData: () => {},
  vertexAttribPointer: () => {},
  enableVertexAttribArray: () => {},
  getAttribLocation: () => 0,
  getUniformLocation: () => ({}),
  uniform1f: () => {},
  uniform3f: () => {},
  uniformMatrix4fv: () => {},
  viewport: () => {},
  enable: () => {},
  depthFunc: () => {},
  blendFunc: () => {},
  generateMipmap: () => {},
  createTexture: () => ({}),
  bindTexture: () => {},
  texImage2D: () => {},
  texParameteri: () => {},
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext;
  }
  return null;
};

// Mock WebGPU
Object.defineProperty(navigator, 'gpu', {
  writable: true,
  value: {
    requestAdapter: () => Promise.resolve(null),
  },
});

// Suppress Three.js warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.')) {
    return;
  }
  originalWarn.apply(console, args);
};