import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Try to load certs from backend/certs folder if they exist
const keyPath = path.resolve(__dirname, '../backend/certs/localhost-key.pem');
const certPath = path.resolve(__dirname, '../backend/certs/localhost.pem');

let httpsOptions = null;
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsOptions,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
