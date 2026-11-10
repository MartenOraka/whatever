import { FormEvent, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth';
import { SLOGAN } from '../config';
import Logo from '../components/Logo';

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/discover" replace />;
  const isLogin = mode === 'login';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (isLogin) await login(email, password); else await register(email, password, nickname);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server');
    } finally { setBusy(false); }
  }

  return (
    <div className="center">
      <form className="card auth-card" onSubmit={submit}>
        <Link to="/" className="auth-logo"><Logo /></Link>
        <div className="auth-slogan">{SLOGAN}</div>
        <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">{isLogin ? 'Log in to find your next teammate or collaborator.' : 'Find gaming partners and creative collaborators.'}</p>

        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        {!isLogin && <label>Nickname<input value={nickname} onChange={(e) => setNickname(e.target.value)} required minLength={2} maxLength={30} /></label>}
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isLogin ? 1 : 8}
          autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
        {!isLogin && <small className="muted">At least 8 characters.</small>}

        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}</button>
        <p className="muted small">
          {isLogin ? <>No account? <Link to="/register">Sign up</Link></> : <>Already registered? <Link to="/login">Log in</Link></>}
        </p>
      </form>
    </div>
  );
}
