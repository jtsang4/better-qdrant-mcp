import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: {
        distPath: './dist',
        bundle: true, // Bundle types to generate index.d.ts in root
      },
      bundle: false, // Don't bundle to preserve module structure
      autoExternal: true, // Externalize dependencies
    },
  ],
});
