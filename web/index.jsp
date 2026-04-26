<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SpendSmart — Welcome</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <header>
            <div class="logo">Spend<span>Smart</span></div>
            <nav class="nav">
                <a href="login.jsp" class="active">Login</a>
                <a href="register.jsp">Register</a>
            </nav>
        </header>

        <main style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh;">
            <div class="page-hero" style="text-align: center;">
                <h1>Smart Budgeting for <em>Students</em></h1>
                 <p>Your professional student expense management system.</p>
            </div>

            <div style="margin-top: 40px;">
                <a href="login.jsp" class="btn" style="text-decoration: none; padding: 12px 50px; display: inline-block; width: auto;">Get Started</a>
            </div>
        </main>
    </body>
</html>