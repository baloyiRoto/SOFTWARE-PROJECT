package com.spendwise.web;

import com.spendwise.model.UserDAO;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;

// This MUST match the action in your JSP + the .do extension
@WebServlet(name = "LoginServlet", urlPatterns = {"/login.do"})
public class loginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        UserDAO userDAO = new UserDAO();
        String role = userDAO.authenticateUser(email, password);

        if (role != null) {
            HttpSession session = request.getSession();
            session.setAttribute("userRole", role);
            
            if (role.equalsIgnoreCase("admin")) {
                response.sendRedirect("admin_dashboard.jsp");
            } else {
                response.sendRedirect("user_home.jsp");
            }
        } else {
            // If it fails, go back to login with an error message
            response.sendRedirect("login.jsp?error=1");
        }
    }
}