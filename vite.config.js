import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external access
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        modelverse: resolve(__dirname, 'modelverse.html'),
        benchmark: resolve(__dirname, 'benchmark.html'),
        canvas: resolve(__dirname, 'canvas.html'),
        workflow: resolve(__dirname, 'workflow.html'),
        myassets: resolve(__dirname, 'myassets.html'),
        mycart: resolve(__dirname, 'mycart.html'),
        interactive: resolve(__dirname, 'interactive.html')
      }
    }
  },
  publicDir: 'public',
  root: '.',
  plugins: [
    {
      name: 'preserve-assets',
      transformIndexHtml(html) {
        // This plugin ensures CSS and JS files are referenced directly, not bundled
        return html
          .replace(/href="\/assets\/styles-[^"]+\.css"/g, 'href="styles.css"')
          .replace(/href="\/assets\/account-dropdown-[^"]+\.css"/g, 'href="account-dropdown.css"')
          .replace(/crossorigin href="styles\.css"/g, 'href="styles.css"')
          .replace(/crossorigin href="account-dropdown\.css"/g, 'href="account-dropdown.css"')
      }
    },
    {
      name: 'copy-js-files',
      generateBundle() {
        // Copy JS files as-is to dist root
        const jsFiles = [
          'model-data.js',
          'config.js', 
          'api-manager.js',
          'wallet-manager.js',
          'wallet-integration.js',
          'account-dropdown.js',
          'bsc-testnet-guide.js',
          'modelverse.js',
          'benchmark.js',
          'canvas.js',
          'workflow.js',
          'myassets.js',
          'mycart.js'
        ]
        
        // Copy CSS files as-is to dist root
        const cssFiles = [
          'styles.css',
          'canvas.css',
          'account-dropdown.css',
          'modelverse.css',
          'myassets.css',
          'mycart.css',
          'workflow.css',
          'benchmark.css',
          'modelverse-buttons.css'
        ]
        
        jsFiles.forEach(file => {
          try {
            copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file))
            console.log(`✅ Copied ${file}`)
          } catch (err) {
            console.warn(`⚠️ Could not copy ${file}:`, err.message)
          }
        })
        
        cssFiles.forEach(file => {
          try {
            copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file))
            console.log(`✅ Copied ${file}`)
          } catch (err) {
            console.warn(`⚠️ Could not copy ${file}:`, err.message)
          }
        })
        
        // Copy SVG directory
        try {
          function copyDir(src, dest) {
            mkdirSync(dest, { recursive: true })
            const entries = readdirSync(src, { withFileTypes: true })
            
            for (let entry of entries) {
              const srcPath = resolve(src, entry.name)
              const destPath = resolve(dest, entry.name)
              
              if (entry.isDirectory()) {
                copyDir(srcPath, destPath)
              } else {
                copyFileSync(srcPath, destPath)
                console.log(`✅ Copied ${entry.name}`)
              }
            }
          }
          
          copyDir(resolve(__dirname, 'svg'), resolve(__dirname, 'dist', 'svg'))
        } catch (err) {
          console.warn(`⚠️ Could not copy SVG directory:`, err.message)
        }
      }
    }
  ]
})
