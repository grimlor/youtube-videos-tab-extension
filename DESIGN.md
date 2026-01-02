# YouTube Auto Videos Tab Extension - Design Document

## Overview

A Chromium browser extension that automatically navigates to the Videos tab when users visit a YouTube channel page.

## Problem Statement

When visiting a YouTube channel, users land on the Home/Featured tab by default. Users who want to browse a channel's video catalog must manually click the "Videos" tab every time they visit a channel. This extension automates that navigation.

## Goals

- Automatically redirect users to the Videos tab on YouTube channel pages
- Work across all YouTube channel URL formats (@username, /c/, /channel/, /user/)
- Handle YouTube's single-page application navigation
- Be lightweight and non-intrusive
- Support all Chromium-based browsers (Chrome, Edge, Brave, etc.)

## Non-Goals

- Modifying YouTube's UI beyond navigation
- Working on non-channel pages (search, watch pages, etc.)
- Supporting non-Chromium browsers (Firefox, Safari)
- Storing user preferences or settings

## Architecture

### Extension Type
Manifest V3 content script extension

### Components

1. **manifest.json**
   - Defines extension metadata and permissions
   - Declares content script injection rules
   - Specifies host permissions for youtube.com

2. **content.js**
   - Main logic for detecting channel pages
   - Navigation/tab switching logic
   - Single-page app (SPA) navigation observer

### Technical Approach

#### Detection Strategy
The extension must identify when a user is on a channel's main page (not a sub-page):
- Match URL patterns: `youtube.com/@username`, `/c/name`, `/channel/id`, `/user/name`
- Exclude URLs already containing `/videos`, `/about`, `/community`, etc.

#### Navigation Strategy
Two possible approaches:

**Option A: DOM Manipulation (Click Tab)**
- Locate the "Videos" tab element in the DOM
- Programmatically click it
- Pros: Uses YouTube's native navigation
- Cons: Fragile (DOM structure may change), timing issues

**Option B: Direct URL Navigation**
- Append `/videos` to the current channel URL
- Navigate programmatically
- Pros: Reliable, fast, simple
- Cons: Bypasses YouTube's SPA navigation (may cause full page reload)

**Recommended: Hybrid approach**
- Try Option A first (DOM click)
- Fallback to Option B if tab not found within timeout

#### SPA Navigation Handling
YouTube is a single-page app, so traditional page load events don't fire:
- Use MutationObserver to detect URL changes
- Track previous URL and compare on mutations
- Re-run detection/navigation logic on URL change

### Permissions Required

- `host_permissions`: `https://www.youtube.com/*` - Required to inject content script
- `activeTab` - Standard permission for tab interaction

## Implementation Details

### URL Pattern Matching
```javascript
// Detect channel main page (no sub-path)
/youtube\.com\/((@[^\/]+)|c\/[^\/]+|channel\/[^\/]+|user\/[^\/]+)$/
```

### Tab Detection
Possible selectors (YouTube's DOM structure):
- `yt-tab-shape-wiz__tab` containing text "Videos"
- `tp-yt-paper-tab` containing text "Videos"
- `a[href*="/videos"]` links

### Edge Cases

1. **Page Load Timing**: Content script runs at `document_end`, but YouTube may load tabs dynamically
   - Solution: Implement retry logic with timeout

2. **Already on Videos Tab**: Avoid redundant navigation
   - Solution: Check URL for `/videos` before attempting switch

3. **Non-English Locales**: "Videos" tab text may be in different languages
   - Solution: Use href matching (`/videos`) instead of text matching

4. **URL Changes**: YouTube's SPA navigation
   - Solution: MutationObserver watching for URL changes

5. **Shorts/Playlists Pages**: Don't interfere with other channel sub-pages
   - Solution: Only activate on exact channel URL pattern

## Testing Strategy

See [BDD_TESTING_STYLE_GUIDE.md](BDD_TESTING_STYLE_GUIDE.md) for detailed testing guidelines following Behavior-Driven Development principles.

### Manual Testing Scenarios
- Visit various channel URL formats
- Test with slow network connections
- Test URL changes via clicking channel links
- Verify no interference on non-channel pages

## TypeScript in Browser Extensions: Challenges and Solutions

This project uses TypeScript to provide type safety and better tooling support. However, browser extension content scripts have unique constraints that require specific workarounds when combined with TypeScript and Jest testing.

### The Core Problem: ES Modules Don't Work in Content Scripts

Browser extension content scripts (as of 2025) **cannot use ES modules** (import/export statements). They run in the browser's content script environment which expects either:
- Plain JavaScript with no module system
- CommonJS-style code loaded via script tags

This conflicts with modern TypeScript development where:
- TypeScript naturally targets ES modules
- Jest expects to import functions for testing
- Type checking works best with explicit exports

### Solution Architecture

We use a hybrid approach that compiles to CommonJS while maintaining full testability:

#### 1. TypeScript Compilation to CommonJS

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "commonjs",  // Not ES2020 or ESNext
    "target": "ES2020"
  }
}
```

This ensures `dist/content.js` uses `module.exports` which browser content scripts tolerate (they ignore it).

#### 2. Functions Without Export Keywords

**src/content.ts:**
```typescript
// No export keyword - just plain function declarations
function isChannelMainPage(url: string): boolean {
  // ...
}

function clickVideosTab(): boolean {
  // ...
}
```

This keeps the code clean and browser-compatible while TypeScript still type-checks everything.

#### 3. Conditional Module Exports for Testing

**src/content.ts (end of file):**
```typescript
// Only export in Node.js/Jest environment for testing
if (typeof module !== 'undefined' && module.exports) {
  // @ts-expect-error - module.exports not in types, but needed for Jest
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  module.exports = {
    isChannelMainPage,
    clickVideosTab,
    // ... all testable functions
  };
}
```

**Why this works:**
- In browser: `module` is undefined, this block never runs
- In Jest/Node: `module.exports` allows tests to import functions
- Comments silence TypeScript/ESLint complaints about non-standard pattern

#### 4. Dynamic Require in Tests

**tests/content.test.ts:**
```typescript
let contentModule: any;

beforeAll(() => {
  // Dynamic require to avoid TypeScript compile-time import resolution
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  contentModule = require('../src/content');
});

describe('when user visits YouTube channel', () => {
  it('user_sees_videos_tab_for_username_format', () => {
    expect(contentModule.isChannelMainPage('https://www.youtube.com/@mkbhd'))
      .toBe(true);
  });
});
```

**Why dynamic require?**
- Static `import` statements cause TypeScript namespace collisions
- `require()` happens at runtime, after compilation, avoiding conflicts
- Tests load directly from `src/` ensuring 100% coverage

#### 5. Jest Configuration with isolatedModules

**jest.config.js:**
```javascript
transform: {
  '^.+\\.tsx?$': ['ts-jest', {
    isolatedModules: true  // Critical: avoid cross-file type checking
  }]
}
```

**Why isolatedModules?**
- Prevents TypeScript from checking types across test and source files
- Eliminates namespace collision errors
- Each file is transformed independently

#### 6. Separate TypeScript Configs

**tsconfig.test.json:**
```json
{
  "extends": "./tsconfig.json",
  "include": ["tests/**/*"],    // Only test files
  "exclude": ["src/**/*"]       // Explicitly exclude src/
}
```

**Why separate configs?**
- Tests and source never compiled together
- Avoids duplicate identifier errors
- Keeps test and source type checking independent

### Trade-offs and Alternatives

**Is this complexity worth it?**

For a simple extension like this, probably not. The benefits:
- ✅ Full TypeScript type checking (strict mode)
- ✅ Better IDE autocomplete and refactoring
- ✅ Catches errors at compile time
- ✅ 100% test coverage with real implementation

The costs:
- ❌ Complex module system workarounds
- ❌ Non-standard conditional exports pattern
- ❌ Requires careful configuration of multiple tools
- ❌ More difficult for contributors to understand

**Better alternative for larger projects:**
Use a bundler (webpack, rollup, or esbuild) that can:
- Bundle TypeScript with proper module resolution
- Handle both browser and test environments cleanly
- Remove the need for conditional exports
- Support tree-shaking and code splitting

**For this project:**
The goal was to demonstrate TypeScript knowledge for job applications. The complexity demonstrated deep understanding of module systems, build tooling, and browser constraints - valuable learning even if over-engineered for the actual problem.

### Key Lessons

1. **Browser extension content scripts are not Node.js** - They can't use standard ES modules
2. **CommonJS is still relevant in 2025** - Legacy constraints sometimes force legacy solutions  
3. **Conditional exports are a valid pattern** - When bridging incompatible environments
4. **Dynamic require() has legitimate uses** - Avoiding compile-time conflicts in tests
5. **Test real implementation, not mocks** - Even if it requires creative module loading

If building a similar project, evaluate whether TypeScript's benefits outweigh the configuration complexity for your use case.

## Future Enhancements

- Optional: User settings to enable/disable per-channel
- Optional: Support for other tabs (Community, About)
- Optional: Keyboard shortcut to toggle behavior
- Optional: Statistics on usage

## Security & Privacy

- Extension only runs on YouTube domains
- No data collection or external network requests
- No user tracking or analytics
- Open source for transparency

## Browser Compatibility

Targets Chromium-based browsers with Manifest V3 support:
- Google Chrome (88+)
- Microsoft Edge (88+)
- Brave
- Opera (74+)
- Vivaldi

## Performance Considerations

- Minimal resource usage (single content script)
- No persistent background service worker needed
- No continuous polling (only event-driven mutations)
- Script size: <5KB

## Deployment

### Development
1. Load unpacked extension via browser's extension developer mode

### Distribution (Future)
- Chrome Web Store
- Microsoft Edge Add-ons
- GitHub releases for manual installation

## Open Questions

1. Should there be a way to disable the extension temporarily without uninstalling?
2. Should we add visual feedback when auto-switching occurs?
3. Should we respect the user's choice if they manually navigate back to Home tab?

## References

- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts Guide](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- YouTube URL structure patterns
