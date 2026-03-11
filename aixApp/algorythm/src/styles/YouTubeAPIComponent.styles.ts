import { CSSProperties } from 'react';

export const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-bg)',
    position: 'relative'
  } as CSSProperties,

  header: {
    padding: "15px 0",
    textAlign: "center",
    backgroundColor: 'var(--color-surface)',
    width: '100%',
    boxShadow: 'var(--elevation-1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: '70px'
  } as CSSProperties,

  headerTitle: {
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    fontSize: "32px",
    fontWeight: "600",
    color: "var(--color-text)",
    margin: "0",
    letterSpacing: "-0.5px",
    background: "linear-gradient(90deg, #774caf 0%, #4a90e2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)"
  } as CSSProperties,

  searchContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    backgroundColor: 'var(--color-surface)',
    padding: '15px',
    boxSizing: 'border-box',
    boxShadow: 'var(--elevation-1)',
    position: 'fixed',
    top: '70px',
    left: 0,
    right: 0,
    zIndex: 1000,
    height: '60px'
  } as CSSProperties,

  searchInput: {
    flex: 1,
    padding: "10px",
    border: "2px solid var(--color-primary)",
    borderRadius: "5px 0 0 5px",
    fontSize: "16px"
  } as CSSProperties,

  searchButton: {
    padding: "10px 15px",
    backgroundColor: "var(--color-primary)",
    color: "var(--color-inverted-text)",
    border: "none",
    borderRadius: "0 5px 5px 0",
    fontSize: "16px",
    cursor: "pointer"
  } as CSSProperties,

  mainContent: {
    flex: 1,
    padding: '0 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    position: 'relative',
    zIndex: 1,
    maxWidth: '1400px',
    margin: '130px auto 0',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-bg)',
    overflow: 'visible',
    minHeight: 'calc(100vh - 130px)'
  } as CSSProperties,

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0",
    padding: "10px 0",
    flexDirection: "column",
    position: "relative",
    top: "0",
    backgroundColor: 'var(--color-bg)',
    zIndex: 2
  } as CSSProperties,

  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid var(--color-border-muted)",
    borderTop: "5px solid var(--color-primary)",
    borderRadius: "50%",
    animation: "spin var(--spinner-duration, 1s) linear infinite",
    marginBottom: "15px"
  } as CSSProperties,

  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    padding: '15px 5px',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
    marginTop: '0'
  } as CSSProperties,

  videoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    border: '1px solid var(--color-border)',
    height: '100%',
    minWidth: '0'
  } as CSSProperties,

  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%',
    overflow: 'hidden',
    borderRadius: '4px'
  } as CSSProperties,

  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  } as CSSProperties,

  videoInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
  } as CSSProperties,

  videoTitle: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word'
  } as CSSProperties,

  channelTitle: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--color-muted-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  } as CSSProperties,

  modal: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    backgroundColor: "var(--color-backdrop)",
    zIndex: 2000
  } as CSSProperties,

  modalContent: {
    width: "100%",
    height: "100%",
    border: "none",
    aspectRatio: "9/16",
    maxWidth: "100%",
    maxHeight: "100%"
  } as CSSProperties,

  // Removed closeButton and videoInfoOverlay to comply with YouTube policy III.C.1
  // No overlays, frames, or visual elements should be displayed over YouTube embedded players
};

export const mobileStyles = `
  /* No scrollbars - custom swipe scrolling for all devices */
  .trending-sidebar,
  .trending-sidebar *,
  .trending-sidebar-content,
  .trending-sidebar .tiktok-sidebar {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .trending-sidebar *::-webkit-scrollbar,
  .trending-sidebar-content::-webkit-scrollbar,
  .trending-sidebar .tiktok-sidebar::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    /* Header adjustments for mobile - two line layout */
    .header-container {
      height: auto !important;
      min-height: auto !important;
      padding: 4px 0 !important;
    }

    /* Header container flex layout for mobile - target the first div inside header-container */
    .header-container > div:first-child {
      flex-direction: column !important;
      height: auto !important;
      padding: 10px 0 !important;
      gap: 10px !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
    }

    /* Title positioning for mobile - full width on first line */
    .header-container .header-title {
      font-size: 24px !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 15px !important;
      box-sizing: border-box !important;
      order: 1 !important;
      text-align: center !important;
    }

    /* Icons container for mobile - second line aligned to the right */
    .header-container .header-icons-container {
      position: static !important;
      transform: none !important;
      order: 2 !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      top: auto !important;
      right: auto !important;
      justify-content: flex-end !important;
      width: 100% !important;
      padding-right: 15px !important;
      box-sizing: border-box !important;
    }

    /* Override any inline styles that might interfere */
    .header-container .header-icons-container[style*="position: absolute"] {
      position: static !important;
    }

    .header-container .header-icons-container[style*="right:"] {
      right: auto !important;
    }

    .header-container .header-icons-container[style*="top:"] {
      top: auto !important;
    }

    .header-container .header-icons-container[style*="transform:"] {
      transform: none !important;
    }

    /* Search bar adjustments */
    .search-container {
      padding: 10px 15px !important;
      height: auto !important;
    }

    /* Mobile search input fixes */
    input[type="text"] {
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      border-radius: 5px !important;
      touch-action: manipulation !important;
      -webkit-touch-callout: none !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }

    /* Ensure search input works properly on mobile */
    #search-input {
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      border-radius: 5px 0 0 5px !important;
      touch-action: manipulation !important;
      -webkit-touch-callout: none !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
      font-size: 16px !important; /* Prevents zoom on iOS */
    }

    /* Sidebar adjustments for mobile - full screen when toggled */
    .trending-sidebar {
      position: fixed !important;
      width: 100vw !important;
      max-width: 100vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      top: 0 !important;
      left: 0 !important;
      bottom: 0 !important;
      right: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
      z-index: 1001 !important;
      border-radius: 0 !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
    }

    /* Trending Sidebar Mobile Content Optimizations */
    .trending-sidebar .tiktok-sidebar {
      width: 100% !important;
    }

    /* Mobile sidebar header adjustments - full screen */
    .trending-sidebar div[style*="padding: 24px 20px"] {
      padding: 20px 16px !important;
      flex-shrink: 0 !important;
    }

    /* Mobile sidebar header title */
    .trending-sidebar span[style*="fontSize: 20px"] {
      font-size: 19px !important;
    }

    /* Mobile sidebar header subtitle */
    .trending-sidebar div[style*="fontSize: 12px"] {
      font-size: 12px !important;
    }

    /* Mobile sidebar header icon */
    .trending-sidebar div[style*="width: 40px"] {
      width: 36px !important;
      height: 36px !important;
    }

    /* Mobile trending topic cards */
    .trending-sidebar div[style*="minHeight: 140px"] {
      min-height: 100px !important;
      padding: 0 !important;
      min-width: 44px !important;
      min-height: 44px !important;
    }

    /* Mobile topic content padding */
    .trending-sidebar div[style*="padding: 20px 16px"] {
      padding: 12px 10px !important;
    }

    /* Mobile topic icons */
    .trending-sidebar div[style*="width: 48px"] {
      width: 36px !important;
      height: 36px !important;
      margin: 0 auto 8px !important;
      min-width: 36px !important;
      min-height: 36px !important;
    }

    /* Mobile topic text */
    .trending-sidebar h3[style*="fontSize: 15px"] {
      font-size: 13px !important;
      line-height: 1.2 !important;
      -webkit-line-clamp: 2 !important;
      margin-bottom: 6px !important;
    }

    /* Mobile trending indicators */
    .trending-sidebar span[style*="fontSize: 11px"] {
      font-size: 10px !important;
    }

    /* Mobile action buttons */
    .trending-sidebar div[style*="width: 28px"] {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      min-height: 32px !important;
    }

    /* Mobile close button */
    .trending-sidebar button[style*="width: 36px"] {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      min-height: 40px !important;
    }

    /* Mobile bottom navigation hint - full screen */
    .trending-sidebar div[style*="padding: 16px 20px"] {
      padding: 16px 16px !important;
      flex-shrink: 0 !important;
    }

    /* Mobile trending indicators */
    .trending-sidebar span[style*="fontSize: 12px"] {
      font-size: 11px !important;
    }

    /* Mobile swipe gesture optimization */
    .trending-sidebar {
      touch-action: pan-y !important;
    }

    /* Mobile performance optimization */
    .trending-sidebar * {
      will-change: transform !important;
    }

    /* Mobile accessibility improvements */
    .trending-sidebar button,
    .trending-sidebar div[role="button"] {
      min-height: 44px !important;
      min-width: 44px !important;
    }

    /* Mobile full-screen status bar optimization */
    .trending-sidebar {
      padding-top: env(safe-area-inset-top) !important;
      padding-bottom: env(safe-area-inset-bottom) !important;
      padding-left: env(safe-area-inset-left) !important;
      padding-right: env(safe-area-inset-right) !important;
    }

    /* Mobile full-screen content area */
    .trending-sidebar .tiktok-sidebar {
      padding-top: env(safe-area-inset-top) !important;
      padding-bottom: env(safe-area-inset-bottom) !important;
    }

    /* Mobile full-screen header with safe area */
    .trending-sidebar div[style*="padding: 24px 20px"] {
      padding-top: calc(20px + env(safe-area-inset-top)) !important;
    }

    /* Mobile full-screen bottom hint with safe area */
    .trending-sidebar div[style*="padding: 16px 20px"] {
      padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
    }

    /* Trending topics grid for mobile - keep vertical layout */
    .trending-topics-grid {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
    }

    .trending-topic-button {
      font-size: 12px !important;
      padding: 8px 10px !important;
      min-height: 36px !important;
      justify-content: flex-start !important;
      text-align: left !important;
      word-wrap: break-word !important;
      white-space: normal !important;
      line-height: 1.2 !important;
    }

    /* Main content adjustments for mobile - offset for sidebar when visible */
    .main-content {
      position: fixed !important;
      top: 180px !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      padding: 15px !important;
      overflow: auto !important;
      transition: left 0.3s ease-in-out, width 0.3s ease-in-out !important;
    }

    /* When sidebar is visible, adjust main content */
    .main-content.sidebar-visible {
      left: 180px !important;
      width: calc(100% - 180px) !important;
    }

    /* Video grid adjustments for mobile */
    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
      gap: 15px !important;
      padding: 0 !important;
    }

    /* Video card adjustments for mobile */
    .video-card {
      min-height: 180px !important;
    }

    .video-card h3 {
      font-size: 13px !important;
      line-height: 1.3 !important;
    }

    .video-card p {
      font-size: 11px !important;
    }

    /* Modal adjustments for mobile */
    .video-modal {
      padding: 10px !important;
    }

    /* Mobile modal content padding adjustment to avoid covering YouTube controls */
    .video-modal > div[style*="padding"] {
      padding: 10px 10px 100px 10px !important;
    }

    .modal-close {
      top: 10px !important;
      right: 10px !important;
      font-size: 28px !important;
    }

    /* Modal Navigation Controls - let JavaScript handle all sizing and positioning */

    /* All button styling removed - let JavaScript handle everything */

    /* Edge protection for both arrows - let JavaScript handle positioning */
    /* Button max-width removed - let JavaScript handle all positioning */

    /* PERMANENT FIX: No CSS positioning overrides - let JavaScript handle all positioning */
    /* This prevents the recurring margin mismatch issue */

    /* All modal positioning removed - let JavaScript handle everything */
    
    /* Sticky Story Mode Button for Mobile */
    .mode-toggle-container {
      position: sticky !important;
      top: 20px !important;
      z-index: 100 !important;
      background: transparent !important;
      backdrop-filter: none !important;
      padding: 10px !important;
      margin: -10px -10px 20px -10px !important;
      border-radius: 0 0 15px 15px !important;
    }
    
    .story-mode-button {
      position: relative !important;
      z-index: 101 !important;
    }
    
    @media (max-width: 768px) {
      .mode-toggle-container {
        position: sticky !important;
        top: 10px !important;
        z-index: 100 !important;
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 8px !important;
        margin: -8px -8px 15px -8px !important;
        border-radius: 0 0 12px 12px !important;
        box-shadow: none !important;
      }
      
      .story-mode-button {
        box-shadow: 0 4px 20px rgba(255, 0, 80, 0.4) !important;
        backdrop-filter: blur(10px) !important;
      }
    }
    
    @media (max-width: 480px) {
      .mode-toggle-container {
        position: sticky !important;
        top: 8px !important;
        z-index: 100 !important;
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 6px !important;
        margin: -6px -6px 12px -6px !important;
        border-radius: 0 0 10px 10px !important;
      }
      
      .story-mode-button {
        padding: 12px 24px !important;
        font-size: 14px !important;
        min-width: 140px !important;
        min-height: 44px !important;
      }
    }
    
    @media (max-width: 360px) {
      .mode-toggle-container {
        position: sticky !important;
        top: 6px !important;
        z-index: 100 !important;
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 5px !important;
        margin: -5px -5px 10px -5px !important;
        border-radius: 0 0 8px 8px !important;
      }
      
      .story-mode-button {
        padding: 10px 20px !important;
        font-size: 13px !important;
        min-width: 120px !important;
        min-height: 40px !important;
      }
    }
    
    /* COMPLETE ISOLATION: Remove ALL CSS interference with modal buttons */
    .video-modal button[style*="left: 16px"],
    .video-modal button[style*="left: 18px"],
    .video-modal button[style*="left: 20px"],
    .video-modal button[style*="right: 16px"],
    .video-modal button[style*="right: 18px"],
    .video-modal button[style*="right: 20px"] {
      /* Remove any potential CSS interference */
      position: absolute !important;
      /* Let JavaScript handle all positioning */
      left: unset !important;
      right: unset !important;
      top: unset !important;
      bottom: unset !important;
      margin: 0 !important;
      padding: 0 !important;
      /* Remove any potential layout interference */
      float: none !important;
      clear: none !important;
      display: flex !important;
      /* Ensure no CSS transforms interfere */
      transform: none !important;
      /* Remove any potential box model interference */
      box-sizing: border-box !important;
      /* Ensure no CSS animations interfere */
      animation: none !important;
      transition: none !important;
    }

    /* Mobile video info overlay adjustments */
    .video-modal div[style*="position: fixed"][style*="bottom: 0"] {
      padding: 12px 15px !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] h3 {
      font-size: 14px !important;
      line-height: 1.2 !important;
      margin: 0 0 6px 0 !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] p {
      font-size: 12px !important;
      margin: 0 0 6px 0 !important;
    }

    /* Hide recommendations panel on mobile to prevent blocking the video */
    .recommendations-panel {
      display: none !important;
    }

    /* Loading indicator adjustments */
    .loading-indicator {
      position: fixed !important;
      top: 200px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      margin: 0 !important;
    }

    /* Skeleton Loader Mobile Optimizations */
    .skeleton-loader {
      padding: 15px 5px !important;
    }

    .skeleton-video-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
      gap: 15px !important;
      padding: 0 5px !important;
    }

    .skeleton-video-card {
      border-radius: 8px !important;
    }

    /* TikTok Mode Mobile Optimizations */
    .tiktok-video-feed {
      padding: 10px !important;
    }

    .tiktok-video-feed > div {
      padding: 10px !important;
    }

    /* Optimize video display for mobile */
    .tiktok-video-feed div[style*="maxWidth"] {
      max-width: 95vw !important;
      width: 100% !important;
    }

    /* Navigation controls for mobile */
    .tiktok-video-feed button {
      touch-action: manipulation !important;
      min-height: 44px !important;
      min-width: 44px !important;
    }

    /* Video info overlay mobile adjustments */
    .tiktok-video-feed h3 {
      font-size: 16px !important;
      line-height: 1.3 !important;
    }

    .tiktok-video-feed p {
      font-size: 13px !important;
    }

    /* Swipe instructions for mobile */
    .tiktok-video-feed div[style*="Swipe"] {
      font-size: 12px !important;
      margin-top: 15px !important;
    }

    /* Responsive Grid Mode Mobile Optimizations */
    .responsive-video-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
      gap: 15px !important;
      padding: 0 5px !important;
    }

    .grid-video-card {
      min-width: 240px !important;
      border-radius: 8px !important;
    }

    /* Grid video info overlay adjustments for mobile */
    .grid-video-card h3 {
      font-size: 13px !important;
      line-height: 1.2 !important;
      -webkit-line-clamp: 2 !important;
    }

    .grid-video-card p {
      font-size: 11px !important;
    }

    /* Grid play button adjustments for mobile */
    .grid-video-card div[style*="60px"] {
      width: 50px !important;
      height: 50px !important;
    }

    /* Grid video info padding adjustment */
    .grid-video-card div[style*="padding: 15px"] {
      padding: 10px !important;
    }

    /* Mode Toggle Buttons Mobile Optimizations */
    .mode-toggle-container {
      padding: 0 5px !important;
      margin-bottom: 15px !important;
    }

    .story-mode-button {
      padding: 12px 20px !important;
      font-size: 14px !important;
      min-width: 140px !important;
      min-height: 44px !important;
    }

    .browse-mode-button {
      padding: 10px 20px !important;
      font-size: 13px !important;
      min-width: 120px !important;
      min-height: 44px !important;
      bottom: 20px !important;
    }
  }

  /* Small mobile devices */
  @media (max-width: 480px) {
    /* Header height adjustment for small mobile */
    .header-container {
      min-height: 90px !important;
    }

    /* Smaller title for very small screens */
    .header-container .header-title {
      font-size: 20px !important;
      padding: 0 10px !important;
    }

    /* Icons spacing for small mobile */
    .header-container .header-icons-container {
      gap: 8px !important;
      padding-right: 10px !important;
    }

    .trending-sidebar {
      width: 100vw !important;
      max-width: 100vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      top: 0 !important;
      left: 0 !important;
      bottom: 0 !important;
      right: 0 !important;
      border-radius: 0 !important;
    }

    /* Small Mobile Trending Sidebar Optimizations */
    .trending-sidebar div[style*="padding: 24px 20px"] {
      padding: 12px 10px !important;
    }

    .trending-sidebar span[style*="fontSize: 20px"] {
      font-size: 17px !important;
    }

    .trending-sidebar div[style*="minHeight: 140px"] {
      min-height: 85px !important;
    }

    .trending-sidebar div[style*="padding: 20px 16px"] {
      padding: 10px 8px !important;
    }

    .trending-sidebar div[style*="width: 48px"] {
      width: 32px !important;
      height: 32px !important;
      margin: 0 auto 6px !important;
      min-width: 32px !important;
      min-height: 32px !important;
    }

    .trending-sidebar h3[style*="fontSize: 15px"] {
      font-size: 11px !important;
      line-height: 1.1 !important;
      -webkit-line-clamp: 2 !important;
    }

    .trending-sidebar span[style*="fontSize: 11px"] {
      font-size: 9px !important;
    }

    .trending-sidebar div[style*="width: 28px"] {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
      min-height: 28px !important;
    }

    .trending-sidebar button[style*="width: 36px"] {
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
    }

    .main-content.sidebar-visible {
      left: 144px !important;
      width: calc(100% - 144px) !important;
      top: 170px !important;
    }

    .main-content {
      top: 170px !important;
    }

    .trending-topic-button {
      font-size: 11px !important;
      padding: 6px 8px !important;
      min-height: 32px !important;
    }

    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
      gap: 10px !important;
    }

    .loading-indicator {
      top: 190px !important;
    }

    /* TikTok Mode Small Mobile Optimizations */
    .tiktok-video-feed {
      padding: 5px !important;
    }

    .tiktok-video-feed > div {
      padding: 5px !important;
    }

    /* Smaller navigation controls for small screens */
    .tiktok-video-feed button {
      min-height: 40px !important;
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
    }

    /* Smaller play button for small screens */
    .tiktok-video-feed div[style*="80px"] {
      width: 60px !important;
      height: 60px !important;
    }

    /* Adjust video counter for small screens */
    .tiktok-video-feed div[style*="padding: 8px 16px"] {
      padding: 6px 12px !important;
      font-size: 14px !important;
    }

    /* Compact navigation layout */
    .tiktok-video-feed div[style*="gap: 15px"] {
      gap: 10px !important;
      margin-top: 15px !important;
    }

    /* Responsive Grid Mode Small Mobile Optimizations */
    .responsive-video-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
      gap: 10px !important;
      padding: 0 3px !important;
    }

    .grid-video-card {
      min-width: 200px !important;
      border-radius: 6px !important;
    }

    /* Smaller grid elements for small mobile */
    .grid-video-card h3 {
      font-size: 12px !important;
      line-height: 1.1 !important;
    }

    .grid-video-card p {
      font-size: 10px !important;
    }

    /* Smaller play button for small mobile grid */
    .grid-video-card div[style*="60px"] {
      width: 40px !important;
      height: 40px !important;
    }

    /* Compact padding for small mobile grid */
    .grid-video-card div[style*="padding: 15px"] {
      padding: 8px !important;
    }

    /* Small Mobile Modal Navigation - let JavaScript handle all sizing */

    .video-modal div[style*="top: 20px"][style*="right: 20px"],
    .video-modal div[style*="top: 20px"][style*="right: 16px"] {
      top: 12px !important;
      right: 14px !important;
      padding: 5px 8px !important;
      font-size: 11px !important;
      max-width: calc(100vw - 30px) !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Small mobile modal content padding adjustment */
    .video-modal > div[style*="padding"] {
      padding: 8px 8px 90px 8px !important;
    }

    /* Small mobile video info overlay adjustments */
    .video-modal div[style*="position: fixed"][style*="bottom: 0"] {
      padding: 10px 12px !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] h3 {
      font-size: 13px !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] p {
      font-size: 11px !important;
    }

    /* Small Mobile Mode Toggle Buttons */
    .mode-toggle-container {
      padding: 0 3px !important;
      margin-bottom: 12px !important;
    }

    .story-mode-button {
      padding: 10px 16px !important;
      font-size: 13px !important;
      min-width: 120px !important;
      min-height: 40px !important;
    }

    .browse-mode-button {
      padding: 10px !important;
      font-size: 0 !important;
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      max-width: 44px !important;
      min-height: 44px !important;
      bottom: 15px !important;
      gap: 0 !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%) !important;
      border: 1px solid rgba(255, 255, 255, 0.7) !important;
      backdrop-filter: blur(15px) !important;
      -webkit-backdrop-filter: blur(15px) !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8) !important;
    }

    /* Hide text in all mobile views */
    .browse-mode-text {
      display: none !important;
    }

    /* Mobile icon optimization - perfect size for circular button */
    .browse-mode-button svg {
      width: 16px !important;
      height: 16px !important;
      flex-shrink: 0 !important;
      margin: 0 !important;
    }

    /* Small Mobile Skeleton Loader Optimizations */
    .skeleton-loader {
      padding: 12px 3px !important;
    }

    .skeleton-video-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
      gap: 10px !important;
      padding: 0 3px !important;
    }

    .skeleton-video-card {
      border-radius: 6px !important;
    }
  }

  /* Extra small mobile devices */
  @media (max-width: 360px) {
    /* Header height adjustment for extra small mobile */
    .header-container {
      min-height: 85px !important;
    }

    /* Even smaller title for very small screens */
    .header-container .header-title {
      font-size: 18px !important;
      padding: 0 8px !important;
    }

    /* Tighter icons spacing for extra small mobile */
    .header-container .header-icons-container {
      gap: 6px !important;
      padding-right: 8px !important;
    }

    .trending-sidebar {
      width: 100vw !important;
      max-width: 100vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      top: 0 !important;
      left: 0 !important;
      bottom: 0 !important;
      right: 0 !important;
      border-radius: 0 !important;
    }

    /* Extra Small Mobile Trending Sidebar Optimizations */
    .trending-sidebar div[style*="padding: 24px 20px"] {
      padding: 10px 8px !important;
    }

    .trending-sidebar span[style*="fontSize: 20px"] {
      font-size: 16px !important;
    }

    .trending-sidebar div[style*="minHeight: 140px"] {
      min-height: 70px !important;
    }

    .trending-sidebar div[style*="padding: 20px 16px"] {
      padding: 8px 6px !important;
    }

    .trending-sidebar div[style*="width: 48px"] {
      width: 28px !important;
      height: 28px !important;
      margin: 0 auto 4px !important;
      min-width: 28px !important;
      min-height: 28px !important;
    }

    .trending-sidebar h3[style*="fontSize: 15px"] {
      font-size: 10px !important;
      line-height: 1.1 !important;
      -webkit-line-clamp: 2 !important;
    }

    .trending-sidebar span[style*="fontSize: 11px"] {
      font-size: 8px !important;
    }

    .trending-sidebar div[style*="width: 28px"] {
      width: 24px !important;
      height: 24px !important;
      min-width: 24px !important;
      min-height: 24px !important;
    }

    .trending-sidebar button[style*="width: 36px"] {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      min-height: 32px !important;
    }

    .main-content.sidebar-visible {
      top: 165px !important;
    }

    .main-content {
      top: 165px !important;
    }

    .loading-indicator {
      top: 185px !important;
    }

    /* TikTok Mode Extra Small Mobile Optimizations */
    .tiktok-video-feed {
      padding: 3px !important;
    }

    /* Even smaller controls for very small screens */
    .tiktok-video-feed button {
      min-height: 36px !important;
      min-width: 36px !important;
      width: 36px !important;
      height: 36px !important;
    }

    /* Very small play button */
    .tiktok-video-feed div[style*="80px"] {
      width: 50px !important;
      height: 50px !important;
    }

    /* Compact video info */
    .tiktok-video-feed h3 {
      font-size: 14px !important;
    }

    .tiktok-video-feed p {
      font-size: 12px !important;
    }

    /* Minimal navigation spacing */
    .tiktok-video-feed div[style*="gap: 15px"] {
      gap: 8px !important;
      margin-top: 12px !important;
    }

    /* Responsive Grid Mode Extra Small Mobile Optimizations */
    .responsive-video-grid {
      grid-template-columns: 1fr !important;
      gap: 8px !important;
      padding: 0 2px !important;
    }

    .grid-video-card {
      min-width: 100% !important;
      max-width: 100% !important;
      border-radius: 4px !important;
    }

    /* Very compact grid elements for extra small mobile */
    .grid-video-card h3 {
      font-size: 11px !important;
      line-height: 1.1 !important;
      -webkit-line-clamp: 1 !important;
    }

    .grid-video-card p {
      font-size: 9px !important;
    }

    /* Very small play button for extra small mobile grid */
    .grid-video-card div[style*="60px"] {
      width: 35px !important;
      height: 35px !important;
    }

    /* Minimal padding for extra small mobile grid */
    .grid-video-card div[style*="padding: 15px"] {
      padding: 6px !important;
    }

    /* Extra Small Mobile Modal Navigation - let JavaScript handle all sizing */

    .video-modal div[style*="top: 20px"][style*="right: 20px"],
    .video-modal div[style*="top: 20px"][style*="right: 16px"] {
      top: 10px !important;
      right: 12px !important;
      padding: 4px 6px !important;
      font-size: 10px !important;
      max-width: calc(100vw - 25px) !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* Extra small mobile modal content padding adjustment */
    .video-modal > div[style*="padding"] {
      padding: 5px 5px 80px 5px !important;
    }

    /* Extra small mobile video info overlay adjustments */
    .video-modal div[style*="position: fixed"][style*="bottom: 0"] {
      padding: 8px 10px !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] h3 {
      font-size: 12px !important;
      line-height: 1.1 !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] p {
      font-size: 10px !important;
    }

    .video-modal div[style*="position: fixed"][style*="bottom: 0"] div {
      font-size: 9px !important;
    }

    /* Extra Small Mobile Mode Toggle Buttons */
    .mode-toggle-container {
      padding: 0 2px !important;
      margin-bottom: 10px !important;
    }

    .story-mode-button {
      padding: 8px 12px !important;
      font-size: 12px !important;
      min-width: 100px !important;
      min-height: 36px !important;
    }

    .browse-mode-button {
      bottom: 10px !important;
    }

    /* Text already hidden in mobile view */
    .browse-mode-text {
      display: none !important;
    }

    /* Icon size consistent with mobile view */
    .browse-mode-button svg {
      width: 16px !important;
      height: 16px !important;
    }

    /* Extra Small Mobile Skeleton Loader Optimizations */
    .skeleton-loader {
      padding: 8px 2px !important;
    }

    .skeleton-video-grid {
      grid-template-columns: 1fr !important;
      gap: 8px !important;
      padding: 0 2px !important;
    }

    .skeleton-video-card {
      border-radius: 4px !important;
    }

    /* Mobile touch optimization */
    .trending-sidebar * {
      touch-action: manipulation !important;
    }

    /* Swipe animation keyframes */
    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
      50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    }

    /* Enhanced YouTube Policy Compliant Swipe - Touch Event Handling */
    .video-modal {
      touch-action: pan-y !important;
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Modal container touch handling */
    .video-modal > div[style*="position: fixed"] {
      touch-action: pan-y !important;
      pointer-events: auto !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Modal content container touch handling */
    .video-modal > div[style*="position: relative"] {
      touch-action: pan-y !important;
      pointer-events: auto !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Player container touch handling */
    .video-modal #player {
      touch-action: pan-y !important;
      pointer-events: auto !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* YouTube iframe specific touch handling - allow controls but capture swipe */
    .video-modal iframe {
      pointer-events: auto !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Ensure YouTube controls work while allowing swipe detection */
    .video-modal iframe[src*="youtube"] {
      pointer-events: auto !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Touch overlay specific styling */
    .video-modal div[style*="zIndex: 100"] {
      pointer-events: auto !important;
      touch-action: pan-y !important;
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }

    /* Prevent touch callouts and selection on all modal elements */
    .video-modal * {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Allow text selection only for specific elements that need it */
    .video-modal input,
    .video-modal textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }

    /* Mobile scroll optimization - full screen */
    .trending-sidebar {
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior: contain !important;
      overflow: hidden !important;
    }

    /* Mobile content container optimization - full screen */
    .trending-sidebar .tiktok-sidebar {
      height: 100vh !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    /* Mobile trending topics container - swipe scrolling only */
    .trending-sidebar div[style*="flex: 1"] {
      flex: 1 !important;
      overflow-y: hidden !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Mobile trending topics list - optimized for 10 recommendations */
    .trending-sidebar div[style*="display: flex"][style*="flexDirection: column"] {
      gap: 0 !important;
      padding: 0 !important;
    }

    /* Mobile trending topic spacing - ensure proper spacing between 10 items */
    .trending-sidebar div[style*="height: 120px"] {
      margin-bottom: 0 !important;
      border-bottom: 1px solid rgba(255,255,255,0.05) !important;
    }

    /* Mobile trending topic last item - remove bottom border */
    .trending-sidebar div[style*="height: 120px"]:last-child {
      border-bottom: none !important;
    }

    /* Mobile trending topic cards - full width for 10 recommendations */
    .trending-sidebar div[style*="minHeight: 140px"] {
      width: 100% !important;
      min-height: 120px !important;
      height: 120px !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
    }

    /* Mobile trending topics container - optimized for swipe scrolling */
    .trending-sidebar div[style*="flex: 1"] {
      flex: 1 !important;
      overflow-y: hidden !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding: 0 !important;
      margin: 0 !important;
      height: 100% !important;
      max-height: 100% !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      transform: none !important;
      transition: none !important;
    }

    /* Hide scrollbars for all screen sizes - prevent initial flash */
    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar {
      display: none !important;
    }

    /* Prevent initial scrollbar flash on mobile */
    .trending-sidebar div[style*="flex: 1"] {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    /* Mobile full-screen close button optimization */
    .trending-sidebar button[style*="width: 36px"] {
      position: absolute !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 10 !important;
    }

    /* Mobile full-screen header optimization */
    .trending-sidebar div[style*="display: flex"][style*="justifyContent: space-between"] {
      position: relative !important;
      padding-right: 60px !important;
    }

    /* Swipe scrolling optimizations */
    .trending-sidebar div[style*="flex: 1"] {
      touch-action: pan-y !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }

    /* Smooth swipe transitions */
    .trending-sidebar div[style*="transform: translateY"] {
      will-change: transform !important;
      backface-visibility: hidden !important;
      -webkit-backface-visibility: hidden !important;
    }

    /* Mobile trending topics container - ensure proper height for 10 items */
    .trending-sidebar div[style*="flex: 1"] {
      min-height: 0 !important;
      flex: 1 1 0 !important;
    }

    /* Mobile trending topics - let content size itself */
    .trending-sidebar div[style*="flexDirection: column"] {
      min-height: 0 !important;
      height: auto !important;
    }

    /* Mobile loading state optimization */
    .trending-sidebar div[style*="width: 60px"] {
      width: 50px !important;
      height: 50px !important;
    }

    .trending-sidebar div[style*="width: 40px"] {
      width: 35px !important;
      height: 35px !important;
    }
  }

  /* Tablet Responsive Styles */
  @media (min-width: 769px) and (max-width: 1024px) {
    /* Tablet trending sidebar - proper desktop layout */
    .trending-sidebar {
      position: fixed !important;
      width: 280px !important;
      height: calc(100vh - 120px) !important;
      max-height: calc(100vh - 120px) !important;
      top: 120px !important;
      left: 0 !important;
      bottom: auto !important;
      right: auto !important;
      padding: 0 !important;
      box-shadow: 2px 0 8px rgba(0,0,0,0.1) !important;
      overflow: hidden !important;
      z-index: 1001 !important;
      border-radius: 0 12px 12px 0 !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
    }

    /* Tablet sidebar content container */
    .trending-sidebar .tiktok-sidebar {
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    /* Tablet sidebar header */
    .trending-sidebar div[style*="padding: 24px 20px"] {
      padding: 20px 18px !important;
      flex-shrink: 0 !important;
    }

    /* Tablet trending topics container - desktop scrolling */
    .trending-sidebar div[style*="flex: 1"] {
      flex: 1 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding: 0 16px !important;
      margin: 0 !important;
      scrollbar-color: rgba(255,255,255,0.3) rgba(255,255,255,0.1) !important;
      transform: none !important;
      transition: none !important;
    }


    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1) !important;
      border-radius: 3px !important;
    }

    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3) !important;
      border-radius: 3px !important;
    }

    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.5) !important;
    }

    /* Tablet trending topic cards */
    .trending-sidebar div[style*="minHeight: 140px"] {
      width: 100% !important;
      min-height: 140px !important;
      height: 140px !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
    }

    /* Tablet bottom navigation hint */
    .trending-sidebar div[style*="padding: 16px 20px"] {
      padding: 16px 18px !important;
      flex-shrink: 0 !important;
    }

    .main-content.sidebar-visible {
      left: 280px !important;
      width: calc(100% - 280px) !important;
    }

    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
    }

    /* Hide recommendations panel on tablets for clean experience */
    .recommendations-panel {
      display: none !important;
    }

    /* Responsive Grid Mode Tablet Optimizations */
    .responsive-video-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
      gap: 20px !important;
      padding: 0 15px !important;
    }

    .grid-video-card {
      min-width: 300px !important;
      border-radius: 10px !important;
    }
  }

  /* Large screen adjustments */
  @media (min-width: 1025px) {
    /* Desktop trending sidebar - proper desktop layout */
    .trending-sidebar {
      position: fixed !important;
      width: 320px !important;
      height: calc(100vh - 120px) !important;
      max-height: calc(100vh - 120px) !important;
      top: 120px !important;
      left: 0 !important;
      bottom: auto !important;
      right: auto !important;
      padding: 0 !important;
      box-shadow: 2px 0 8px rgba(0,0,0,0.1) !important;
      overflow: hidden !important;
      z-index: 1001 !important;
      border-radius: 0 12px 12px 0 !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
    }

    /* Desktop sidebar content container */
    .trending-sidebar .tiktok-sidebar {
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    /* Desktop sidebar header */
    .trending-sidebar div[style*="padding: 24px 20px"] {
      padding: 24px 20px !important;
      flex-shrink: 0 !important;
    }

    /* Desktop trending topics container - desktop scrolling */
    .trending-sidebar div[style*="flex: 1"] {
      flex: 1 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding: 0 20px !important;
      margin: 0 !important;
      scrollbar-color: rgba(255,255,255,0.3) rgba(255,255,255,0.1) !important;
      transform: none !important;
      transition: none !important;
    }


    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1) !important;
      border-radius: 4px !important;
    }

    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3) !important;
      border-radius: 4px !important;
    }

    .trending-sidebar div[style*="flex: 1"]::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.5) !important;
    }

    /* Desktop trending topic cards */
    .trending-sidebar div[style*="minHeight: 140px"] {
      width: 100% !important;
      min-height: 160px !important;
      height: 160px !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
    }

    /* Desktop bottom navigation hint */
    .trending-sidebar div[style*="padding: 16px 20px"] {
      padding: 20px 20px !important;
      flex-shrink: 0 !important;
    }

    .main-content.sidebar-visible {
      left: 320px !important;
      width: calc(100% - 320px) !important;
    }

    /* Hide recommendations panel on large screens for clean experience */
    .recommendations-panel {
      display: none !important;
    }

    /* Responsive Grid Mode Desktop Optimizations */
    .responsive-video-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important;
      gap: 25px !important;
      padding: 0 20px !important;
      max-width: 1400px !important;
      margin: 0 auto !important;
    }

    .grid-video-card {
      min-width: 350px !important;
      border-radius: 12px !important;
    }
  }
`;

export const baseStyles = `
  /* Design tokens */
  :root {
    --color-bg: #ffffff;
    --color-surface: #ffffff;
    --color-text: #333333;
    --color-muted-text: #666666;
    --color-primary: #774caf;
    --color-primary-contrast: #ffffff;
    --color-border: #e9ecef;
    --color-border-muted: #f3f3f3;
    --color-backdrop: rgba(0,0,0,0.9);
    --elevation-1: 0 2px 4px rgba(0,0,0,0.1);
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #0f1115;
      --color-surface: #141821;
      --color-text: #e6e6e6;
      --color-muted-text: #a1a1aa;
      --color-primary: #8f6be8;
      --color-primary-contrast: #0f1115;
      --color-border: #232736;
      --color-border-muted: #1b2030;
      --color-backdrop: rgba(0,0,0,0.92);
      --elevation-1: 0 4px 12px rgba(0,0,0,0.35);
    }
  }

  /* Manual theme override */
  :root[data-theme="light"] {
    --color-bg: #ffffff;
    --color-surface: #ffffff;
    --color-text: #333333;
    --color-muted-text: #666666;
    --color-primary: #774caf;
    --color-primary-contrast: #ffffff;
    --color-border: #e9ecef;
    --color-border-muted: #f3f3f3;
    --color-backdrop: rgba(0,0,0,0.9);
    --elevation-1: 0 2px 4px rgba(0,0,0,0.1);
  }

  :root[data-theme="dark"] {
    --color-bg: #0f1115;
    --color-surface: #141821;
    --color-text: #e6e6e6;
    --color-muted-text: #a1a1aa;
    --color-primary: #8f6be8;
    --color-primary-contrast: #0f1115;
    --color-border: #232736;
    --color-border-muted: #1b2030;
    --color-backdrop: rgba(0,0,0,0.92);
    --elevation-1: 0 4px 12px rgba(0,0,0,0.35);
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  @keyframes fadeInUp {
    0% { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    100% { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  @keyframes scaleIn {
    0% { 
      opacity: 0; 
      transform: scale(0.9); 
    }
    100% { 
      opacity: 1; 
      transform: scale(1); 
    }
  }

  @keyframes slideInFromLeft {
    0% { 
      opacity: 0; 
      transform: translateX(-100%); 
    }
    100% { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }

  @keyframes bounceIn {
    0% { 
      opacity: 0; 
      transform: scale(0.3); 
    }
    50% { 
      opacity: 1; 
      transform: scale(1.05); 
    }
    70% { 
      transform: scale(0.9); 
    }
    100% { 
      opacity: 1; 
      transform: scale(1); 
    }
  }

  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background-color: var(--color-bg);
    color: var(--color-text);
  }

.youtube-logo-icon {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
  aspect-ratio: 1 / 1 !important;
}

/* Target wrapper span containing YouTube icon and img tag */
.youtube-icon-wrapper,
img.youtube-icon-wrapper,
span:has(svg:has(path[d^="M23.498 6.186"])) {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  flex-basis: 20px !important;
  aspect-ratio: 1 / 1 !important;
  box-sizing: border-box !important;
  vertical-align: middle !important;
  line-height: 0 !important;
  position: relative !important;
  overflow: visible !important;
  contain: layout style size !important;
  object-fit: contain !important;
  object-position: center center !important;
}

.youtube-icon-wrapper svg:has(path[d^="M23.498 6.186"]),
span:has(svg:has(path[d^="M23.498 6.186"])) svg,
svg:has(path[d^="M23.498 6.186"]) {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  display: block !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  flex-basis: 20px !important;
  aspect-ratio: 1 / 1 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  transform: none !important;
  transform-origin: center center !important;
  object-fit: contain !important;
  align-self: center !important;
}

/* Ensure SVG width and height attributes are respected */
svg[width="20"][height="20"]:has(path[d^="M23.498 6.186"]) {
  width: 20px !important;
  height: 20px !important;
  aspect-ratio: 1 / 1 !important;
}

/* Prevent any parent from distorting the SVG */
*:has(svg:has(path[d^="M23.498 6.186"])) {
  aspect-ratio: auto !important;
}

*:has(> svg:has(path[d^="M23.498 6.186"])) {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
}

/* Ultra-specific rule to force exact dimensions - target all possible containers */
div svg:has(path[d^="M23.498 6.186"]),
a svg:has(path[d^="M23.498 6.186"]),
span svg:has(path[d^="M23.498 6.186"]),
.main-content svg:has(path[d^="M23.498 6.186"]),
.desktop-grid-container svg:has(path[d^="M23.498 6.186"]),
.responsive-video-display svg:has(path[d^="M23.498 6.186"]) {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  aspect-ratio: 1 / 1 !important;
  flex-shrink: 0 !important;
  transform: scale(1, 1) !important;
  scale: 1 1 !important;
}

/* If height is compressed to 14.09px, scale it back up */
svg:has(path[d^="M23.498 6.186"]) {
  /* Calculate scale factor: 20 / 14.09 ≈ 1.42 */
  /* But we want to prevent the compression in the first place */
  /* So we'll use a combination of height enforcement and scale correction */
}

/* Nuclear option: Use CSS to detect and fix distorted aspect ratio */
@supports (aspect-ratio: 1 / 1) {
  svg:has(path[d^="M23.498 6.186"]) {
    aspect-ratio: 1 / 1 !important;
    height: 20px !important;
    width: 20px !important;
  }
}

/* Force visual rendering size - use contain to prevent external influences */
svg:has(path[d^="M23.498 6.186"]) {
  contain: layout style paint !important;
  will-change: auto !important;
  backface-visibility: visible !important;
  -webkit-transform: translateZ(0) !important;
  transform: translateZ(0) !important;
}

/* Force SVG width and height attributes */
svg[width="20"]:has(path[d^="M23.498 6.186"]),
svg[height="20"]:has(path[d^="M23.498 6.186"]) {
  width: 20px !important;
  height: 20px !important;
  aspect-ratio: 1 / 1 !important;
}

svg:has(path[d^="M23.498 6.186"]) path {
  display: block !important;
  width: auto !important;
  height: auto !important;
}

/* Additional rule to force exact dimensions */
svg[width="20"]:has(path[d^="M23.498 6.186"]),
svg[height="20"]:has(path[d^="M23.498 6.186"]) {
  width: 100% !important;
  height: 100% !important;
  aspect-ratio: 1 / 1 !important;
}

/* Force square aspect ratio for all YouTube logo SVGs */
svg[width="20"][height="20"]:has(path[d^="M23.498 6.186"]) {
  width: 20px !important;
  height: 20px !important;
  aspect-ratio: 1 / 1 !important;
}

/* Ensure parent containers don't distort YouTube icons */
a:has(svg:has(path[d^="M23.498 6.186"])),
div:has(svg:has(path[d^="M23.498 6.186"])) {
  display: flex !important;
  align-items: center !important;
}

a:has(svg:has(path[d^="M23.498 6.186"])) svg:has(path[d^="M23.498 6.186"]),
div:has(svg:has(path[d^="M23.498 6.186"])) svg:has(path[d^="M23.498 6.186"]) {
  flex-shrink: 0 !important;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  aspect-ratio: 1 / 1 !important;
}

[data-youtube-logo="true"] {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
  aspect-ratio: 1 / 1 !important;
}

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg);
  }

  html {
    scroll-behavior: smooth;
  }

  /* A11y helpers */
  .visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  /* Focus styles */
  :where(button, [role="button"], a, input, textarea, select):focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Hover/pressed states for common classes used by the component */
  .search-button {
    transition: background-color .2s ease, box-shadow .2s ease, transform .06s ease;
    background-color: var(--color-primary);
    color: var(--color-primary-contrast);
  }

  .search-button:hover {
    filter: brightness(1.05);
    box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  }

  .search-button:active {
    transform: translateY(1px);
  }

  .video-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    border-color: var(--color-primary);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
    :root { --spinner-duration: 1.6s; }
  }

  /* Modern Forced Colors Mode support */
  @media (forced-colors: active) {
    .search-button {
      border: 1px solid CanvasText;
      background: ButtonFace;
      color: ButtonText;
      forced-color-adjust: none;
    }

    .video-card {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
      forced-color-adjust: none;
    }

    .browse-mode-button,
    .story-mode-button {
      border: 2px solid CanvasText;
      background: ButtonFace;
      color: ButtonText;
      forced-color-adjust: none;
    }

    .trending-sidebar {
      border: 1px solid CanvasText;
      background: Canvas;
      color: CanvasText;
      forced-color-adjust: none;
    }

    button {
      forced-color-adjust: auto;
    }

    * {
      forced-color-adjust: auto;
    }
  }
`; 