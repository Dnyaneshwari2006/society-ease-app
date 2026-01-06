import { defineConfig } from 'vite'

// Use esbuild loader="jsx" so JSX in .js files parses correctly.
// esbuild expects a string for `loader`, not an object mapping.
export default defineConfig({
  esbuild: {
    loader: 'jsx'
  }
})
