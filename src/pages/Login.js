import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../data/mockData';
import '../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!password.trim()) newErrors.password = 'Password is required.';
    return newErrors;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    const found = mockUsers.find(
      u => u.email === email.trim() && u.password === password.trim()
    );
    if (!found) {
      setAuthError('Invalid email or password. Please try again.');
      return;
    }
    login({
  userID: found.userID,
  username: found.username,
  email: found.email,
  role: found.role.toLowerCase()
});
    navigate(found.role === 'admin' ? '/users' : '/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Spend<span>Smart</span></div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>

        {authError && <div className="alert alert-error show">{authError}</div>}

        <form onSubmit={handleLogin} noValidate>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="you@student.ac.za"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn" style={{ marginTop: '8px' }}>Sign In</button>
        </form>

        <p className="auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <div className="auth-hint">
          <p><strong>Admin:</strong> admin@spendsmart.com / Adm!n@99</p>
          <p><strong>Student:</strong> kevin@student.ac.za / kev#2026</p>
        </div>
      </div>
    </div>
  );
}

export default Login;