import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import type { FirestoreUser } from '../types/user';
import type { UserPreferences } from '../types/settings';
import { loadPreferences, savePreferences, clearPreferences } from '../services/settingsPreferences';
import { updateUserDisplayName, deleteAccountData } from '../services/userProfile';
import { listUserData } from '../services/userData';

const SESSION_KEY = 'spark_user';
const APP_VERSION = '1.0.0';

interface SettingsPageProps {
  user: FirestoreUser;
  onSignOut: () => void;
  onUserUpdate: (updated: FirestoreUser) => void;
}

export default function SettingsPage({ user, onSignOut, onUserUpdate }: SettingsPageProps) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [displayName, setDisplayName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setDisplayName(user.name);
  }, [user.name]);

  useEffect(() => {
    savePreferences(prefs);
    document.documentElement.dataset.theme = prefs.theme === 'system' ? '' : prefs.theme;
  }, [prefs]);

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError('Name is required.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const updated = await updateUserDisplayName(db, user.id, trimmed);
      onUserUpdate(updated);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  }

  function handleSignOut() {
    signOut(auth).catch(() => {});
    onSignOut();
    navigate('/');
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccountData(db, user.id);
      signOut(auth).catch(() => {});
      localStorage.removeItem(SESSION_KEY);
      clearPreferences();
      onSignOut();
      navigate('/', { replace: true });
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const items = await listUserData(db, user.id, 500);
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), userId: user.id, userid: user.userid, name: user.name, items }, null, 2)],
        { type: 'application/json' }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `aix-export-${user.userid}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  function handleClearCache() {
    localStorage.removeItem(SESSION_KEY);
    clearPreferences();
    handleSignOut();
  }

  return (
    <div className="settings-page">
      <nav className="settings-nav">
        <Link to="/" className="settings-nav-back">← Back to feed</Link>
      </nav>
      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>

        {/* Profile */}
        <section className="settings-section" aria-labelledby="settings-profile">
          <h2 id="settings-profile" className="settings-section-title">Profile</h2>
          <form onSubmit={handleSaveName} className="settings-group">
            <label htmlFor="settings-display-name" className="settings-label">Display name</label>
            <div className="settings-input-row">
              <input
                id="settings-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="settings-input"
                placeholder="Your name"
                disabled={savingName}
              />
              <button type="submit" className="settings-btn settings-btn-primary" disabled={savingName}>
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
            {nameError && <p className="settings-error">{nameError}</p>}
          </form>
          <p className="settings-muted">User ID: <code>{user.userid}</code></p>
        </section>

        {/* Privacy */}
        <section className="settings-section" aria-labelledby="settings-privacy">
          <h2 id="settings-privacy" className="settings-section-title">Privacy</h2>
          <div className="settings-group">
            <span className="settings-label">Default for new posts</span>
            <div className="settings-option-row">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="defaultPostVisibility"
                  checked={prefs.defaultPostVisibility === 'public'}
                  onChange={() => setPrefs((p) => ({ ...p, defaultPostVisibility: 'public' }))}
                />
                <span>Public feed</span>
              </label>
              <label className="settings-radio">
                <input
                  type="radio"
                  name="defaultPostVisibility"
                  checked={prefs.defaultPostVisibility === 'private'}
                  onChange={() => setPrefs((p) => ({ ...p, defaultPostVisibility: 'private' }))}
                />
                <span>Only my page</span>
              </label>
            </div>
          </div>
          <div className="settings-group">
            <span className="settings-label">Default when saving from Discover</span>
            <div className="settings-option-row">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="defaultSaveVisibility"
                  checked={prefs.defaultSaveVisibility === 'public'}
                  onChange={() => setPrefs((p) => ({ ...p, defaultSaveVisibility: 'public' }))}
                />
                <span>Public feed</span>
              </label>
              <label className="settings-radio">
                <input
                  type="radio"
                  name="defaultSaveVisibility"
                  checked={prefs.defaultSaveVisibility === 'private'}
                  onChange={() => setPrefs((p) => ({ ...p, defaultSaveVisibility: 'private' }))}
                />
                <span>Only my page</span>
              </label>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-section" aria-labelledby="settings-appearance">
          <h2 id="settings-appearance" className="settings-section-title">Appearance</h2>
          <div className="settings-group">
            <span className="settings-label">Theme</span>
            <div className="settings-option-row">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <label key={theme} className="settings-radio">
                  <input
                    type="radio"
                    name="theme"
                    checked={prefs.theme === theme}
                    onChange={() => setPrefs((p) => ({ ...p, theme }))}
                  />
                  <span>{theme === 'system' ? 'System' : theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="settings-section" aria-labelledby="settings-data">
          <h2 id="settings-data" className="settings-section-title">Data</h2>
          <div className="settings-group">
            <button type="button" className="settings-btn" onClick={handleExportData} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export my data'}
            </button>
            <p className="settings-hint">Download your posts and discoveries as JSON.</p>
          </div>
          <div className="settings-group">
            <button type="button" className="settings-btn" onClick={handleClearCache}>
              Clear local cache & sign out
            </button>
            <p className="settings-hint">Removes saved session and preferences from this device. Your account and data stay on the server.</p>
          </div>
        </section>

        {/* Account */}
        <section className="settings-section" aria-labelledby="settings-account">
          <h2 id="settings-account" className="settings-section-title">Account</h2>
          <div className="settings-group">
            <button type="button" className="settings-btn settings-btn-primary" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
          <div className="settings-group settings-group-danger">
            <span className="settings-label">Delete account and data</span>
            <p className="settings-hint">This permanently deletes your profile and all your posts and discoveries. This cannot be undone.</p>
            <input
              type="text"
              className="settings-input"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              disabled={deleting}
              aria-label="Type DELETE to confirm"
            />
            <button
              type="button"
              className="settings-btn settings-btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </section>

        {/* About */}
        <section className="settings-section" aria-labelledby="settings-about">
          <h2 id="settings-about" className="settings-section-title">About</h2>
          <p className="settings-muted">AI-X v{APP_VERSION}</p>
          <p className="settings-muted">
            Ask anything. Save discoveries to your feed.
          </p>
        </section>
      </div>
    </div>
  );
}
