/**
 * BDD Tests for YouTube Auto Videos Tab Extension
 * Following BDD_TESTING_STYLE_GUIDE.md principles
 */

// Import the actual implementation to test
import {
  isChannelMainPage,
  isOnVideosTab,
  getVideosUrl,
  clickVideosTab,
  navigateToVideosTab,
  switchToVideosTab
} from '../src/content';

describe('YouTube Auto Videos Tab Extension', () => {
  
  beforeEach(() => {
    // Given: Clean DOM for each test
    document.body.innerHTML = '';
    // Reset location
    delete (window as any).location;
    (window as any).location = { href: 'https://www.youtube.com/' };
  });

  describe('Channel Detection', () => {
    
    test('user_navigates_to_channel_with_at_username_format', () => {
      /**
       * As a YouTube user
       * When I navigate to a channel using @username format
       * Then the extension detects it as a channel main page
       */
      // Given: User is on a channel page with @username format
      const url = 'https://www.youtube.com/@mkbhd';
      
      // When: Extension checks if this is a channel page
      const isChannel = isChannelMainPage(url);
      
      // Then: Extension recognizes it as a channel main page
      expect(isChannel).toBe(true);
    });

    test('user_navigates_to_channel_with_c_format', () => {
      /**
       * As a YouTube user
       * When I navigate to a channel using /c/ format
       * Then the extension detects it as a channel main page
       */
      // Given: User is on a channel page with /c/ format
      const url = 'https://www.youtube.com/c/LinusTechTips';
      
      // When: Extension checks if this is a channel page
      const isChannel = isChannelMainPage(url);
      
      // Then: Extension recognizes it as a channel main page
      expect(isChannel).toBe(true);
    });

    test('user_navigates_to_channel_with_channel_id_format', () => {
      /**
       * As a YouTube user
       * When I navigate to a channel using /channel/ format
       * Then the extension detects it as a channel main page
       */
      // Given: User is on a channel page with /channel/ format
      const url = 'https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ';
      
      // When: Extension checks if this is a channel page
      const isChannel = isChannelMainPage(url);
      
      // Then: Extension recognizes it as a channel main page
      expect(isChannel).toBe(true);
    });

    test('user_navigates_to_channel_with_user_format', () => {
      /**
       * As a YouTube user
       * When I navigate to a channel using /user/ format
       * Then the extension detects it as a channel main page
       */
      // Given: User is on a channel page with /user/ format
      const url = 'https://www.youtube.com/user/marquesbrownlee';
      
      // When: Extension checks if this is a channel page
      const isChannel = isChannelMainPage(url);
      
      // Then: Extension recognizes it as a channel main page
      expect(isChannel).toBe(true);
    });

    test('user_navigates_to_videos_tab_directly', () => {
      /**
       * As a YouTube user
       * When I navigate directly to a channel's Videos tab
       * Then the extension does not redirect (avoiding infinite loop)
       */
      // Given: User is already on the Videos tab
      const url = 'https://www.youtube.com/@mkbhd/videos';
      
      // When: Extension checks if this is a channel main page
      const isChannelMain = isChannelMainPage(url);
      
      // Then: Extension does not consider this a main page (no redirect needed)
      expect(isChannelMain).toBe(false);
    });

    test('user_navigates_to_non_channel_page', () => {
      /**
       * As a YouTube user
       * When I navigate to a non-channel page (watch, search, etc.)
       * Then the extension does not activate
       */
      // Given: User is on various non-channel pages
      const nonChannelUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/results?search_query=test',
        'https://www.youtube.com/feed/subscriptions',
        'https://www.youtube.com/'
      ];
      
      // When: Extension checks each URL
      const results = nonChannelUrls.map(url => isChannelMainPage(url));
      
      // Then: Extension does not activate on any non-channel page
      expect(results.every(result => result === false)).toBe(true);
    });
  });

  describe('Videos Tab Detection', () => {
    
    test('user_already_on_videos_tab', () => {
      /**
       * As a YouTube user
       * When I am already on the Videos tab
       * Then the extension does not attempt to navigate again
       */
      // Given: User is already on the Videos tab
      const url = 'https://www.youtube.com/@mkbhd/videos';
      
      // When: Extension checks if already on Videos tab
      const onVideosTab = isOnVideosTab(url);
      
      // Then: Extension recognizes user is already there
      expect(onVideosTab).toBe(true);
    });
  });

  describe('Tab Switching', () => {
    
    test('user_visits_channel_and_extension_finds_videos_tab_link', () => {
      /**
       * As a YouTube user
       * When I visit a channel main page and the Videos tab is available
       * Then the extension should be able to locate the tab element
       */
      // Given: Channel page with Videos tab in DOM
      document.body.innerHTML = `
        <div id="tabsContent">
          <a href="/@testchannel/featured" role="tab">Home</a>
          <a href="/@testchannel/videos" role="tab">Videos</a>
          <a href="/@testchannel/shorts" role="tab">Shorts</a>
        </div>
      `;
      
      // When: Extension searches for Videos tab
      const videosTab = document.querySelector('a[href*="/videos"][role="tab"]');
      
      // Then: Videos tab is found
      expect(videosTab).not.toBeNull();
      expect(videosTab?.getAttribute('href')).toContain('/videos');
    });

    test('user_visits_channel_with_custom_tab_structure', () => {
      /**
       * As a YouTube user
       * When I visit a channel with different DOM structure
       * Then the extension uses multiple selectors to find the Videos tab
       */
      // Given: Channel page with YouTube-specific tab structure
      document.body.innerHTML = `
        <yt-tab-shape tab-title="Videos">
          <a href="/@testchannel/videos">Videos</a>
        </yt-tab-shape>
      `;
      
      // When: Extension tries alternative selector
      const videosTab = document.querySelector('yt-tab-shape[tab-title*="Videos"] a');
      
      // Then: Videos tab is found with alternative selector
      expect(videosTab).not.toBeNull();
    });
  });

  describe('URL Navigation Fallback', () => {
    
    test('user_visits_channel_but_videos_tab_not_in_dom', () => {
      /**
       * As a YouTube user
       * When I visit a channel but the Videos tab is not yet loaded in DOM
       * Then the extension falls back to URL navigation
       */
      // Given: User is on channel main page
      const currentUrl = 'https://www.youtube.com/@mkbhd';
      
      // And: Videos tab is not in DOM
      document.body.innerHTML = '<div>Loading...</div>';
      const videosTab = document.querySelector('a[href*="/videos"][role="tab"]');
      
      // When: Extension cannot find tab element
      expect(videosTab).toBeNull();
      
      // Then: Extension can construct the fallback URL
      const fallbackUrl = getVideosUrl(currentUrl);
      expect(fallbackUrl).toBe('https://www.youtube.com/@mkbhd/videos');
    });
  });

  describe('Edge Cases', () => {
    
    test('user_visits_channel_about_page', () => {
      /**
       * As a YouTube user
       * When I visit a channel's About page
       * Then the extension does not redirect to Videos
       */
      // Given: User is on About page
      const url = 'https://www.youtube.com/@mkbhd/about';
      
      // When: Extension checks if this is main channel page
      const isMainPage = isChannelMainPage(url);
      
      // Then: Extension does not activate
      expect(isMainPage).toBe(false);
    });

    test('user_visits_channel_community_page', () => {
      /**
       * As a YouTube user
       * When I visit a channel's Community page
       * Then the extension does not redirect to Videos
       */
      // Given: User is on Community page
      const url = 'https://www.youtube.com/@mkbhd/community';
      
      // When: Extension checks if this is main channel page
      const isMainPage = isChannelMainPage(url);
      
      // Then: Extension does not activate
      expect(isMainPage).toBe(false);
    });

    test('user_visits_channel_playlists_page', () => {
      /**
       * As a YouTube user
       * When I visit a channel's Playlists page
       * Then the extension does not redirect to Videos
       */
      // Given: User is on Playlists page
      const url = 'https://www.youtube.com/@mkbhd/playlists';
      
      // When: Extension checks if this is main channel page
      const isMainPage = isChannelMainPage(url);
      
      // Then: Extension does not activate
      expect(isMainPage).toBe(false);
    });
  });

  describe('DOM Tab Clicking', () => {

    test('user_on_channel_with_standard_videos_tab_selector', () => {
      /**
       * As a YouTube user
       * When I visit a channel with standard tab structure
       * Then the extension successfully clicks the Videos tab link
       */
      // Given: Channel page with Videos tab using standard selector
      const mockClick = jest.fn();
      const mockTab = document.createElement('a');
      mockTab.href = '/@testchannel/videos';
      mockTab.setAttribute('role', 'tab');
      mockTab.click = mockClick;
      document.body.appendChild(mockTab);

      // When: Extension attempts to click the Videos tab
      const clicked = clickVideosTab();

      // Then: Tab is successfully clicked
      expect(clicked).toBe(true);
      expect(mockClick).toHaveBeenCalled();
    });

    test('user_on_channel_with_yt_tab_shape_selector', () => {
      /**
       * As a YouTube user
       * When I visit a channel with yt-tab-shape structure
       * Then the extension uses the correct selector to find and click the tab
       */
      // Given: Channel page with yt-tab-shape structure (second selector fallback)
      document.body.innerHTML = `
        <div>No standard tabs here</div>
        <yt-tab-shape tab-title="Videos">
          <a href="/@testchannel/videos" id="ytTabLink">Videos</a>
        </yt-tab-shape>
      `;
      const mockClick = jest.fn();
      const ytTabLink = document.getElementById('ytTabLink') as HTMLAnchorElement;
      ytTabLink.click = mockClick;

      // When: Extension attempts to click using alternate selector
      const clicked = clickVideosTab();

      // Then: Tab is found and clicked using yt-tab-shape selector
      expect(clicked).toBe(true);
      expect(mockClick).toHaveBeenCalled();
    });

    test('user_on_channel_with_paper_tab_selector', () => {
      /**
       * As a YouTube user
       * When I visit a channel with tp-yt-paper-tab structure
       * Then the extension uses the third selector to find and click the tab
       */
      // Given: Channel page with paper-tab structure (third selector fallback)
      document.body.innerHTML = `
        <div>No standard tabs</div>
        <div>No yt-tab-shape either</div>
        <tp-yt-paper-tab>
          <a href="/@testchannel/videos" id="paperTabLink">Videos</a>
        </tp-yt-paper-tab>
      `;
      const mockClick = jest.fn();
      const paperTabLink = document.getElementById('paperTabLink') as HTMLAnchorElement;
      paperTabLink.click = mockClick;

      // When: Extension attempts to click using paper-tab selector
      const clicked = clickVideosTab();

      // Then: Tab is found and clicked using paper-tab selector
      expect(clicked).toBe(true);
      expect(mockClick).toHaveBeenCalled();
    });

    test('user_on_channel_without_videos_tab_in_dom', () => {
      /**
       * As a YouTube user
       * When I visit a channel where Videos tab is not yet loaded
       * Then the extension returns false indicating click failed
       */
      // Given: Channel page with no Videos tab in DOM
      document.body.innerHTML = `
        <div>Loading tabs...</div>
      `;

      // When: Extension attempts to click Videos tab
      const clicked = clickVideosTab();

      // Then: Click fails and returns false
      expect(clicked).toBe(false);
    });
  });

  describe('URL Navigation', () => {

    test('user_on_channel_and_extension_navigates_to_videos_url', () => {
      /**
       * As a YouTube user
       * When the extension cannot click the Videos tab
       * Then it navigates by modifying window.location.href
       */
      // Given: User is on channel main page
      const currentUrl = 'https://www.youtube.com/@mkbhd';
      
      // And: Window location is mockable
      delete (window as any).location;
      (window as any).location = { href: currentUrl };
      
      // When: Extension navigates to Videos tab
      navigateToVideosTab(currentUrl);

      // Then: Window location is updated to Videos URL
      expect(window.location.href).toBe('https://www.youtube.com/@mkbhd/videos');
    });
  });

  describe('Main Execution Flow', () => {

    test('user_visits_channel_and_videos_tab_clicks_successfully', () => {
      /**
       * As a YouTube user
       * When I visit a channel main page and Videos tab is available
       * Then the extension clicks the tab without setting up a retry
       */
      // Given: User is on channel main page
      const currentUrl = 'https://www.youtube.com/@mkbhd';
      
      // And: Videos tab is available in DOM
      const mockClick = jest.fn();
      const mockTab = document.createElement('a');
      mockTab.href = '/@mkbhd/videos';
      mockTab.setAttribute('role', 'tab');
      mockTab.click = mockClick;
      document.body.appendChild(mockTab);
      
      // And: Mock setTimeout to verify it's NOT called
      const mockSetTimeout = jest.fn() as any;

      // When: Extension runs main execution logic
      switchToVideosTab(currentUrl, mockSetTimeout);

      // Then: Tab is clicked and no retry is set up
      expect(mockClick).toHaveBeenCalled();
      expect(mockSetTimeout).not.toHaveBeenCalled();
    });

    test('user_visits_channel_and_tab_not_available_triggers_retry', () => {
      /**
       * As a YouTube user
       * When I visit a channel but Videos tab is not immediately available
       * Then the extension sets up a retry with setTimeout
       */
      // Given: User is on channel main page
      const currentUrl = 'https://www.youtube.com/@mkbhd';
      
      // And: Videos tab is NOT in DOM
      document.body.innerHTML = '<div>Loading...</div>';
      
      // And: Mock setTimeout to capture retry logic
      const mockSetTimeout = jest.fn() as any;

      // When: Extension runs main execution logic
      switchToVideosTab(currentUrl, mockSetTimeout);

      // Then: setTimeout is called with 500ms delay
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
    });

    test('user_visits_channel_retry_finds_tab_and_clicks', () => {
      /**
       * As a YouTube user
       * When the retry timer fires and Videos tab has appeared
       * Then the extension clicks the tab successfully without navigating
       */
      // Given: User is on channel main page
      const currentUrl = 'https://www.youtube.com/@mkbhd';
      
      // And: Videos tab is NOT initially in DOM
      document.body.innerHTML = '<div>Loading...</div>';
      
      // And: Mock window.location to detect if navigation happens
      delete (window as any).location;
      (window as any).location = { href: currentUrl };
      
      // And: Capture the setTimeout callback
      let retryCallback: (() => void) | undefined;
      const mockSetTimeout = jest.fn((callback: () => void) => {
        retryCallback = callback;
      }) as any;

      // When: Extension runs main execution logic
      switchToVideosTab(currentUrl, mockSetTimeout);

      // Then: setTimeout is set up
      expect(mockSetTimeout).toHaveBeenCalled();
      expect(retryCallback).toBeDefined();
      
      // And: Videos tab appears in DOM before retry executes
      const mockClick = jest.fn();
      const mockTab = document.createElement('a');
      mockTab.href = '/@mkbhd/videos';
      mockTab.setAttribute('role', 'tab');
      mockTab.click = mockClick;
      document.body.appendChild(mockTab);
      
      // When: Retry callback executes
      retryCallback!();

      // Then: Tab is successfully clicked
      expect(mockClick).toHaveBeenCalled();
      
      // And: URL navigation did NOT happen (early return worked)
      expect(window.location.href).toBe(currentUrl); // Unchanged
    });

    test('user_visits_channel_retry_fails_navigates_directly', () => {
      /**
       * As a YouTube user
       * When the retry timer fires but Videos tab still not available
       * Then the extension falls back to direct URL navigation
       */
      // Given: User is on channel main page
      const currentUrl = 'https://www.youtube.com/@mkbhd';
      
      // And: Videos tab is NOT in DOM
      document.body.innerHTML = '<div>Loading...</div>';
      
      // And: Mock window.location
      delete (window as any).location;
      (window as any).location = { href: currentUrl };
      
      // And: Capture the retry callback
      let retryCallback: (() => void) | undefined;
      const mockSetTimeout = jest.fn((callback: () => void) => {
        retryCallback = callback;
      }) as any;

      // When: Extension runs main execution logic
      switchToVideosTab(currentUrl, mockSetTimeout);

      // Then: setTimeout is set up
      expect(mockSetTimeout).toHaveBeenCalled();
      expect(retryCallback).toBeDefined();
      
      // When: Retry callback executes (tab still not available)
      retryCallback!();

      // Then: Window location is set to Videos URL
      expect(window.location.href).toBe('https://www.youtube.com/@mkbhd/videos');
    });

    test('user_already_on_videos_tab_extension_skips_navigation', () => {
      /**
       * As a YouTube user
       * When I'm already on the Videos tab
       * Then the extension does not attempt any navigation
       */
      // Given: User is already on Videos tab
      const currentUrl = 'https://www.youtube.com/@mkbhd/videos';
      
      // And: Mock setTimeout to verify it's NOT called
      const mockSetTimeout = jest.fn() as any;
      
      // And: Mock window.location
      delete (window as any).location;
      (window as any).location = { href: currentUrl };

      // When: Extension runs main execution logic
      switchToVideosTab(currentUrl, mockSetTimeout);

      // Then: No navigation or retry is attempted
      expect(mockSetTimeout).not.toHaveBeenCalled();
      expect(window.location.href).toBe(currentUrl); // Unchanged
    });

    test('user_on_non_channel_page_extension_skips_navigation', () => {
      /**
       * As a YouTube user
       * When I'm on a non-channel page
       * Then the extension does not activate
       */
      // Given: User is on watch page
      const currentUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      // And: Mock setTimeout to verify it's NOT called
      const mockSetTimeout = jest.fn() as any;

      // When: Extension runs main execution logic
      switchToVideosTab(currentUrl, mockSetTimeout);

      // Then: No action is taken
      expect(mockSetTimeout).not.toHaveBeenCalled();
    });

    test('user_visits_non_youtube_site_extension_does_nothing', () => {
      /**
       * As a web user
       * When I visit a non-YouTube website
       * Then the extension does not activate or attempt any actions
       */
      // Given: User is on a completely different website
      const nonYouTubeUrls = [
        'https://www.google.com/',
        'https://github.com/user/repo',
        'https://stackoverflow.com/questions/12345',
        'https://www.youtube-like-site.com/@channel'
      ];

      nonYouTubeUrls.forEach(url => {
        // And: Mock setTimeout to verify it's NOT called
        const mockSetTimeout = jest.fn() as any;

        // When: Extension logic runs
        switchToVideosTab(url, mockSetTimeout);

        // Then: Extension does nothing
        expect(mockSetTimeout).not.toHaveBeenCalled();
        
        // And: URL detection correctly identifies non-YouTube/non-channel
        expect(isChannelMainPage(url)).toBe(false);
      });
    });
  });
});
