import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Required for WebGPU support
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'ai': ['@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgpu'],
          'animation': ['gsap', 'framer-motion']
        }
      }
    }
  },
  server: {
    host: true,
    port: 3000
  },
  assetsInclude: ['**/*.wgsl'], // Include WebGPU Shading Language files
  define: {
    // Enable WebGPU in development
    'process.env': {}
  }
})
