import React, { useState } from 'react';
import { hashPassword } from '../auth';
import '../App.css';

// Users now receives users list from App.js — no more local state for users
function Users({ users, setUsers, nextUserID, setNextUserID }) {

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [delOpen, setDelOpen]   = useState(false);
  const [delID, setDelID]       = useState(null);
  const [alert, setAlert]       = useState({ show: false, msg: '', type: '' });
  
  // Add user form state
  const [addOpen, setAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('student');

  const showAlert = (msg, type = 'alert-success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 4000);
  };

  // ADD NEW USER
  const addUser = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      showAlert('All fields are required.', 'alert-error'); return;
    }
    
    if (newPassword.length < 6) {
      showAlert('Password must be at least 6 characters.', 'alert-error'); return;
    }
    
    if (users.some(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
      showAlert('That email is already registered.', 'alert-error'); return;
    }
    
    const passwordHash = await hashPassword(newPassword);
    const newUser = {
      userID: nextUserID,
      username: newUsername.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      passwordHash
    };
    
    setUsers([...users, newUser]);
    setNextUserID(nextUserID + 1);
    setAddOpen(false);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('student');
    showAlert(`User "${newUsername}" added successfully!`);
  };

  // UPDATE
  const saveEdit = () => {
    if (!editUser.username.trim() || !editUser.email.trim()) {
      showAlert('Username and email required.', 'alert-error'); return;
    }
    setUsers(users.map(u => u.userID === editUser.userID ? { ...editUser, passwordHash: u.passwordHash } : u));
    setEditOpen(false);
    showAlert(`"${editUser.username}" updated!`);
  };

  // DELETE
  const confirmDelete = () => {
    const name = users.find(u => u.userID === delID)?.username;
    setUsers(users.filter(u => u.userID !== delID));
    setDelOpen(false);
    showAlert(`"${name}" deleted.`);
  };

  return (
    <main>
      <div className="page-hero">
        <h1>User <em>Management</em></h1>
        <p>Manage user accounts and permissions.</p>
      </div>

      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="layout">
        {/* ── USER TABLE ── */}
        <div className="card user-table-full">
          <div className="card-title">
            All Users
            <button 
              className="btn" 
              onClick={() => setAddOpen(true)}
              style={{ float: 'right', fontSize: '0.8rem', padding: '4px 12px' }}
            >
              + Add User
            </button>
          </div>
          <div className="table-top">
            <span className="badge-count">{users.length} records</span>
          </div>
          <table>
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userID}>
                  <td className="id-cell">#{u.userID}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`role-pill role-${u.role}`}>{u.role}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="edit-btn" onClick={() => { setEditUser({ ...u }); setEditOpen(true); }}>Edit</button>
                    <button className="del-btn"  onClick={() => { setDelID(u.userID); setDelOpen(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2>Update User</h2>
            <div className="field"><label>Username</label>
              <input type="text" value={editUser.username}
                onChange={e => setEditUser({ ...editUser, username: e.target.value })} /></div>
            <div className="field"><label>Email Address</label>
              <input type="email" value={editUser.email}
                onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div>
            <div className="field"><label>Role</label>
              <select value={editUser.role}
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="other">Other</option>
              </select></div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn-save"   onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {addOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2>Add New User</h2>
            <div className="field"><label>Username *</label>
              <input type="text" placeholder="e.g. john_doe"
                value={newUsername} onChange={e => setNewUsername(e.target.value)} /></div>
            <div className="field"><label>Email Address *</label>
              <input type="email" placeholder="student@ac.za"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
            <div className="field"><label>Password *</label>
              <input type="password" placeholder="Min. 6 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
            <div className="field"><label>Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="other">Other</option>
              </select></div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={addUser}>Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {delOpen && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <h2>Delete User?</h2>
            <p>This action is permanent and cannot be undone.</p>
            <div className="confirm-btns">
              <button className="btn-cancel"  onClick={() => setDelOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Users;
