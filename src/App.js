import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';

import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';

function Nav() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <header>
      <div className="logo">
        Spend<span>Smart</span>
      </div>

      <nav className="nav">
        {!isAdmin && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Dashboard
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Users
          </NavLink>
        )}

        <NavLink
          to="/expenses"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Expenses
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/categories"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Categories
          </NavLink>
        )}

        <NavLink
          to="/budgets"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Budgets
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Reports
        </NavLink>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          {user.username}

          <span
            style={{
              marginLeft: '6px',
              background:
                user.role === 'admin'
                  ? '#fef3e2'
                  : 'var(--purple-light)',
              color:
                user.role === 'admin'
                  ? '#b45309'
                  : 'var(--purple)',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 600
            }}
          >
            {user.role}
          </span>
        </span>

        <button
          onClick={logout}
          style={{
            background: 'none',
            border: '1.5px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            transition: 'all 0.2s'
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function AppRoutes({
  users,
  setUsers,
  nextUserID,
  setNextUserID
}) {
  const { user } = useAuth();

  return (
    <>
      <Nav />

      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={user.role === 'admin' ? '/users' : '/dashboard'}
              />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly>
              <Users
                users={users}
                setUsers={setUsers}
                nextUserID={nextUserID}
                setNextUserID={setNextUserID}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute adminOnly>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <Budgets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? user.role === 'admin'
                    ? '/users'
                    : '/dashboard'
                  : '/login'
              }
            />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  const [users, setUsers] = useState([]);
  const [nextUserID, setNextUserID] = useState(1);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes
          users={users}
          setUsers={setUsers}
          nextUserID={nextUserID}
          setNextUserID={setNextUserID}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;