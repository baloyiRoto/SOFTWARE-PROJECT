import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import Users      from './pages/Users';
import Expenses   from './pages/Expenses';
import Categories from './pages/Categories';
import Budgets    from './pages/Budgets';
import Reports    from './pages/Reports';

// ── Default users (only used on very first run ever) ──────────────────────
const INITIAL_USERS = [
  { userID: 1, username: 'kevin_jones',    email: 'kevin@student.ac.za',    role: 'student' },
  { userID: 2, username: 'jonathan_smith', email: 'jonathan@student.ac.za', role: 'student' },
  { userID: 3, username: 'amina_kristen',  email: 'amina@student.ac.za',    role: 'student' },
  { userID: 4, username: 'lelo_mathosa',   email: 'lelo@student.ac.za',     role: 'student' },
  { userID: 5, username: 'thabo_nkosi',    email: 'thabo@student.ac.za',    role: 'student' },
  { userID: 6, username: 'admin_user',     email: 'admin@spendsmart.com',   role: 'admin'   },
];

function App() {
  // ── Single shared users list — lives here in App, passed to all pages ──
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch { return INITIAL_USERS; }
  });

  const [nextUserID, setNextUserID] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_users_nid');
      return saved ? parseInt(saved) : 7;
    } catch { return 7; }
  });

  // Save to localStorage whenever users change
  useEffect(() => {
    localStorage.setItem('ss_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ss_users_nid', String(nextUserID));
  }, [nextUserID]);

  return (
    <Router>
      <header>
        <div className="logo">Spend<span>Smart</span></div>
        <nav className="nav">
          <NavLink to="/users"      className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
          <NavLink to="/expenses"   className={({ isActive }) => isActive ? 'active' : ''}>Expenses</NavLink>
          <NavLink to="/categories" className={({ isActive }) => isActive ? 'active' : ''}>Categories</NavLink>
          <NavLink to="/budgets"    className={({ isActive }) => isActive ? 'active' : ''}>Budgets</NavLink>
          <NavLink to="/reports"    className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={
          <Users users={users} setUsers={setUsers} nextUserID={nextUserID} setNextUserID={setNextUserID} />
        }/>
        <Route path="/users" element={
          <Users users={users} setUsers={setUsers} nextUserID={nextUserID} setNextUserID={setNextUserID} />
        }/>
        <Route path="/expenses"   element={<Expenses   users={users} />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/budgets"    element={<Budgets    users={users} />} />
        <Route path="/reports"    element={<Reports    users={users} />} />
      </Routes>
    </Router>
  );
}

export default App;
