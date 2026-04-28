import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes asset paths relative, which works on both:
//   - GitHub Pages user/org sites  (username.github.io)
//   - GitHub Pages project sites   (username.github.io/repo-name)
// and on any other static host. If you deploy under a custom domain at
// the root, you can change this back to '/'.
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
