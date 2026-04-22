// tests/setup.js
// ════════════════════════════════════════════════════════════════
// Global Test Setup — Fennec Facturation v3.1.0
// Runs before every test file.
// ════════════════════════════════════════════════════════════════

import { vi } from 'vitest';

// ─── Mock Electron BEFORE any app code imports ─────────────────
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
    getName: vi.fn(() => 'Fennec Facturation'),
    isPackaged: false,
    whenReady: vi.fn(() => Promise.resolve()),
  },
  BrowserWindow: vi.fn(),
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: vi.fn(),
      },
    },
  },
}));

// ─── Suppress console noise in tests ────────────────────────
// Comment these out when debugging test failures
global.console.log = vi.fn();
// Keep warn and error visible for debugging:
// global.console.warn = vi.fn()
// global.console.error = vi.fn()

// ─── Clear all mocks between tests ──────────────────────────
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
