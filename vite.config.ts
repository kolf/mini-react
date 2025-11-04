import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      'react': resolve(__dirname, 'src/my-react/react'),
      'react-dom': resolve(__dirname, 'src/my-react/react-dom'),
      'react-dom/client': resolve(__dirname, 'src/my-react/react-dom/client'),
    }
  }
})