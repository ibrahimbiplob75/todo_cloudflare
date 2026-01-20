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
		cloudflare()
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
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
