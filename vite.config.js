import { defineConfig } from 'vite'

export default defineConfig({
    base: '/freshwater-bay-site/',
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                tides: 'tides.html',
            },
        },
    },
})
