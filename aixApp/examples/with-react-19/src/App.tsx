import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, useSearchParams, Navigate } from 'react-router-dom';
import { db } from './firebase';
import { checkRedirectResult } from './services/googleAuth';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import UserDataSection from './components/UserDataSection';
import SearchBar from './components/SearchBar';
import DiscoverResult from './components/DiscoverResult';
import SettingsPage from './components/SettingsPage';
import { loadPreferences } from './services/settingsPreferences';
import type { FirestoreUser } from './types/user';
import './App.css';

const SESSION_KEY = 'spark_user';

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function loadStoredUser(): FirestoreUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'id' in parsed && 'userid' in parsed && 'name' in parsed) {
      return parsed as FirestoreUser;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveStoredUser(user: FirestoreUser | null): void {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function LoginRoute({ setUser }: { setUser: (u: FirestoreUser) => void }) {
  const navigate = useNavigate();
  return (
    <LoginPage
      db={db}
      onLogin={(u) => {
        setUser(u);
        navigate('/');
      }}
      onGoToRegister={() => navigate('/register')}
    />
  );
}

function RegisterRoute({ setUser }: { setUser: (u: FirestoreUser) => void }) {
  const navigate = useNavigate();
  return (
    <RegisterPage
      db={db}
      onRegistered={(u) => {
        setUser(u);
        navigate('/');
      }}
      onGoToLogin={() => navigate('/login')}
    />
  );
}

function Landing() {
  return (
    <div className="login-page landing-layout">
      <div className="discover-hero">
        <h1>AI-X</h1>
        <p>Ask anything. Save discoveries to your feed.</p>
        <SearchBar />
      </div>
      <p className="discover-signin-hint landing-hint">
        Sign in to save discoveries and post to your feed.
      </p>
      <div className="discover-nav">
        <Link to="/login" className="link-button">Log in</Link>
        <span className="nav-dot">·</span>
        <Link to="/register" className="link-button">Register</Link>
      </div>
    </div>
  );
}

function FeedPage({ user, onSignOut, onUserUpdate: _onUserUpdate }: { user: FirestoreUser; onSignOut: () => void; onUserUpdate: (u: FirestoreUser) => void }) {
  const navigate = useNavigate();
  return (
    <div className="profile-info">
      <nav className="discover-nav nav-header">
        <Link to="/" className="nav-header-title">AI-X</Link>
      </nav>
      <div className="profile-info-actions">
        <button type="button" className="discover-save-btn discover-save-btn--icon" onClick={() => navigate('/settings')} aria-label="Settings">
          <GearIcon />
        </button>
        <button type="button" onClick={onSignOut} className="discover-save-btn">
          Sign out
        </button>
      </div>
      <h2>Welcome, {user.name}</h2>
      <p><strong>User ID:</strong> {user.userid}</p>
      <UserDataSection user={user} />
    </div>
  );
}

function SearchPage({ user, onSignOut }: { user: FirestoreUser | null; onSignOut?: () => void }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') ?? '';
  const hasQuery = query.trim().length > 0;

  return (
    <div className="discover-page" data-has-query={hasQuery}>
      <nav className="discover-nav nav-header">
        {!hasQuery && (
          <h1 className="discover-nav-title">Discover</h1>
        )}
        {hasQuery && (
          <div className="search-wrap">
            <SearchBar queryFromUrl={query} placeholder="Ask a follow-up…" autoFocus={false} />
          </div>
        )}
        {!user && (
          <>
            <Link to="/login" className="discover-nav-link">Log in</Link>
            <Link to="/register" className="discover-nav-link">Register</Link>
          </>
        )}
      </nav>
      {user && (
        <div className="discover-page-actions">
          <Link to="/" className="discover-save-btn">My feed</Link>
          <button type="button" className="discover-save-btn discover-save-btn--icon" onClick={() => navigate('/settings')} aria-label="Settings">
            <GearIcon />
          </button>
          <button type="button" onClick={onSignOut} className="discover-save-btn">Sign out</button>
        </div>
      )}
      {hasQuery && user && (
        <div className="discover-search-inline">
          <SearchBar queryFromUrl={query} placeholder="Ask a follow-up…" autoFocus={false} />
        </div>
      )}
      {hasQuery ? (
        <div className="discover-page-content">
          <DiscoverResult user={user} />
        </div>
      ) : (
        <div className="discover-welcome">
          <div className="discover-hero discover-hero--page">
            <p className="discover-welcome-desc">Ask a question and get an AI-powered answer with sources you can save to your feed.</p>
            <SearchBar variant="hero" placeholder="ex. Taylor Swift" />
          </div>
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState<FirestoreUser | null>(loadStoredUser);
  const navigate = useNavigate();

  useEffect(() => {
    saveStoredUser(user);
  }, [user]);

  useEffect(() => {
    const prefs = loadPreferences();
    const theme = prefs.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : prefs.theme;
    document.documentElement.dataset.theme = theme;
  }, []);

  useEffect(() => {
    checkRedirectResult()
      .then((firestoreUser) => {
        if (firestoreUser) {
          setUser(firestoreUser);
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        /* Ignore: no redirect in progress or redirect failed (e.g. after refresh on mobile). */
      });
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute setUser={setUser} />} />
      <Route path="/register" element={<RegisterRoute setUser={setUser} />} />
      <Route path="/search" element={<SearchPage user={user} onSignOut={() => setUser(null)} />} />
      <Route
        path="/settings"
        element={
          user ? (
            <SettingsPage
              user={user}
              onSignOut={() => setUser(null)}
              onUserUpdate={(updated) => setUser(updated)}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          user ? (
            <FeedPage user={user} onSignOut={() => setUser(null)} onUserUpdate={(updated) => setUser(updated)} />
          ) : (
            <Landing />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
