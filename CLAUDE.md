# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code style

Use comments sparingly. Only comment complex code where the intent is non-obvious.

## Testing

Tests are colocated in `__tests__` directories alongside source files. Framework is Vitest with `@testing-library/react` for component tests. Run `npm test` to watch all tests, or `npx vitest run src/path/to/file.test.tsx` for a single test file.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server with Turbopack at http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all tests (Vitest)
npx vitest run src/path/to/file.test.tsx  # Run a single test file
npm run db:reset       # Reset SQLite database (destructive)
```

> **Do not run `npm audit fix`.** Dependencies are pinned to specific compatible versions. Known security issues are addressed by manually bumping pinned versions.

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without a real key (or if the placeholder `your-api-key-here` is left), the app uses `MockLanguageModel` (`src/lib/provider.ts`) — a canned response provider that simulates multi-step tool calls without hitting the API.

Set `JWT_SECRET` in production. The default `"development-secret-key"` is hardcoded fallback.

## Architecture

### Request flow

User message → `POST /api/chat` → `streamText` (Vercel AI SDK) → Claude with two tools → streamed back to client → `ChatInterface` applies tool calls to the in-memory `VirtualFileSystem` → `PreviewFrame` re-renders.

### Virtual file system

All generated files live in a client-side `VirtualFileSystem` (`src/lib/file-system.ts`). Nothing is written to disk. The VFS is serialized to JSON and sent with every chat request so the server can reconstruct it, and saved to `Project.data` (SQLite) for authenticated users.

### AI tools

Claude is given two tools during generation:
- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create files, str_replace, insert lines, view
- `file_manager` (`src/lib/tools/file-manager.ts`) — rename, delete

Tool calls arrive in the AI stream and are intercepted by `FileSystemContext.handleToolCall` on the client to update the VFS in real time.

### Preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders an `<iframe srcdoc>` on every VFS change. The JSX transformer (`src/lib/transform/jsx-transformer.ts`) uses `@babel/standalone` to transpile each file client-side, then builds a native ES import map with `blob:` URLs. Third-party npm imports are resolved via `https://esm.sh/`. The preview includes Tailwind CSS via CDN.

The entry point is discovered in order: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`, then the first `.jsx`/`.tsx` found.

### Auth

JWT-based session auth stored in an `httpOnly` cookie (`auth-token`). `src/lib/auth.ts` is server-only. Anonymous users can generate components — their work is preserved in `sessionStorage` (`src/lib/anon-work-tracker.ts`) and offered for import when they sign up.

### Data persistence

SQLite via Prisma. Schema has two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings. Projects are only saved for authenticated users after each streaming response completes (`onFinish` in `route.ts`).

### Generation conventions (system prompt)

These rules are enforced via the system prompt (`src/lib/prompts/generation.tsx`) and must be respected in generated code:
- Every project must have a root `/App.jsx` as the entry point — always create this first
- Local file imports must use the `@/` alias (e.g. `@/components/Button`, not `./components/Button`)
- Style exclusively with Tailwind CSS — no hardcoded inline styles
- Do not create `.html` files; the VFS entry point is `/App.jsx`

### Model

Default model is `claude-haiku-4-5` (defined in `src/lib/provider.ts`). Change `MODEL` there to switch models.

## Key files

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Streaming chat endpoint; wires tools, model, persistence |
| `src/lib/provider.ts` | `getLanguageModel()` — real Claude or `MockLanguageModel` |
| `src/lib/file-system.ts` | `VirtualFileSystem` class |
| `src/lib/contexts/file-system-context.tsx` | Client state + `handleToolCall` |
| `src/lib/transform/jsx-transformer.ts` | Babel transform + import map + preview HTML generation |
| `src/lib/prompts/generation.tsx` | System prompt sent to Claude |
| `src/components/preview/PreviewFrame.tsx` | iframe-based live preview |
| `src/components/editor/CodeEditor.tsx` | Monaco Editor-based code viewer |
| `src/lib/auth.ts` | JWT session (server-only) |
| `prisma/schema.prisma` | SQLite schema |
| `src/generated/prisma` | Generated Prisma client (custom output location) |

## CI / GitHub Actions Environment

When running in GitHub Actions (triggered by @claude on an issue or PR):

- The project is already set up with all dependencies installed.
- The dev server is already running at localhost:3000.
- Server logs are written to logs.txt.
- The database can be queried with the `sqlite3` CLI if needed.
- Use the `mcp__playwright` set of tools to launch a browser and interact with the running app at localhost:3000.

## API Authentication

Endpoints under `/api/projects` and `/api/filesystem` require authentication (checked by middleware). Public endpoints (e.g. `/api/chat`) do not, allowing anonymous users to generate projects.
