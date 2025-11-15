# AGENTS.md

You are an expert in JavaScript, Rspack, Rsbuild, Rslib, and library development. You write maintainable, performant, and accessible code.

## Commands

- `pnpm run build` - Build the library for production
- `pnpm run dev` - Turn on watch mode, watch for changes and rebuild the library

## Docs

- Rslib: https://rslib.rs/llms.txt
- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

## Tools

### Vitest

- Run `pnpm run test` to test your code

### Biome

- Run `pnpm run lint` to lint your code
- Run `pnpm run format` to format your code

## Coding Standards

### Quality Verification

- **Never assume correctness** after implementation
- **Always verify** with these commands in sub tasks:
  - `pnpm run test` - functionality tests
  - `npx tsc --noEmit` - type checking (build success ≠ correct types)
  - `pnpm run check` - linting and formatting
  - `pnpm run build` - production readiness

### Development Guidelines

- **Build tools & specialized libraries**: When working with unfamiliar APIs for build tools, bundlers, or specialized libraries, always research official documentation and credible sources first. Implement code only after gaining confident understanding of the API usage patterns.
- **Core ecosystem libraries**: For frequently used mainstream libraries (e.g., Node.js core APIs, popular npm packages), leverage existing knowledge while maintaining thorough testing practices.
- **Use existing solutions**: When established npm packages can adequately fulfill requirements, prefer them over custom implementations. Don't reinvent the wheel for well-solved problems.
