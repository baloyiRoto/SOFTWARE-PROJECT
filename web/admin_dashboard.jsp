<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@page import="com.spendwise.model.UserDAO, java.util.List"%>
<!DOCTYPE html>
<html>
<head>
    <title>SpendSmart — Admin</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <%
        UserDAO dao = new UserDAO();
        int totalUsers = dao.getTotalUserCount();
        List<String[]> users = dao.getAllUsers();
    %>
    <header>
        <div class="logo">Spend<span>Smart</span></div>
        <nav class="nav">
            <a href="admin_dashboard.jsp" class="active">Users</a>
            <a href="inventory.jsp">Inventory</a>
            <a href="index.jsp">Logout</a>
        </nav>
    </header>
    <main>
        <div class="page-hero">
            <h1>User <em>Management</em></h1>
            <p>Currently overseeing <strong><%= totalUsers %></strong> registered users.</p>
        </div>

        <div class="layout">
            <div class="card">
                <div class="card-title">Add New User</div>
                <form action="addUser.do" method="POST">
                    <div class="field"><label>Username</label><input type="text" name="name" required></div>
                    <div class="field"><label>Email</label><input type="email" name="email" required></div>
                    <div class="field"><label>Password</label><input type="password" name="pw" required></div>
                    <div class="field">
                        <label>Role</label>
                        <select name="role"> <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Add User</button>
                </form>
            </div>

            <div class="card">
                <div class="card-title">All Users</div>
                <table>
                    <thead>
                        <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th></tr>
                    </thead>
                    <tbody>
                        <% for(String[] u : users) { %>
                        <tr>
                            <td>#<%= u[0] %></td>
                            <td><strong><%= u[1] %></strong></td>
                            <td><%= u[2] %></td>
                            <td><span class="role-pill role-<%= u[3] %>"><%= u[3] %></span></td>
                        </tr>
                        <% } %>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</body>
</html>