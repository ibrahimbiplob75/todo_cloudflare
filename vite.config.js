import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { cloudflare } from "@cloudflare/vite-plugin"

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		cloudflare({
			configPath: './wrangler.jsonc'
		})
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
			'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
			'@views': fileURLToPath(new URL('./src/views', import.meta.url)),
			'@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
			'.prisma/client/default': resolve(process.cwd(), 'node_modules/.prisma/client/default.js'),
		},
		dedupe: ['@prisma/client'],
	},
	ssr: {
		noExternal: [
			'@prisma/client',
			'@prisma/adapter-d1',
			'/.prisma/client',
		],
		resolve: {
			external: [],
		},
	},
	optimizeDeps: {
		exclude: ['@prisma/client', '@prisma/adapter-d1']
	}
})
