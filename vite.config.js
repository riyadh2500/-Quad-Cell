import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: (path) => '/openai/v1/chat/completions',
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the Authorization header from the request
            const auth = req.headers['authorization'];
            if (auth) proxyReq.setHeader('Authorization', auth);
          });
        },
      },
    },
  },
})
