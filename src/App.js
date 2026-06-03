import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Users      from './pages/Users';
import Expenses   from './pages/Expenses';
import Categories from './pages/Categories';
import Budgets    from './pages/Budgets';
import Reports    from './pages/Reports';
import Inventory  from './pages/Inventory';
import RecipeGenerator from './pages/RecipeGenerator';
import ShoppingSuggestions from './pages/ShoppingSuggestions';
import ModuleSelection from './pages/ModuleSelection';
import About      from './pages/About';
import Contact    from './pages/Contact';
import Tutorial   from './pages/Tutorial';
import { SESSION_KEY, hashPassword } from './auth';

function Header({ currentUser, onLogout }) {
  const location = useLocation();
  const currentModule = location.pathname.startsWith('/spendsmart') ? 'spendsmart' :
                       location.pathname.startsWith('/mealmate') ? 'mealmate' : null;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header>
      <div className="logo">Student<span>Hub</span></div>
      <div className="header-actions">
        <nav className="nav">
          {currentModule === 'spendsmart' ? (
            <>
              {isAdmin && (
                <NavLink to="/spendsmart/users" className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
              )}
              <NavLink to="/spendsmart/categories" className={({ isActive }) => isActive ? 'active' : ''}>Categories</NavLink>
              <NavLink to="/spendsmart/budgets"    className={({ isActive }) => isActive ? 'active' : ''}>Budgets</NavLink>
              <NavLink to="/spendsmart/expenses"   className={({ isActive }) => isActive ? 'active' : ''}>Expenses</NavLink>
              <NavLink to="/spendsmart/reports"    className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
              {!isAdmin && (
                <div className="module-switcher">
                  <span>Switch to:</span>
                  <NavLink to="/mealmate/inventory">MealMate</NavLink>
                </div>
              )}
            </>
          ) : currentModule === 'mealmate' && !isAdmin ? (
            <>
              <NavLink to="/mealmate/inventory"  className={({ isActive }) => isActive ? 'active' : ''}>Inventory</NavLink>
              <NavLink to="/mealmate/recipes"    className={({ isActive }) => isActive ? 'active' : ''}>Recipes</NavLink>
              <NavLink to="/mealmate/shopping"   className={({ isActive }) => isActive ? 'active' : ''}>Shopping</NavLink>
              <div className="module-switcher">
                <span>Switch to:</span>
                <NavLink to="/spendsmart/reports">SpendSmart</NavLink>
              </div>
            </>
          ) : null}
        </nav>
        <div className="user-chip">
          <span>{currentUser.username}</span>
          <button type="button" className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <h3>StudentHub</h3>
          <p>Your all-in-one student management platform for tracking expenses, budgets, and meal planning.</p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <NavLink to="/about">About Us</NavLink>
          <NavLink to="/contact">Contact Us</NavLink>
        </div>
        <div className="footer-section">
          <h3>Resources</h3>
          <a href="https://www.varsityvibe.co.za" target="_blank" rel="noopener noreferrer">Varsity Vibe</a>
          <a href="https://www.studentlife.co.za" target="_blank" rel="noopener noreferrer">Student Life SA</a>
          <a href="https://www.careers24.com" target="_blank" rel="noopener noreferrer">Careers24</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 StudentHub. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ── Default users (only used on very first run ever) ──────────────────────
const INITIAL_USERS = [
  { userID: 1, username: 'kevin_jones',    email: 'kevin@student.ac.za',    role: 'student', passwordHash: '3bfdee9d9864b02016172ac134d97c5fcbd28866991a1e4a950ac6edf064f10d' },
  { userID: 2, username: 'jonathan_smith', email: 'jonathan@student.ac.za', role: 'student', passwordHash: '82eb7cacb7f23d491c42ba76e2864c88260e3b14cc6b896bf1a8273906ab1eec' },
  { userID: 3, username: 'amina_kristen',  email: 'amina@student.ac.za',    role: 'student', passwordHash: '96bd3eb0ab4c7a704fbb87507b93750f8ec731c3d687a97531f88b5f8bd078c5' },
  { userID: 4, username: 'lelo_mathosa',   email: 'lelo@student.ac.za',     role: 'student', passwordHash: '7b9c312cf8fa30876cef466116ab3d6c35be0f09d3e876ad417d67a81812e5ec' },
  { userID: 5, username: 'thabo_nkosi',    email: 'thabo@student.ac.za',    role: 'student', passwordHash: '80fd770840db42db4ac37b03af43e9af59b0c5fe89489bcf954b24e5dadca113' },
  { userID: 6, username: 'admin_user',     email: 'admin@spendsmart.com',   role: 'admin',   passwordHash: '4a647de78d0d1b741fd179453801bf1b1fa9909a4f0bef0a7c64c946870a0526' },
];

function readSessionUser() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function LoginPage({ users, onLogin, onBackfillPasswordHash }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitLogin = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = users.find(candidate => candidate.email.toLowerCase() === normalizedEmail);

      if (!user) {
        setError('No account matches that email address.');
        return;
      }

      const submittedHash = await hashPassword(password);
      let expectedHash = user.passwordHash;

      if (!expectedHash) {
        expectedHash = await hashPassword(user.username);
        onBackfillPasswordHash(user.userID, expectedHash);
      }

      if (submittedHash !== expectedHash) {
        setError('Incorrect password.');
        return;
      }

      onLogin({
        userID: user.userID,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch {
      setError('Unable to verify credentials in this browser.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-badge">Secure access</div>
        <h1>Sign in to SpendSmart</h1>
        <p>Use your registered email and password to open the dashboard. Seeded demo accounts use their username as the password.</p>

        <form className="auth-form" onSubmit={submitLogin}>
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-note">Admin users can manage accounts. Other pages stay locked until you sign in.</p>
      </section>
    </main>
  );
}

function SignUpPage({ users, onCreateAccount }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitSignUp = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanUsername || !cleanEmail || !password.trim()) {
        setError('All fields are required.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      if (users.some(user => user.email.toLowerCase() === cleanEmail)) {
        setError('That email is already registered.');
        return;
      }

      const passwordHash = await hashPassword(password);
      onCreateAccount({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
      });
    } catch {
      setError('Unable to create your account in this browser.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="auth-badge">Create account</div>
        <h1>Sign up for SpendSmart</h1>
        <p>Create a student account to track your own expenses, budgets, categories, and reports.</p>

        <form className="auth-form" onSubmit={submitSignUp}>
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              autoComplete="username"
              placeholder="e.g. boipelo_m"
              value={username}
              onChange={event => setUsername(event.target.value)}
            />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="student@ac.za"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  );
}

function LandingPage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="auth-badge">SpendSmart</div>
        <h1>Track student spending with clarity.</h1>
        <p>
          Sign in to manage your own records, or create a student account and start logging expenses, budgets,
          and reports from one place.
        </p>

        <div className="landing-actions">
          <NavLink className="landing-btn landing-btn-primary" to="/login">Sign In</NavLink>
          <NavLink className="landing-btn landing-btn-secondary" to="/signup">Sign Up</NavLink>
        </div>
      </section>
    </main>
  );
}

function App() {
  // ── Single shared users list — lives here in App, passed to all pages ──
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch { return INITIAL_USERS; }
  });

  const [currentUser, setCurrentUser] = useState(() => readSessionUser());
  const [showTutorial, setShowTutorial] = useState(false);

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

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;

    const migrateUsers = async () => {
      const needsMigration = users.some(user => !user.passwordHash);
      if (!needsMigration) {
        return;
      }

      const migrated = await Promise.all(users.map(async user => {
        if (user.passwordHash) {
          return user;
        }

        return {
          ...user,
          passwordHash: await hashPassword(user.username),
        };
      }));

      if (!cancelled) {
        setUsers(migrated);
      }
    };

    migrateUsers();

    return () => {
      cancelled = true;
    };
  }, [users]);

  const handleLogin = user => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleBackfillPasswordHash = (userID, passwordHash) => {
    setUsers(prevUsers => prevUsers.map(user =>
      user.userID === userID ? { ...user, passwordHash } : user
    ));
  };

  const handleCreateAccount = ({ username, email, passwordHash }) => {
    const newUser = {
      userID: nextUserID,
      username,
      email,
      role: 'student',
      passwordHash,
    };

    setUsers(prevUsers => [newUser, ...prevUsers]);
    setNextUserID(prev => prev + 1);
    setCurrentUser({
      userID: newUser.userID,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
    
    // Show tutorial for new users
    setShowTutorial(true);
  };

  const RequireAuth = ({ children, adminOnly = false }) => {
    if (!currentUser) {
      return <Navigate to="/" replace />;
    }

    if (adminOnly && currentUser.role !== 'admin') {
      return <Navigate to="/reports" replace />;
    }

    return children;
  };

  return (
    <Router>
      {currentUser && <Header currentUser={currentUser} onLogout={handleLogout} />}

      <Routes>
        <Route path="/" element={currentUser ? <Navigate to="/modules" replace /> : <LandingPage />} />
        <Route path="/login" element={currentUser ? <Navigate to="/modules" replace /> : <LoginPage users={users} onLogin={handleLogin} onBackfillPasswordHash={handleBackfillPasswordHash} />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/modules" replace /> : <SignUpPage users={users} onCreateAccount={handleCreateAccount} />} />
        <Route path="/modules" element={<RequireAuth><ModuleSelection currentUser={currentUser} /></RequireAuth>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* SpendSmart Module Routes */}
        <Route path="/spendsmart" element={<RequireAuth><Navigate to="/spendsmart/categories" replace /></RequireAuth>} />
        <Route path="/spendsmart/users" element={
          <RequireAuth adminOnly>
            <Users users={users} setUsers={setUsers} nextUserID={nextUserID} setNextUserID={setNextUserID} />
          </RequireAuth>
        }/>
        <Route path="/spendsmart/expenses"   element={<RequireAuth><Expenses   users={users} currentUser={currentUser} /></RequireAuth>} />
        <Route path="/spendsmart/categories" element={<RequireAuth><Categories currentUser={currentUser} /></RequireAuth>} />
        <Route path="/spendsmart/budgets"    element={<RequireAuth><Budgets    users={users} currentUser={currentUser} /></RequireAuth>} />
        <Route path="/spendsmart/reports"    element={<RequireAuth><Reports    users={users} currentUser={currentUser} /></RequireAuth>} />
        
        {/* MealMate Module Routes */}
        <Route path="/mealmate" element={<RequireAuth><Navigate to="/mealmate/inventory" replace /></RequireAuth>} />
        <Route path="/mealmate/inventory" element={
          <RequireAuth>
            {currentUser?.role === 'admin' ? <Navigate to="/spendsmart/reports" replace /> : <Inventory users={users} currentUser={currentUser} />}
          </RequireAuth>
        } />
        <Route path="/mealmate/recipes" element={
          <RequireAuth>
            {currentUser?.role === 'admin' ? <Navigate to="/spendsmart/reports" replace /> : <RecipeGenerator users={users} currentUser={currentUser} />}
          </RequireAuth>
        } />
        <Route path="/mealmate/shopping" element={
          <RequireAuth>
            {currentUser?.role === 'admin' ? <Navigate to="/spendsmart/reports" replace /> : <ShoppingSuggestions users={users} currentUser={currentUser} />}
          </RequireAuth>
        } />
      </Routes>

      <Footer />
      
      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}
    </Router>
  );
}

export default App;
