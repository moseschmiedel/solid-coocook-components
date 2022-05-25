import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const commonConfig = defineConfig({
    plugins: [solidPlugin()],
});

export default defineConfig(({ command, mode }) => {
    if (command !== 'build')
        return {
            ...commonConfig,
        };
    if (mode !== 'staging')
        return {
            ...commonConfig,
            build: {
                target: 'esnext',
                polyfillDynamicImport: false,
                rollupOptions: {
                    output: {
                        entryFileNames: "assets/[name].js",
                        chunkFileNames: "assets/[name].js",
                        assetFileNames: "assets/[name][extname]",
                    }
                }
            },
        };

    return {
        ...commonConfig,
        build: {
            target: 'esnext',
            polyfillDynamicImport: false,
            minify: false,
            rollupOptions: {
                output: {
                    entryFileNames: "assets/[name].js",
                    chunkFileNames: "assets/[name].js",
                    assetFileNames: "assets/[name][extname]",
                }
            }
        },
    };

});
