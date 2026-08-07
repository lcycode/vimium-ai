# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Vimium C is a browser extension (Chrome/Firefox/Edge) providing keyboard-based navigation and control. It is a TypeScript fork of philc/vimium, maintained by gdh1995. Licensed Apache-2.0.

## Build & development commands

```bash
# TypeScript compilation
npm run tsc              # compile once
npm run watch            # watch mode (also: npm run dev)

# Build for specific browsers
npm run chrome           # Chrome MV3 (>=102)
npm run edge             # Edge Chromium
npm run mv3-firefox      # Firefox MV3 (>=101)
npm run local            # compile and build in-place (no minification)

# Legacy builds
npm run debug            # Chromium >=89 local build
npm run mv2-cr           # MV2 Chrome
npm run mv2-ff           # MV2 Firefox

# Lint & test
npm run lint             # ESLint with @typescript-eslint
npm run test             # gulp test (manual/regression test pages in tests/)

# Other
npm run clean            # delete build artifacts
npm run rebuild          # clean + build
npm run prepare          # convert PNG icons to blob data (runs before publish)
```

Environment variables that control builds: `BUILD_MV3`, `BUILD_MinCVer`, `BUILD_BTypes`, `BUILD_NeedCommit`, `BUILD_EdgeC`, `MINIFY_LOCAL`, `NO_COMMENT`, `DEBUG`.

Build orchestration is in `gulpfile.js` (~1000 lines) with helpers in `scripts/`.

## Architecture

### Directory layout

| Directory | Purpose |
|---|---|
| `background/` | Service worker — commands, key mapping, tabs, settings, sync, ports |
| `content/` | Content scripts injected into every page — link hints, scrolling, find, visual mode |
| `front/` | Vomnibar (URL omnibar, ~116KB), help dialog, shared CSS |
| `lib/` | Shared libraries used by both background and content scripts |
| `pages/` | Extension pages: options, popup (action), blank helper |
| `scripts/` | Build tooling: Gulp helpers, Terser configs, make.sh, ts compiler wrapper |
| `_locales/` | Chrome i18n messages (en, fr, sp, zh, zh_CN, zh_TW) |
| `i18n/` | UI translation JSON files |
| `typings/` | TypeScript declarations: Chrome APIs, message types, Vimium C types |
| `tests/` | Manual regression test pages (no automated test framework) |

### Module system

Content scripts use a custom AMD-compatible module loader defined in `lib/env.ts`. The `define()` global is polyfilled so that compiled AMD modules work in the extension's isolated world. Background scripts use `import` statements natively (ES modules via `"type": "module"` in the service worker).

`lib/env.ts` also handles browser detection at runtime (`OnChrome`, `OnFirefox`, `OnEdge`) and conditional polyfills based on compile-time `Build.BTypes` and `Build.MinCVer` flags.

### Background entry point

`background/worker.js` imports modules in a specific order:
1. Core init: `define.js` → `store.js` → `utils.js` → `browser.js`
2. Settings & comms: `settings.js` → `ports.js` → `key_mappings.js`
3. Command execution: `run_commands.js` → `run_keys.js` → `all_commands.js`
4. Dynamic modules (lazy): `sync.js`, `page_handlers.js`, `help_dialog.js`, `math_parser.js`

`background/ports.ts` handles all `chrome.runtime.onConnect` events — distinguishing content frames, omnibar instances, and extension pages — and routes messages to handlers.

### Content script injection

Manifest declares two content script groups (both `all_frames: true`, `run_at: document_start`):
1. **Extension world** (24 scripts): `lib/*` then `content/*`, ending with `content/frontend.js`
2. **MAIN world**: Only `content/extend_click_vc.js` — intercepts page click handlers

`lib/injector.ts` is loaded via `<script>` tag to bootstrap the extension on pages that support injection. It communicates with the background to verify identity and get the content script list.

### Communication flow

All communication uses `chrome.runtime.Port` (long-lived connections):

```
Content script ──Port──→ Background (ports.ts) ──Port──→ Pages (options/popup/vomnibar)
```

- **Background → Content**: Message type enum `kBgReq.*` — init, keyFSM update, settings update, show HUD
- **Content → Background**: Message type enum `kFgReq.*` — key events, frame state, link hint requests
- **Pages → Background**: Message type enum `kPgReq.*` — settings save/load, permission requests

`content/port.ts` establishes the connection. `pages/async_bg.ts` manages page-side port lifecycle with message queuing.

### Key mapping system

`background/key_mappings.ts` is the heart of the key binding system:

- **`keyFSM_`**: A tree structure (finite state machine) built from key mappings. Each key character maps to either a terminal command node (`KeyAction.cmd`), a count prefix (`KeyAction.count`), or a child FSM for multi-key sequences. This tree is serialized and sent to content scripts at init.
- **`keyToCommandMap_`**: `Map<string, CommandsNS.Item>` — key sequences → command items
- **`mappedKeyRegistry_`**: Physical key → logical key remapping (e.g., `<a-x>` → `<c-x>`), including mode-specific mappings
- **`shortcutRegistry_`**: Maps `chrome.commands` global shortcuts to Vimium C commands

`background/run_keys.ts` parses key sequences (supporting lists, conditionals, repeat counts) and dispatches to `executeCommand()`. `background/run_commands.ts` is the central command dispatcher.

`content/key_handler.ts` receives keystrokes, walks the `keyFSM_` tree to match sequences, handles passKeys/Escape/mapped keys, and dispatches matched commands.

### Settings system

`background/settings.ts` loads from `chrome.storage.sync`, merges with defaults, tracks changes, and broadcasts to all connected ports. `updateHooks_` triggers callbacks for specific settings — e.g., `updateHooks_.keyMappings` rebuilds the entire key mapping system.

`pages/options_base.ts` provides two-way binding between HTML form elements and settings. `pages/options_defs.ts` defines the schema and defaults of all configurable options.

### State management

`background/store.ts` is the central state container using getter/setter functions (prefixed `set_`). Key state: platform info, tab/frame tracking (`framesForTab_`), current command context (`cPort`, `cRepeat`, `cOptions`), settings caches.

### TypeScript configuration

- `tsconfig.base.json`: Strict mode, `noLib: true`, target ES2017, AMD modules, `typeRoots: ["typings"]`
- No automated test framework — tests in `tests/` are manual HTML/JS pages
- ESLint: double quotes, max line length 120, explicit return types on functions, `curly: error`, `no-var: error`, `no-eval: error`
