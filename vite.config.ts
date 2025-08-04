import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite';

import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

// https://vite.dev/config/
export default defineConfig({
 resolve: {
    alias: {
      'symbol-crypto-wasm-node': 'symbol-crypto-wasm-web/symbol_crypto_wasm.js',
    }
  },
  build: {
    // 警告が出たので適当に大きめに設定
    chunkSizeWarningLimit: 4096,
  },
  plugins: [
    tailwindcss(),
    nodePolyfills({
      include: [
        // 'crypto'
      ],
      globals: {
        Buffer: true,
      },
    }),
    topLevelAwait(),
    wasm(),
    svelte()
  ],
})
