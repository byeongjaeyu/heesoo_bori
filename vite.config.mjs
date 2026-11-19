import { defineConfig } from 'vite';
import { hbPlugin } from './build/hb-build.mjs';

// web/ 의 두 HTML 은 껍데기. 실제 내용은 build/hb-build.mjs 가 src/ 에서 만들어 넣는다.
export default defineConfig({
  root: 'web',
  publicDir: false,
  plugins: [hbPlugin()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: { input: { main: 'web/index.html', onetouch: 'web/onetouch/index.html' } }
  },
  server: { port: 5173, host: true }
});
