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
