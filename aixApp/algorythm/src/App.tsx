declare const google: any;

import './App.css';
import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
const NewPage = React.lazy(() => import('./Youtube'));
const Privacy = React.lazy(() => import('./Privacy'));
const Terms = React.lazy(() => import('./Terms'));

// Define the response type
interface GoogleAuthResponse {
  error?: string; // Optional error property
  // Add other properties as needed based on the API response
}

// Extend window interface for API status
declare global {
  interface Window {
    apiLoadingStatus: {
      googleAuth: boolean;
      googleAPI: boolean;
      youtubeIframe: boolean;
      trackingPrevented: boolean;
      storageBlocked: boolean;
      fallbackMode: boolean;
    };
    handleAPILoadError: (apiName: string, errorType?: string) => void;
    enableFallbackMode: () => void;
    detectPrivacyRestrictions: () => boolean;
    google: any;
  }
}

const App: React.FC = () => {
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [immediatelyFailed, setImmediatelyFailed] = useState<boolean>(false);
  const currentOrigin = window.location.origin;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const MAX_RETRY_COUNT = 2; // Reduced further

  // Browser compatibility check
  const checkBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edge');
    const isFirefox = userAgent.includes('Firefox');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isEdge = userAgent.includes('Edge');

    return {
      isSupported: isChrome || isFirefox || isSafari || isEdge,
      browser: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Unknown'
    };
  };

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | undefined;

    // Listen for API load errors
    const handleApiError = (event: CustomEvent) => {
      const { api, trackingPrevented, storageBlocked, errorType } = event.detail;
      console.warn(`API Load Error: ${api}`, { trackingPrevented, storageBlocked, errorType });

      if (storageBlocked) {
        setApiError(`Storage access is blocked for ${api}. This app works best with tracking protection disabled for this site.`);
      } else if (trackingPrevented) {
        setApiError(`Tracking prevention is blocking ${api}. Some features may be limited.`);
      }
    };

    // Listen for fallback mode activation
    const handleFallbackMode = () => {
      console.log('Fallback mode enabled');
      setFallbackMode(true);
      setApiError(null); // Clear error when fallback is active
      setImmediatelyFailed(false); // Clear immediate failure flag
    };

    window.addEventListener('apiLoadError', handleApiError as EventListener);
    window.addEventListener('fallbackModeEnabled', handleFallbackMode);

    // Check if fallback mode is already enabled from HTML detection
    const checkImmediateFallback = () => {
      if (window.apiLoadingStatus?.fallbackMode) {
        console.log("Fallback mode already enabled by HTML detection");
        setFallbackMode(true);
        setImmediatelyFailed(false);
        return true;
      }
      return false;
    };

    // Initial fallback check
    if (checkImmediateFallback()) {
      return; // Exit early if fallback is already active
    }

    // Check if mobile device - skip Google API loading on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      console.log("📱 Mobile device detected, enabling fallback mode immediately");
      setFallbackMode(true);
      return; // Skip API loading on mobile
    }

    // Much simpler polling - just wait for APIs or fallback
    let pollCount = 0;
    const maxPolls = 60; // 30 seconds max (60 * 500ms)

    const checkGoogleApi = setInterval(() => {
      pollCount++;
      console.log("Checking if Google API is loaded...");

      // Safety timeout - enable fallback mode after 30 seconds
      if (pollCount >= maxPolls) {
        console.log("⏰ API loading timeout, enabling fallback mode");
        clearInterval(checkGoogleApi);
        setFallbackMode(true);
        return;
      }

      // Check if fallback mode is enabled
      if (window.apiLoadingStatus?.fallbackMode) {
        console.log("Fallback mode detected, proceeding with limited functionality");
        clearInterval(checkGoogleApi);
        setFallbackMode(true);

        // Initialize with fallback Google object
        if (typeof window.google !== 'undefined') {
          initGoogleApi();
        }
        return;
      }

      // If real Google API is loaded, use it
      if (typeof google !== 'undefined' && !window.apiLoadingStatus?.fallbackMode) {
        clearInterval(checkGoogleApi);
        initGoogleApi();
        return;
      }

      console.log("Waiting for APIs to load or fallback to activate...");
    }, 500); // Standard polling

    const initGoogleApi = () => {
      console.log("🔑 Initializing Google API...");
      if (!GOOGLE_CLIENT_ID) {
        console.error('❌ Missing GOOGLE_CLIENT_ID. Define it in your environment (e.g. .env).');
        console.log('📝 Please create a .env file with: GOOGLE_CLIENT_ID=your_client_id_here');
        setApiError('Missing Google Client ID. Please add GOOGLE_CLIENT_ID to your environment variables.');
        return;
      }

      try {
        console.log('🔧 Creating Google Auth client...');
        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube.readonly',
          ux_mode: 'popup', // Explicit popup mode for better public user experience
          callback: (resp: GoogleAuthResponse) => {
            if (resp.error) {
              // Enhanced error handling for public users
              if (resp.error === 'access_denied') {
                console.warn('⚠️ User denied access - this is normal for public users');
                setApiError('Access denied. Please approve permissions to access YouTube features.');
              } else if (resp.error === 'popup_blocked_by_browser') {
                console.warn('⚠️ Popup blocked by browser');
                setApiError('Popup blocked. Please allow popups for this site and try again.');
              } else {
                console.error(`❌ Authentication failed: ${resp.error}`);
                setApiError(`Authentication failed: ${resp.error}`);
              }
              return;
            }
            console.log("✅ Auth successful, token received");
            localStorage.setItem('youtubeAuthToken', JSON.stringify(resp)); // Store token
            window.location.href = '/new'; // Redirect to the NewPage component
          },
          error_callback: (error: any) => {
            console.error('❌ OAuth error details:', error);
            setApiError('Authentication error occurred. Please try again or check your browser settings.');
          }
        });

        setTokenClient(client); // Set the token client
        console.log("✅ Google Auth client initialized successfully");
        console.log('🎯 Ready for user login');
      } catch (error) {
        console.error("❌ Failed to initialize Google Auth client:", error);

        // Detect browser and provide specific guidance
        const browserInfo = checkBrowserCompatibility();
        let browserSpecificMessage = '';

        if (browserInfo.browser === 'Chrome') {
          browserSpecificMessage = 'Chrome: Click the shield icon in the address bar and turn off "Enhanced protection"';
        } else if (browserInfo.browser === 'Firefox') {
          browserSpecificMessage = 'Firefox: Click the shield icon and turn off "Enhanced Tracking Protection"';
        } else if (browserInfo.browser === 'Safari') {
          browserSpecificMessage = 'Safari: Go to Safari → Preferences → Privacy and uncheck "Prevent cross-site tracking"';
        } else if (browserInfo.browser === 'Edge') {
          browserSpecificMessage = 'Edge: Click the shield icon and turn off "Enhanced protection"';
        } else if (!browserInfo.isSupported) {
          browserSpecificMessage = 'Your browser may not be fully supported. Please try Chrome, Firefox, Safari, or Edge for the best experience.';
        }

        setApiError(`Failed to initialize Google authentication. This is usually caused by browser privacy settings blocking Google APIs.

${browserSpecificMessage}

General solutions:
• Disable tracking protection/privacy settings for this site
• Whitelist googleapis.com and youtube.com in your browser
• Disable ad blockers or privacy extensions temporarily
• Check if your browser allows third-party cookies`);
      }
    };

    return () => {
      clearInterval(checkGoogleApi);
      if (retryTimeout) clearTimeout(retryTimeout);
      window.removeEventListener('apiLoadError', handleApiError as EventListener);
      window.removeEventListener('fallbackModeEnabled', handleFallbackMode);
    };
  }, [retryCount]);

  // Show error message if APIs failed to load (but not in fallback mode)
  if (apiError && !fallbackMode) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        margin: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ color: '#856404' }}>API Loading Issue</h2>
        <p style={{ color: '#856404', marginBottom: '20px' }}>{apiError}</p>
        <div style={{ marginBottom: '20px' }}>
          <strong>Solutions:</strong>
          <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '10px auto' }}>
            <li>Disable tracking protection/privacy settings for this site</li>
            <li>Try using Chrome or Firefox with standard privacy settings</li>
            <li>Whitelist googleapis.com and youtube.com in your browser</li>
            <li>Disable ad blockers or privacy extensions temporarily</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry Loading
          </button>
          <button
            onClick={() => window.enableFallbackMode()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Continue with Limited Features
          </button>
        </div>
      </div>
    );
  }

  // Fallback mode no longer shows notification - uses standard YouTube embeds
  if (fallbackMode) {
    return (
      <div style={{ position: 'relative' }}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/new" element={<Suspense fallback={<div>Loading…</div>}><NewPage /></Suspense>} />
            <Route path="/privacy" element={<Suspense fallback={<div>Loading…</div>}><Privacy /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<div>Loading…</div>}><Terms /></Suspense>} />
            <Route path="/" element={<Navigate to="/new" />} />
          </Routes>
        </Router>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/new" element={<Suspense fallback={<div>Loading…</div>}><NewPage /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<div>Loading…</div>}><Privacy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<div>Loading…</div>}><Terms /></Suspense>} />
        <Route path="/" element={<Navigate to="/new" />} /> {/* Redirect from root to video screen */}
      </Routes>
    </Router>
  );
};

export default App;




