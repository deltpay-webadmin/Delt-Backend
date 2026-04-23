import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Figma-exported source uses versioned import specifiers like
// "sonner@2.0.3" or "@radix-ui/react-dialog@1.1.6". Strip the trailing
// "@<version>" so they resolve to the package installed in node_modules.
function figmaVersionedImportResolver() {
  const versioned = /^(@[^/]+\/[^/@]+|[^@][^/@]*)@\d[^/]*(\/.*)?$/
  return {
    name: 'figma-versioned-import-resolver',
    enforce: 'pre',
    async resolveId(id, importer, options) {
      const match = id.match(versioned)
      if (!match) return null
      const stripped = match[1] + (match[2] ?? '')
      const resolved = await this.resolve(stripped, importer, { ...options, skipSelf: true })
      return resolved ?? null
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    figmaVersionedImportResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
