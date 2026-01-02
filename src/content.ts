/**
 * YouTube Auto Videos Tab Extension
 * Automatically navigates to the Videos tab on YouTube channel pages
 */

// Core functions (exported for testing)
/**
 * Checks if the current URL is a YouTube channel main page
 * @param url - The URL to check
 * @returns True if on a channel main page
 */
function isChannelMainPage(url: string): boolean {
  // Match channel URLs without sub-paths
  const channelPattern = /youtube\.com\/((@[^/]+)|(c\/[^/]+)|(channel\/[^/]+)|(user\/[^/]+))$/;
  return channelPattern.test(url);
}

/**
 * Checks if already on the Videos tab
 * @param url - The URL to check
 * @returns True if already on Videos tab
 */
function isOnVideosTab(url: string): boolean {
  return url.includes('/videos');
}

/**
 * Attempts to click the Videos tab in the DOM
 * @returns True if tab was found and clicked
 */
function clickVideosTab(): boolean {
  // Try multiple selectors for the Videos tab
  const selectors = [
    'a[href*="/videos"][role="tab"]',
    'yt-tab-shape[tab-title*="Videos"] a',
    'tp-yt-paper-tab a[href*="/videos"]'
  ];

  for (const selector of selectors) {
    const tab = document.querySelector<HTMLAnchorElement>(selector);
    if (tab) {
      tab.click();
      console.log('[YouTube Videos Tab] Clicked Videos tab');
      return true;
    }
  }

  return false;
}

/**
 * Navigates to the Videos tab by modifying the URL
 * @param currentUrl - The current URL
 * @returns The new videos URL
 */
function getVideosUrl(currentUrl: string): string {
  return currentUrl + '/videos';
}

/**
 * Navigates to the Videos tab by modifying window.location
 * @param currentUrl - The current URL to navigate from
 */
function navigateToVideosTab(currentUrl: string): void {
  const videosUrl = getVideosUrl(currentUrl);
  window.location.href = videosUrl;
  console.log('[YouTube Videos Tab] Navigated to:', videosUrl);
}

/**
 * Main function to switch to Videos tab
 * Tries DOM click first, falls back to URL navigation with retry
 * @param currentUrl - The current URL
 * @param setTimeoutFn - Optional setTimeout function for testing
 */
function switchToVideosTab(
  currentUrl: string,
  setTimeoutFn: typeof setTimeout = setTimeout
): void {
  // Skip if not on channel main page or already on Videos tab
  if (!isChannelMainPage(currentUrl) || isOnVideosTab(currentUrl)) {
    return;
  }

  console.log('[YouTube Videos Tab] Channel main page detected');

  // Try clicking the tab first
  const clicked = clickVideosTab();

  // If clicking failed, navigate directly
  if (!clicked) {
    // Wait a bit for tabs to load, then try again or fallback
    setTimeoutFn(() => {
      if (clickVideosTab()) {
        return;
      }
      // Fallback to direct navigation
      navigateToVideosTab(currentUrl);
    }, 500);
  }
}

// Export for testing (only in Node.js environment)
// @ts-expect-error - module is defined in Node.js/Jest environment
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // @ts-expect-error - module.exports is defined in Node.js/Jest environment
  // eslint-disable-next-line no-undef
  module.exports = {
    isChannelMainPage,
    isOnVideosTab,
    clickVideosTab,
    getVideosUrl,
    navigateToVideosTab,
    switchToVideosTab
  };
}

// Browser extension execution (only runs in browser)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (function() {
    'use strict';

    let lastUrl = location.href;

    /**
     * Observer callback for detecting URL changes in YouTube's SPA
     */
    function handleUrlChange(): void {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[YouTube Videos Tab] URL changed:', currentUrl);
        switchToVideosTab(currentUrl);
      }
    }

    // Initial check on page load
    switchToVideosTab(location.href);

    // Watch for URL changes (YouTube is a SPA)
    const observer = new MutationObserver(handleUrlChange);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[YouTube Videos Tab] Extension initialized');
  })();
}
