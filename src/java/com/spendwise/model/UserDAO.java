package com.spendwise.model;

import com.spendwise.utils.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {
    
    public String authenticateUser(String email, String password) {
    String role = null;
    // Use the exact names from your table: USERS and EMAIL
    String sql = "SELECT ROLE FROM USERS WHERE EMAIL = ? AND PASSWORD_HASH = ?";
    
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        
        ps.setString(1, email);
        ps.setString(2, password);
        
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                role = rs.getString("ROLE");
            }
        }
    } catch (SQLException e) { 
        e.printStackTrace(); 
    }
    return role;
}
    // 2. Method to get total count using the Procedure (4 Marks)
    public int getTotalUserCount() {
        int count = 0;
        try (Connection conn = DBConnection.getConnection();
             CallableStatement cs = conn.prepareCall("{call GetUserCount(?)}")) {
            cs.registerOutParameter(1, Types.INTEGER);
            cs.execute();
            count = cs.getInt(1);
        } catch (SQLException e) { e.printStackTrace(); }
        return count;
    }

    // 3. Method to fetch all users for the table (DML/Business Meaning)
    public List<String[]> getAllUsers() {
        List<String[]> list = new ArrayList<>();
        String sql = "SELECT user_id, full_name, email, role FROM Users";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                    rs.getString("user_id"), 
                    rs.getString("full_name"), 
                    rs.getString("email"), 
                    rs.getString("role")
                });
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }
}