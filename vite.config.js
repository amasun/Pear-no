import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Pear-no/',
  plugins: [
    react(),
    {
      name: 'raw-glsl-loader',
      transform(code, id) {
        if (id.endsWith('.glsl')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null
          };
        }
      }
    }
  ],
  server: {
    host: true,
    port: 3000
  }
});
