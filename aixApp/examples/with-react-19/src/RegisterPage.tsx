import { useState, FormEvent } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { hashPassword } from './utils/hash';
import { signInWithGoogle, signInWithGoogleRedirect, getGoogleSignInErrorMessage } from './services/googleAuth';
import { isUseridTaken, isDisplayNameTaken } from './services/userProfile';
import type { FirestoreUser } from './types/user';

const USERS_COLLECTION = 'users';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

interface RegisterPageProps {
  db: Firestore;
  onRegistered: (user: FirestoreUser) => void;
  onGoToLogin: () => void;
}

export default function RegisterPage({ db, onRegistered, onGoToLogin }: RegisterPageProps) {
  const [userid, setUserid] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!userid.trim()) {
      setError('Please enter a user ID.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (await isUseridTaken(db, userid)) {
        setError('This user ID is already taken.');
        setLoading(false);
        return;
      }
      if (await isDisplayNameTaken(db, name)) {
        setError('This display name is already in use by another account.');
        setLoading(false);
        return;
      }

      const id = crypto.randomUUID();
      const passwordHash = await hashPassword(password);

      await setDoc(doc(db, USERS_COLLECTION, id), {
        id,
        userid: userid.trim(),
        name: name.trim(),
        passwordHash,
      });

      onRegistered({ id, userid: userid.trim(), name: name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onRegistered(user);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'auth/popup-blocked') {
        signInWithGoogleRedirect();
        setError('Redirecting to Google…');
      } else {
        setError(getGoogleSignInErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create account</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            User ID
            <input
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              placeholder="Choose a user ID"
              autoComplete="username"
              disabled={loading}
            />
          </label>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              autoComplete="name"
              disabled={loading}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              disabled={loading}
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              disabled={loading}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
          <div className="login-divider">
            <span>or</span>
          </div>
          <button
            type="button"
            className="login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <span className="login-google-icon" aria-hidden>
              <GoogleIcon />
            </span>
            Sign up with Google
          </button>
        </form>
        <p className="login-footer">
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={onGoToLogin}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
