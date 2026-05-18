import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),        // Standard Vite React compiler
    tailwindcss(),  // Native Tailwind v4 engine compiler plugin
  ],
})