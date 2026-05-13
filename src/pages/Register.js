import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockUsers } from '../data/mockData';
import '../App.css';

function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required.';
    else if (form.username.trim().length < 3) e.username = 'Username must be at least 3 characters.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.';
    else if (mockUsers.find(u => u.email === form.email.trim())) e.email = 'This email is already registered.';
    if (!form.password.trim()) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!form.confirm.trim()) e.confirm = 'Please confirm your password.';
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const newUser = {
      userID: mockUsers.length + 1,
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role
    };
    mockUsers.push(newUser);
    setSuccess(`Account created for "${newUser.username}"! Redirecting to login...`);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '420px' }}>
        <div className="auth-logo">Spend<span>Smart</span></div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join SpendSmart today</p>

        {success && <div className="alert alert-success show">{success}</div>}

        <form onSubmit={handleRegister} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" placeholder="e.g. jane_doe"
              value={form.username} onChange={e => update('username', e.target.value)}
              className={errors.username ? 'input-error' : ''} />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="you@student.ac.za"
              value={form.email} onChange={e => update('email', e.target.value)}
              className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => update('password', e.target.value)}
              className={errors.password ? 'input-error' : ''} />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm Password</label>
            <input type="password" id="confirm" placeholder="Repeat your password"
              value={form.confirm} onChange={e => update('confirm', e.target.value)}
              className={errors.confirm ? 'input-error' : ''} />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>

          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={e => update('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn" style={{ marginTop: '8px' }}>Create Account</button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;