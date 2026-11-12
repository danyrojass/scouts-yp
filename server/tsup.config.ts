import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'es2022',
  clean: true,
  sourcemap: true,
  minify: true,
  dts: false,
  bundle: true,
  tsconfig: './tsconfig.json',
});
