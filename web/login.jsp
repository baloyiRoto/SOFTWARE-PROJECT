<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <title>SpendSmart — Login</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="logo">Spend<span>Smart</span></div>
    </header>
    <main style="display: flex; justify-content: center; padding-top: 50px;">
        <div class="card" style="width: 400px;">
            <div class="card-title">Account Login</div>
            
            <form action="loginServlet.do" method="POST">
                <div class="field">
                    <label>Email Address</label>
                    <input type="email" name="email" required>
                </div>
                <div class="field">
                    <label>Password</label>
                    <input type="password" name="password" required>
                </div>
                <button type="submit" class="btn">Sign In</button>
            </form>
            <p style="margin-top: 20px; font-size: 0.8rem; text-align: center; color: var(--muted);">
                New here? <a href="register.jsp" style="color: var(--purple);">Create an account</a>
            </p>
        </div>
    </main>
</body>
</html>