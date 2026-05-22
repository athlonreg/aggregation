import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.BASE_PATH || '/',
  optimizeDeps: {
    exclude: [
      '@wasm-fmt/ruff_fmt',
      '@wasm-fmt/clang-format',
      '@wasm-fmt/gofmt',
      '@wasm-fmt/lua_fmt',
    ],
  },
})
