# Commands
pnpm dev | pnpm build | pnpm lint | pnpm test | pnpm test:ui | pnpm test:coverage
Single test: pnpm test <filename> or pnpm test <pattern>

# Code Style
- Use `@/` alias for absolute imports from src/
- Import types: `import type { ... } from ...`
- Components/types: PascalCase | Functions/hooks: camelCase | Constants: UPPER_SNAKE_CASE
- Hooks: prefix with `use` (e.g., useGeolocation)
- CSS: CSS Modules with `import styles from "./file.module.css"`
- Performance: `React.lazy` + `Suspense` for heavy components
- Logging: use `logger.debug/error` from utils/logger.ts, avoid console
- TypeScript: strict mode, no implicit any
- Testing: Vitest (describe/it/expect), globals enabled, use renderHook for hooks
- ESLint: @typescript-eslint/no-explicit-any is error
