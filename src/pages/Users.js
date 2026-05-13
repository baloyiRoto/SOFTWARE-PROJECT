import React, { useState } from 'react';
import '../App.css';

function Users(props) {

  const users = props.users || [];
  const setUsers = props.setUsers;
  const nextUserID = props.nextUserID;
  const setNextUserID = props.setNextUserID;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delID, setDelID] = useState(null);

  const [alert, setAlert] = useState({
    show: false,
    msg: '',
    type: ''
  });

  const showAlert = (
    msg,
    type = 'alert-success'
  ) => {
    setAlert({
      show: true,
      msg,
      type
    });

    setTimeout(() => {
      setAlert({
        show: false,
        msg: '',
        type: ''
      });
    }, 4000);
  };

  // ADD USER
  const addUser = () => {

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      showAlert(
        'All fields are required.',
        'alert-error'
      );
      return;
    }

    if (password.length < 6) {
      showAlert(
        'Password must be at least 6 characters.',
        'alert-error'
      );
      return;
    }

    if (
      users.find(
        u =>
          u.email.toLowerCase() ===
          email.trim().toLowerCase()
      )
    ) {
      showAlert(
        'That email is already registered.',
        'alert-error'
      );
      return;
    }

    const newUser = {
      userID: nextUserID,
      username: username.trim(),
      email: email.trim(),
      role
    };

    setUsers(prev => [newUser, ...prev]);

    setNextUserID(prev => prev + 1);

    setUsername('');
    setEmail('');
    setPassword('');

    showAlert('User added successfully!');
  };

  // UPDATE USER
  const saveEdit = () => {

    if (
      !editUser.username.trim() ||
      !editUser.email.trim()
    ) {
      showAlert(
        'Username and email required.',
        'alert-error'
      );
      return;
    }

    setUsers(
      users.map(u =>
        u.userID === editUser.userID
          ? editUser
          : u
      )
    );

    setEditOpen(false);

    showAlert(
      `"${editUser.username}" updated!`
    );
  };

  // DELETE USER
  const confirmDelete = () => {

    const name = users.find(
      u => u.userID === delID
    )?.username;

    setUsers(
      users.filter(
        u => u.userID !== delID
      )
    );

    setDelOpen(false);

    showAlert(`"${name}" deleted.`);
  };

  return (
    <main>

      <div className="page-hero">
        <h1>
          User <em>Management</em>
        </h1>

        <p>Add users here</p>
      </div>

      {alert.show && (
        <div className={`alert show ${alert.type}`}>
          {alert.msg}
        </div>
      )}

      <div className="layout">

        {/* ADD FORM */}
        <div className="card">

          <div className="card-title">
            Add New User
          </div>

          <div className="field">
            <label>Username *</label>

            <input
              type="text"
              placeholder="e.g. boipelo_m"
              value={username}
              onChange={e =>
                setUsername(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Email Address *</label>

            <input
              type="email"
              placeholder="student@ac.za"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Password *</label>

            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Role</label>

            <select
              value={role}
              onChange={e =>
                setRole(e.target.value)
              }
            >
              <option value="student">
                Student
              </option>

              <option value="admin">
                Admin
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          <button
            className="btn"
            onClick={addUser}
          >
            Add User
          </button>
        </div>

        {/* USER TABLE */}
        <div className="card">

          <div className="card-title">
            All Users
          </div>

          <div className="table-top">
            <span className="badge-count">
              {users?.length || 0} records
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {users?.map(u => (

                <tr key={u.userID}>

                  <td className="id-cell">
                    #{u.userID}
                  </td>

                  <td>
                    <strong>{u.username}</strong>
                  </td>

                  <td>{u.email}</td>

                  <td>
                    <span
                      className={`role-pill role-${u.role}`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td
                    style={{
                      display: 'flex',
                      gap: 6
                    }}
                  >

                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditUser({ ...u });
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="del-btn"
                      onClick={() => {
                        setDelID(u.userID);
                        setDelOpen(true);
                      }}
                    >
                      Delete
                    </button>

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

            <div className="field">
              <label>Username</label>

              <input
                type="text"
                value={editUser.username}
                onChange={e =>
                  setEditUser({
                    ...editUser,
                    username: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Email Address</label>

              <input
                type="email"
                value={editUser.email}
                onChange={e =>
                  setEditUser({
                    ...editUser,
                    email: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Role</label>

              <select
                value={editUser.role}
                onChange={e =>
                  setEditUser({
                    ...editUser,
                    role: e.target.value
                  })
                }
              >
                <option value="student">
                  Student
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <div className="modal-btns">

              <button
                className="btn-cancel"
                onClick={() =>
                  setEditOpen(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-save"
                onClick={saveEdit}
              >
                Save Changes
              </button>

            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {delOpen && (

        <div className="confirm-overlay open">

          <div className="confirm-box">

            <h2>Delete User?</h2>

            <p>
              This action is permanent and
              cannot be undone.
            </p>

            <div className="confirm-btns">

              <button
                className="btn-cancel"
                onClick={() =>
                  setDelOpen(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-confirm"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default Users;