import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const credentials = { email, password };
    const result = await dispatch(login(credentials));
    
    // only navigate when login succeeds
    if (login.fulfilled.match(result)) {
      // The login reducer has already set localStorage and Redux state
      // Use a microtask to ensure state is committed before navigating
      Promise.resolve().then(() => {
        navigate('/', { replace: true });
        setPassword('');
      });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Gishoma</h1>
        <p style={styles.subtitle}>Multi-School Management System</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.passwordInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.toggleButton}
              aria-label="Toggle password visibility"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.hint}>
          Demo: superadmin@gishoma.edu / password123
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
  },
  card: {
    width: '100%',
    minWidth: '360px',
    maxWidth: '440px',
    padding: '2.5rem',
    background: 'var(--color-surface)',
    borderRadius: '16px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    margin: '0 1rem',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2.25rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: 'var(--color-accent)',
    fontWeight: '700',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    marginBottom: '2.5rem',
    fontSize: '0.95rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  input: {
    padding: '0.75rem 1rem',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    paddingRight: '2.75rem',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  toggleButton: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    fontSize: '1.2rem',
    color: 'var(--color-text-muted)',
  },
  error: {
    color: 'var(--color-danger)',
    fontSize: '0.9rem',
    margin: '0',
  },
  button: {
    padding: '0.75rem',
    background: 'var(--color-accent)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  hint: {
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
};
